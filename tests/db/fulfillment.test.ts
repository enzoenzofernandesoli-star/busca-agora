import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { Job } from "@/lib/jobs/worker";

import { createVariant, serviceClient } from "./helpers";

// The real jobs against the local database; Melhor Envio and PrintNode are
// fakes (no network, no money).
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/admin", async () => {
  const { serviceClient: client } = await import("./helpers");
  return { createAdminClient: () => client() };
});
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_SITE_URL: "https://loja.example.test",
    NFE_ENABLED: false,
    MELHORENVIO_ENV: "sandbox",
  },
  requireEnv: () => "nao-usado",
}));

const { invoiceHandler, labelHandler, printHandler } =
  await import("@/lib/jobs/fulfillment");
const { pollTracking } = await import("@/lib/shipping/tracking");

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]); // %PDF-1

function fakeLabels(opts: { failGenerateOnce?: boolean } = {}) {
  let status = "pending";
  let failed = false;
  const client = {
    addToCart: vi.fn(async () => ({
      cartId: `me-${randomUUID()}`,
      protocolo: "ORD-1",
      status: "pending",
    })),
    status: vi.fn(async () => status),
    checkout: vi.fn(async () => {
      status = "released";
    }),
    generate: vi.fn(async () => {
      if (opts.failGenerateOnce && !failed) {
        failed = true;
        throw new Error("Melhor Envio fora do ar");
      }
      status = "generated";
    }),
    printUrl: vi.fn(async () => "https://melhorenvio.example.test/imprimir/x"),
    downloadPdf: vi.fn(async () => PDF),
    track: vi.fn(),
  };
  return client;
}

function job(orderId: string, tipo: Job["tipo"]): Job {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    tipo,
    etapa: "",
    order_id: orderId,
    status: "running",
    tentativas: 0,
    ultimo_erro: null,
    run_at: now,
    created_at: now,
    updated_at: now,
  };
}

let settingsBefore: Record<string, unknown> | null = null;

beforeAll(async () => {
  const admin = serviceClient();
  const { data } = await admin
    .from("settings")
    .select("razao_social, cpf_vendedor, email_contato, endereco_origem")
    .eq("id", true)
    .single();
  settingsBefore = data;
  await admin
    .from("settings")
    .update({
      razao_social: "Loja de Teste",
      cpf_vendedor: "52998224725",
      email_contato: "sac@example.test",
      endereco_origem: {
        cep: "01001000",
        rua: "Praça da Sé",
        numero: "1",
        complemento: null,
        bairro: "Sé",
        cidade: "São Paulo",
        uf: "SP",
      },
    })
    .eq("id", true);
});

afterAll(async () => {
  if (settingsBefore) {
    await serviceClient()
      .from("settings")
      .update(settingsBefore)
      .eq("id", true);
  }
});

/** A paid order with one variant that has weight and measures. */
async function paidOrder() {
  const admin = serviceClient();
  const { variantId } = await createVariant({ estoque: 5 });
  const { data: order, error } = await admin
    .from("orders")
    .insert({
      user_id: null,
      cliente_email: "cliente@example.test",
      subtotal_cents: 8990,
      frete_cents: 1500,
      total_cents: 10490,
      frete_servico: "PAC",
      frete_servico_id: 1,
      endereco: {
        cep: "20040020",
        rua: "Rua de Teste",
        numero: "10",
        complemento: null,
        bairro: "Centro",
        cidade: "Rio de Janeiro",
        uf: "RJ",
      },
      cliente_nome: "Cliente de teste",
      cliente_cpf: "00000000191",
      payment_method: "pix",
    })
    .select("id, numero")
    .single();
  if (error) throw error;
  await admin.from("order_items").insert({
    order_id: order.id,
    variant_id: variantId,
    nome: "Fone de teste",
    sku: "FONE-1",
    ncm: "85183000",
    preco_cents: 8990,
    quantidade: 1,
  });
  await admin.rpc("reserve_stock", { p_order_id: order.id });
  const paid = await admin.rpc("set_order_status", {
    p_order_id: order.id,
    p_status: "paid",
  });
  if (paid.error) throw paid.error;
  return order as { id: string; numero: string };
}

async function orderState(orderId: string) {
  const admin = serviceClient();
  const [{ data: o }, { data: s }, { data: i }, { data: j }] =
    await Promise.all([
      admin.from("orders").select("status").eq("id", orderId).single(),
      admin.from("shipments").select("*").eq("order_id", orderId).maybeSingle(),
      admin
        .from("invoices")
        .select("status")
        .eq("order_id", orderId)
        .maybeSingle(),
      admin.from("jobs").select("tipo, etapa").eq("order_id", orderId),
    ]);
  return {
    status: o?.status,
    shipment: s,
    invoice: i?.status ?? null,
    jobs: (j ?? []).map((x) => `${x.tipo}:${x.etapa}`).sort(),
  };
}

describe("fulfillment chain", () => {
  it("paid -> invoice (manual) -> label -> print, without PrintNode", async () => {
    const order = await paidOrder();
    expect((await orderState(order.id)).jobs).toContain("invoice:");

    const skipped = await invoiceHandler()(job(order.id, "invoice"));
    expect(skipped).toMatch(/Nota à mão/);
    let st = await orderState(order.id);
    expect(st.invoice).toBe("pendente_manual");
    expect(st.jobs).toContain("label:");

    const labels = fakeLabels();
    await labelHandler(labels)(job(order.id, "label"));
    st = await orderState(order.id);
    expect(st.status).toBe("label_ready");
    expect(st.shipment?.etiqueta_path).toBe(`etiquetas/${order.numero}.pdf`);
    expect(labels.addToCart).toHaveBeenCalledOnce();
    expect(labels.checkout).toHaveBeenCalledOnce();
    expect(st.jobs).toContain("print:");

    // No PrintNode: the summary is saved, nothing printed, order stays.
    const off = await printHandler(() => ({
      enabled: false,
      print: vi.fn(),
    }))(job(order.id, "print"));
    expect(off).toMatch(/Não impresso/);
    st = await orderState(order.id);
    expect(st.status).toBe("label_ready");
    expect(st.shipment?.resumo_path).toBe(`resumos/${order.numero}.pdf`);
  });

  it("a retry after a failure never buys a second label", async () => {
    const order = await paidOrder();
    await invoiceHandler()(job(order.id, "invoice"));
    const labels = fakeLabels({ failGenerateOnce: true });

    await expect(labelHandler(labels)(job(order.id, "label"))).rejects.toThrow(
      /fora do ar/,
    );
    // Paid already, label not generated: the retry continues that one.
    await labelHandler(labels)(job(order.id, "label"));

    expect(labels.addToCart).toHaveBeenCalledOnce();
    expect(labels.checkout).toHaveBeenCalledOnce();
    expect(labels.generate).toHaveBeenCalledTimes(2);
    expect((await orderState(order.id)).status).toBe("label_ready");
  });

  it("prints summary then label and marks printed", async () => {
    const order = await paidOrder();
    await invoiceHandler()(job(order.id, "invoice"));
    await labelHandler(fakeLabels())(job(order.id, "label"));

    const print = vi.fn(async () => [1, 2]);
    await printHandler(() => ({ enabled: true, print }))(
      job(order.id, "print"),
    );
    expect(print).toHaveBeenCalledOnce();
    const docs = (print.mock.calls[0] as unknown as [{ titulo: string }[]])[0];
    expect(docs.map((d) => d.titulo)).toEqual([
      `${order.numero} resumo`,
      `${order.numero} etiqueta`,
    ]);
    expect((await orderState(order.id)).status).toBe("printed");
  });

  it("a canceled order is skipped, not labeled", async () => {
    const admin = serviceClient();
    const { variantId } = await createVariant({ estoque: 1 });
    const { data: o } = await admin
      .from("orders")
      .insert({
        user_id: null,
        subtotal_cents: 100,
        total_cents: 100,
        endereco: {},
        cliente_nome: "X",
        cliente_cpf: "00000000191",
        payment_method: "pix",
      })
      .select("id")
      .single();
    void variantId;
    await admin.rpc("set_order_status", {
      p_order_id: o!.id,
      p_status: "canceled",
    });
    const labels = fakeLabels();
    const r = await labelHandler(labels)(job(o!.id, "label"));
    expect(r).toMatch(/Pulado/);
    expect(labels.addToCart).not.toHaveBeenCalled();
  });
});

describe("tracking poll", () => {
  it("moves printed -> shipped -> delivered, one step at a time", async () => {
    const order = await paidOrder();
    await invoiceHandler()(job(order.id, "invoice"));
    const labels = fakeLabels();
    await labelHandler(labels)(job(order.id, "label"));
    const meId = (await orderState(order.id)).shipment!.me_order_id as string;

    const tracking = {
      status: "posted",
      rastreio: "AA123456789BR",
      postadoEm: "2026-10-08 10:00:00",
      entregueEm: null,
      canceladoEm: null,
    };
    labels.track.mockImplementation(async (ids: string[]) =>
      Object.fromEntries(
        ids.map((id) => [
          id,
          id === meId
            ? tracking
            : { ...tracking, status: "released", postadoEm: null },
        ]),
      ),
    );

    await pollTracking(labels);
    let st = await orderState(order.id);
    expect(st.status).toBe("shipped");
    expect(st.shipment?.rastreio).toBe("AA123456789BR");
    expect(st.jobs).toContain("email:shipped");

    // Same answer again: no new status, no second e-mail.
    await pollTracking(labels);
    expect((await orderState(order.id)).status).toBe("shipped");

    Object.assign(tracking, {
      status: "delivered",
      entregueEm: "2026-10-09 15:00:00",
    });
    await pollTracking(labels);
    st = await orderState(order.id);
    expect(st.status).toBe("delivered");
    expect(st.jobs.filter((j) => j === "email:delivered")).toHaveLength(1);
  });
});
