import "server-only";

import { createAdminClient } from "@/lib/db/admin";
import type { Database } from "@/lib/db/types";
import { invoiceProvider, type InvoiceProvider } from "@/lib/invoice";
import {
  loadFulfillment,
  type Fulfillment,
} from "@/lib/orders/fulfillment-data";
import { adminOrderUrl } from "@/lib/orders/notice-data";
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
// safely (retries, admin "Tentar de novo"). Label and print hold the
// order's fulfillment lease (database) while they spend money or paper.

type OrderStatus = Database["public"]["Enums"]["order_status"];
type Admin = ReturnType<typeof createAdminClient>;

/** Every write that marks a step as done must have happened. */
function must<T extends { error: { message: string } | null }>(
  r: T,
  what: string,
): T {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r;
}

async function enqueue(admin: Admin, tipo: "label" | "print", orderId: string) {
  must(
    await admin.rpc("enqueue_job", {
      p_tipo: tipo,
      p_order_id: orderId,
      p_etapa: "",
    }),
    `enqueue ${tipo}`,
  );
}

async function setStatus(admin: Admin, orderId: string, status: OrderStatus) {
  must(
    await admin.rpc("set_order_status", {
      p_order_id: orderId,
      p_status: status,
      p_detalhe: { origem: "fila" },
    }),
    `status ${status}`,
  );
}

/**
 * Runs `work` holding the order's fulfillment lease, shared by every
 * process. Taking it re-checks, under the order's row lock, that the order
 * can still be fulfilled; a refund or cancel is refused while it is held.
 */
async function withLease<T>(
  admin: Admin,
  orderId: string,
  tipo: "label" | "print",
  work: () => Promise<T>,
): Promise<T | "inelegivel"> {
  const { data, error } = await admin.rpc("fulfillment_lock", {
    p_order_id: orderId,
    p_tipo: tipo,
    p_segundos: 300,
  });
  if (error) throw new Error(`fulfillment_lock: ${error.message}`);
  if (data === "inelegivel") return "inelegivel";
  if (data !== "ok") {
    throw new Error(
      "Outra execução está cuidando deste pedido; a fila tenta de novo",
    );
  }
  try {
    return await work();
  } finally {
    await admin.rpc("fulfillment_unlock", { p_order_id: orderId });
  }
}

/** Order status re-read right before a paid or physical effect. */
async function stillEligible(
  admin: Admin,
  orderId: string,
  allowed: OrderStatus[],
): Promise<boolean> {
  const { data } = must(
    await admin.from("orders").select("status").eq("id", orderId).single(),
    "pedido",
  );
  return Boolean(data && allowed.includes(data.status));
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
          must(
            await admin
              .from("invoices")
              .upsert(
                { order_id: f.id, status: "pendente_manual" },
                { onConflict: "order_id", ignoreDuplicates: true },
              ),
            "nota pendente",
          );
          must(
            await admin.from("order_events").insert({
              order_id: f.id,
              evento: "nota_manual_pendente",
              detalhe: { motivo: "NF-e automática desligada" },
            }),
            "evento da nota",
          );
        }
        await enqueue(admin, "label", f.id);
        return "Nota à mão: NF-e automática desligada; etiqueta com declaração de conteúdo";
      }
      must(
        await admin
          .from("invoices")
          .upsert(
            { order_id: f.id, status: "autorizada", chave: r.chave },
            { onConflict: "order_id" },
          ),
        "nota",
      );
      await setStatus(admin, f.id, "invoiced");
    }
    await enqueue(admin, "label", f.id);
  };
}

// ---------------------------------------------------------------------------

const LABEL_OK: OrderStatus[] = ["paid", "invoiced", "label_ready"];

export function labelHandler(
  client: LabelClient = createLabelClient(),
): JobHandler {
  return async (job) => {
    const admin = createAdminClient();
    const r = await withLease(admin, job.order_id, "label", () =>
      buyLabel(admin, client, job.order_id),
    );
    if (r === "inelegivel") {
      return skip(await loadFulfillment(job.order_id), "etiqueta");
    }
    return r;
  };
}

async function buyLabel(
  admin: Admin,
  client: LabelClient,
  orderId: string,
): Promise<string | void> {
  const f = await loadFulfillment(orderId);
  if (f.shipment?.etiqueta_path && f.status === "label_ready") {
    await enqueue(admin, "print", f.id);
    return "Etiqueta já existia";
  }
  if (!f.freteServicoId) {
    throw new Error("Pedido sem o serviço de frete do Melhor Envio");
  }

  // The Melhor Envio id is saved BEFORE paying, and the database never lets
  // it change: a retry continues that same label, never buys a second one.
  let meId = f.shipment?.me_order_id ?? null;
  if (!meId) {
    const cart = await client.addToCart(
      buildCartRequest(f.label(f.freteServicoId)),
    );
    const { data: saved } = must(
      await admin
        .from("shipments")
        .update({
          me_order_id: cart.cartId,
          me_status: cart.status,
          servico: f.freteServico,
          status: "no_carrinho",
        })
        .eq("order_id", f.id)
        .is("me_order_id", null)
        .select("me_order_id"),
      "shipments",
    );
    if (!saved || saved.length !== 1) {
      throw new Error("A etiqueta deste pedido já estava registrada");
    }
    meId = cart.cartId;
  }

  let meStatus = await client.status(meId);
  if (meStatus === "canceled" || meStatus === "expired") {
    throw new Error(
      `Etiqueta ${meStatus} no Melhor Envio: confira no painel do Melhor Envio antes de tentar de novo`,
    );
  }
  if (meStatus === "pending") {
    // Last check before spending the wallet balance.
    if (!(await stillEligible(admin, f.id, LABEL_OK))) {
      return "Pulado: o pedido mudou de status antes da compra da etiqueta";
    }
    await client.checkout(meId);
    meStatus = "released";
  }
  // Melhor Envio keeps "released" after generation: our own me_status
  // remembers that generation was asked, so a retry does not ask again.
  if (meStatus === "released" && f.shipment?.me_status !== "generated") {
    await client.generate(meId);
    must(
      await admin
        .from("shipments")
        .update({ me_status: "generated" })
        .eq("order_id", f.id),
      "shipments generated",
    );
  }

  // Generation takes about a minute: until then this throws and the job is
  // retried (1, 5, 15, 60 min).
  const pdf = await client.labelPdf(meId);
  if (!isPdf(pdf)) throw new Error("A etiqueta não veio em PDF");
  const path = `etiquetas/${f.numero}.pdf`;
  await saveDocument(path, pdf);
  must(
    await admin
      .from("shipments")
      .update({ etiqueta_path: path, status: "etiqueta_pronta" })
      .eq("order_id", f.id),
    "shipments etiqueta",
  );

  if (f.status !== "label_ready") await setStatus(admin, f.id, "label_ready");
  await enqueue(admin, "print", f.id);
}

// ---------------------------------------------------------------------------

type Impressoes = Record<
  string,
  { inicio: string; enviados: Record<string, number | "repetido"> }
>;

const PRINT_OK: OrderStatus[] = ["label_ready", "printed", "shipped"];

// PrintNode forgets idempotency keys after 24 h: a round older than that is
// never resumed automatically (it could print a document twice).
const ROUND_MAX_MS = 23 * 60 * 60 * 1000;

export function printHandler(
  makePrinter: (printerId: string | null) => Printer = printNodePrinter,
  now: () => Date = () => new Date(),
): JobHandler {
  return async (job) => {
    const admin = createAdminClient();
    const r = await withLease(admin, job.order_id, "print", () =>
      printOrder(admin, makePrinter, now, job.order_id),
    );
    if (r === "inelegivel") {
      return skip(await loadFulfillment(job.order_id), "impressão");
    }
    return r;
  };
}

async function printOrder(
  admin: Admin,
  makePrinter: (printerId: string | null) => Printer,
  now: () => Date,
  orderId: string,
): Promise<string | void> {
  const f = await loadFulfillment(orderId);
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
  must(
    await admin
      .from("shipments")
      .update({ resumo_path: resumoPath })
      .eq("order_id", f.id),
    "shipments resumo",
  );

  const printer = makePrinter(f.printerId);
  if (!printer.enabled) {
    return "Não impresso: PrintNode desligado (resumo e etiqueta para baixar no admin)";
  }

  // One round per "Reimprimir" (each writes an event); automatic retries
  // resume their round, and a document already sent is never sent again.
  const { count } = must(
    await admin
      .from("order_events")
      .select("id", { count: "exact", head: true })
      .eq("order_id", f.id)
      .eq("evento", "reimpressao_pedida"),
    "reimpressões",
  );
  const rodada = `impressao-${count ?? 0}`;
  const impressoes = (f.shipment?.impressoes ?? {}) as Impressoes;
  const atual = impressoes[rodada] ?? {
    inicio: now().toISOString(),
    enviados: {},
  };
  if (now().getTime() - Date.parse(atual.inicio) > ROUND_MAX_MS) {
    return "Não impresso: tentativa antiga (mais de 23 h); use Reimprimir no admin";
  }

  const etiqueta = await readDocument(etiquetaPath);
  const docs = orderedDocs({
    resumo: {
      titulo: `${f.numero} resumo`,
      pdf: { base64: Buffer.from(resumo).toString("base64") },
    },
    etiqueta: {
      titulo: `${f.numero} etiqueta`,
      pdf: { base64: Buffer.from(etiqueta).toString("base64") },
    },
  });
  for (const doc of docs) {
    if (atual.enviados[doc.titulo] !== undefined) continue;
    if (!(await stillEligible(admin, f.id, PRINT_OK))) {
      return "Pulado: o pedido mudou de status durante a impressão";
    }
    atual.enviados[doc.titulo] = await printer.printOne(
      doc,
      `${f.id}/${rodada}/${doc.titulo}`,
    );
    must(
      await admin
        .from("shipments")
        .update({ impressoes: { ...impressoes, [rodada]: atual } })
        .eq("order_id", f.id),
      "shipments impressões",
    );
  }
  if (f.status === "label_ready") await setStatus(admin, f.id, "printed");
}
