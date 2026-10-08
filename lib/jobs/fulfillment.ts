import "server-only";

import { createAdminClient } from "@/lib/db/admin";
import type { Database } from "@/lib/db/types";
import { invoiceProvider, type InvoiceProvider } from "@/lib/invoice";
import { adminOrderUrl } from "@/lib/orders/notice-data";
import {
  loadFulfillment,
  type Fulfillment,
} from "@/lib/orders/fulfillment-data";
import { renderOrderSummary } from "@/lib/pdf/order-summary";
import { printNodePrinter, type Printer } from "@/lib/printer";
import { orderedDocs } from "@/lib/printer/printnode-request";
import { buildCartRequest } from "@/lib/shipping/melhorenvio/label-request";
import {
  createLabelClient,
  type LabelClient,
} from "@/lib/shipping/melhorenvio/labels";
import { isPdf, readDocument, saveDocument } from "@/lib/storage/documents";

import type { JobHandler } from "./worker";

// After payment: invoice -> label -> print (CLAUDE.md section 5). Each step
// enqueues the next only when it finished, and each one can run twice
// safely (retries, admin "Tentar de novo").

type OrderStatus = Database["public"]["Enums"]["order_status"];
type Admin = ReturnType<typeof createAdminClient>;

async function enqueue(admin: Admin, tipo: "label" | "print", orderId: string) {
  const { error } = await admin.rpc("enqueue_job", {
    p_tipo: tipo,
    p_order_id: orderId,
    p_etapa: "",
  });
  if (error) throw new Error(`enqueue ${tipo}: ${error.message}`);
}

async function setStatus(admin: Admin, orderId: string, status: OrderStatus) {
  const { error } = await admin.rpc("set_order_status", {
    p_order_id: orderId,
    p_status: status,
    p_detalhe: { origem: "fila" },
  });
  if (error) throw new Error(`status ${status}: ${error.message}`);
}

const skip = (f: Fulfillment, etapa: string) =>
  `Pulado: pedido em ${f.status} (${etapa} não se aplica)`;

// ---------------------------------------------------------------------------

export function invoiceHandler(
  provider: InvoiceProvider = invoiceProvider(),
): JobHandler {
  return async (job) => {
    const admin = createAdminClient();
    const f = await loadFulfillment(job.order_id);
    if (f.status !== "paid" && f.status !== "invoiced") {
      return skip(f, "nota");
    }
    if (f.status === "paid") {
      const r = await provider.emit(f.id);
      if (r.tipo === "manual") {
        // Admin issues it by hand; a note marked by hand stays "manual".
        if (!f.invoice) {
          await admin
            .from("invoices")
            .upsert(
              { order_id: f.id, status: "pendente_manual" },
              { onConflict: "order_id", ignoreDuplicates: true },
            );
          await admin.from("order_events").insert({
            order_id: f.id,
            evento: "nota_manual_pendente",
            detalhe: { motivo: "NF-e automática desligada" },
          });
        }
        await enqueue(admin, "label", f.id);
        return "Nota à mão: NF-e automática desligada; etiqueta com declaração de conteúdo";
      }
      await admin
        .from("invoices")
        .upsert(
          { order_id: f.id, status: "autorizada", chave: r.chave },
          { onConflict: "order_id" },
        );
      await setStatus(admin, f.id, "invoiced");
    }
    await enqueue(admin, "label", f.id);
  };
}

// ---------------------------------------------------------------------------

export function labelHandler(
  client: LabelClient = createLabelClient(),
): JobHandler {
  return async (job) => {
    const admin = createAdminClient();
    const f = await loadFulfillment(job.order_id);
    if (!["paid", "invoiced", "label_ready"].includes(f.status)) {
      return skip(f, "etiqueta");
    }
    if (f.shipment?.etiqueta_path && f.status === "label_ready") {
      await enqueue(admin, "print", f.id);
      return "Etiqueta já existia";
    }
    if (!f.freteServicoId) {
      throw new Error("Pedido sem o serviço de frete do Melhor Envio");
    }

    // The Melhor Envio id is saved BEFORE paying: a retry continues that
    // same label and never buys a second one.
    let meId = f.shipment?.me_order_id ?? null;
    if (!meId) {
      const cart = await client.addToCart(
        buildCartRequest(f.label(f.freteServicoId)),
      );
      const { data: saved, error } = await admin
        .from("shipments")
        .upsert(
          {
            order_id: f.id,
            me_order_id: cart.cartId,
            me_status: cart.status,
            servico: f.freteServico,
            status: "no_carrinho",
          },
          { onConflict: "order_id" },
        )
        .select("me_order_id")
        .single();
      if (error || !saved?.me_order_id) {
        throw new Error(`shipments: ${error?.message ?? "sem id"}`);
      }
      meId = saved.me_order_id;
    }

    let meStatus = await client.status(meId);
    if (meStatus === "canceled" || meStatus === "expired") {
      throw new Error(
        `Etiqueta ${meStatus} no Melhor Envio: confira no painel do Melhor Envio antes de tentar de novo`,
      );
    }
    if (meStatus === "pending") {
      await client.checkout(meId);
      meStatus = "released";
    }
    if (meStatus === "released") {
      await client.generate(meId);
      meStatus = "generated";
    }

    const pdf = await client.downloadPdf(await client.printUrl(meId));
    if (!isPdf(pdf)) throw new Error("A etiqueta não veio em PDF");
    const path = `etiquetas/${f.numero}.pdf`;
    await saveDocument(path, pdf);
    await admin
      .from("shipments")
      .update({
        etiqueta_path: path,
        me_status: meStatus,
        status: "etiqueta_pronta",
      })
      .eq("order_id", f.id);

    if (f.status !== "label_ready") await setStatus(admin, f.id, "label_ready");
    await enqueue(admin, "print", f.id);
  };
}

// ---------------------------------------------------------------------------

export function printHandler(
  makePrinter: (printerId: string | null) => Printer = printNodePrinter,
): JobHandler {
  return async (job) => {
    const admin = createAdminClient();
    const f = await loadFulfillment(job.order_id);
    if (!["label_ready", "printed", "shipped"].includes(f.status)) {
      return skip(f, "impressão");
    }
    const etiquetaPath = f.shipment?.etiqueta_path;
    if (!etiquetaPath) throw new Error("Etiqueta ainda não gerada");

    const resumo = await renderOrderSummary({
      numero: f.numero,
      criadoEm: f.criadoEm,
      cliente: { nome: f.clienteNome, telefone: f.telefone },
      endereco: f.endereco,
      itens: f.itens,
      freteServico: f.freteServico,
      transportadora: f.shipment?.transportadora ?? null,
      notaManual: f.invoice?.status === "pendente_manual",
      adminUrl: adminOrderUrl(f.numero),
    });
    const resumoPath = `resumos/${f.numero}.pdf`;
    await saveDocument(resumoPath, resumo);
    await admin
      .from("shipments")
      .update({ resumo_path: resumoPath })
      .eq("order_id", f.id);

    const printer = makePrinter(f.printerId);
    if (!printer.enabled) {
      return "Não impresso: PrintNode desligado (resumo e etiqueta para baixar no admin)";
    }
    const etiqueta = await readDocument(etiquetaPath);
    await printer.print(
      orderedDocs({
        resumo: {
          titulo: `${f.numero} resumo`,
          pdf: { base64: Buffer.from(resumo).toString("base64") },
        },
        etiqueta: {
          titulo: `${f.numero} etiqueta`,
          pdf: { base64: Buffer.from(etiqueta).toString("base64") },
        },
      }),
      // A new run (admin "Reimprimir") is a new key; a retry of the same
      // run is the same key, so the printer does not print twice.
      `${f.id}/${job.run_at}`,
    );
    if (f.status === "label_ready") await setStatus(admin, f.id, "printed");
  };
}
