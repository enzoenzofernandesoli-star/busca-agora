import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createCustomer, createVariant, serviceClient } from "./helpers";

const endereco = {
  cep: "01310100",
  rua: "Av. Paulista",
  numero: "1",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

async function view(productId: string, session: string) {
  const { data, error } = await serviceClient().rpc("record_product_view", {
    p_product_id: productId,
    p_session_id: session,
    p_user_id: null as unknown as string,
    p_origem: { utm_source: "instagram", ref: "joana" },
    p_device: "mobile",
  });
  if (error) throw error;
  return data;
}

describe("métricas de produto", () => {
  it("a mesma visita em 30 minutos conta uma vez", async () => {
    const { productId } = await createVariant({ estoque: 1 });
    const s = randomUUID();
    expect(await view(productId, s)).toBe(true);
    expect(await view(productId, s)).toBe(false);
    expect(await view(productId, randomUUID())).toBe(true);
  });

  it("a compra entra uma vez por item, só quando o pedido vira pago", async () => {
    const { productId, variantId } = await createVariant({ estoque: 5 });
    const admin = serviceClient();
    const { data: order } = await admin
      .rpc("create_order", {
        p_user_id: null as unknown as string,
        p_endereco: endereco,
        p_cliente_nome: "Cliente Teste",
        p_cliente_cpf: "52998224725",
        p_payment_method: "pix",
        p_frete_cents: 0,
        p_frete_servico: "PAC",
        p_frete_servico_id: 1,
        p_itens: [{ variant_id: variantId, quantidade: 2 }],
        p_validade: "30 minutes",
        p_origem: { visitor_id: "visitante-teste", ref: "joana" },
      })
      .single<{ id: string; total_cents: number }>();
    const compras = async () =>
      (
        await admin
          .from("product_events")
          .select("quantidade, valor_cents, custo_cents, session_id, ref")
          .eq("order_id", order!.id)
          .eq("event", "purchase")
      ).data;
    expect(await compras()).toEqual([]);
    const pid = randomUUID();
    for (let i = 0; i < 2; i++) {
      await admin.rpc("record_payment", {
        p_order_id: order!.id,
        p_mp_payment_id: pid,
        p_status: "approved",
        p_metodo: "pix",
        p_valor_cents: order!.total_cents,
        p_moeda: "BRL",
        p_parcelas: 1,
        p_raw: {},
      });
    }
    expect(await compras()).toEqual([
      {
        quantidade: 2,
        valor_cents: 17980,
        custo_cents: 8000,
        session_id: "visitante-teste",
        ref: "joana",
      },
    ]);

    const hoje = new Date().toISOString().slice(0, 10);
    await admin.rpc("refresh_product_metrics", { p_de: hoje, p_ate: hoje });
    const { data: dia } = await admin
      .from("product_metrics_daily")
      .select("pedidos, unidades, faturamento_cents, custo_cents")
      .eq("product_id", productId);
    expect(dia?.reduce((n, r) => n + r.pedidos, 0)).toBe(1);
    expect(dia?.reduce((n, r) => n + Number(r.faturamento_cents), 0)).toBe(
      17980,
    );
  });

  it("cliente comum não lê eventos nem o resumo", async () => {
    const c = await createCustomer("metricas-rls");
    const { data: e } = await c.client
      .from("product_events")
      .select("id")
      .limit(1);
    const { data: d } = await c.client
      .from("product_metrics_daily")
      .select("dia")
      .limit(1);
    expect(e).toEqual([]);
    expect(d).toEqual([]);
    const { error } = await c.client.from("product_events").insert({
      product_id: randomUUID(),
      event: "view",
      session_id: "x",
    });
    expect(error).not.toBeNull();
  });
});

describe("métricas: contagens e valores (revisão do Codex)", () => {
  const hoje = () =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
      new Date(),
    );

  async function paidOrder(
    itens: { variant_id: string; quantidade: number }[],
    visitor: string,
  ) {
    const admin = serviceClient();
    const { data: order, error } = await admin
      .rpc("create_order", {
        p_user_id: null as unknown as string,
        p_endereco: endereco,
        p_cliente_nome: "Cliente Teste",
        p_cliente_cpf: "52998224725",
        p_payment_method: "pix",
        p_frete_cents: 0,
        p_frete_servico: "PAC",
        p_frete_servico_id: 1,
        p_itens: itens,
        p_validade: "30 minutes",
        p_origem: { visitor_id: visitor },
      })
      .single<{ id: string; total_cents: number }>();
    if (error) throw error;
    const { data: r } = await admin.rpc("record_payment", {
      p_order_id: order.id,
      p_mp_payment_id: randomUUID(),
      p_status: "approved",
      p_metodo: "pix",
      p_valor_cents: order.total_cents,
      p_moeda: "BRL",
      p_parcelas: 1,
      p_raw: {},
    });
    return { order, resultado: r };
  }

  it("um pedido com dois produtos é uma compra da loja; o mesmo visitante em duas origens é um visitante", async () => {
    const a = await createVariant({ estoque: 5 });
    const b = await createVariant({ estoque: 5 });
    const visitor = randomUUID();
    const admin = serviceClient();
    for (const [p, origem] of [
      [a.productId, { utm_source: "instagram" }],
      [a.productId, { utm_source: "tiktok" }],
      [b.productId, {}],
    ] as const) {
      // Distinct origins bypass the 30-minute rule by session+product, so
      // insert directly (same visitor, same day).
      await admin.from("product_events").insert({
        product_id: p,
        event: "view",
        session_id: visitor,
        device: "mobile",
        ...origem,
      });
    }
    await paidOrder(
      [
        { variant_id: a.variantId, quantidade: 1 },
        { variant_id: b.variantId, quantidade: 1 },
      ],
      visitor,
    );
    const dia = hoje();
    await admin.rpc("refresh_product_metrics", { p_de: dia, p_ate: dia });
    const { data: produto } = await admin
      .from("product_metrics_product_daily")
      .select("visitantes, pedidos")
      .eq("product_id", a.productId)
      .eq("dia", dia)
      .single();
    expect(produto).toEqual({ visitantes: 1, pedidos: 1 });
    const { data: porVisitante } = await admin
      .from("product_events")
      .select("order_id")
      .eq("session_id", visitor)
      .eq("event", "purchase");
    // Two items, one order: the store summary counts distinct orders.
    expect(new Set(porVisitante?.map((p) => p.order_id)).size).toBe(1);
  });

  it("custo alto não impede confirmar o pagamento", async () => {
    const { variantId } = await createVariant({
      estoque: 5,
      custoCents: 1_100_000_000,
    });
    const { order, resultado } = await paidOrder(
      [{ variant_id: variantId, quantidade: 2 }],
      randomUUID(),
    );
    expect(resultado).toBe("paid");
    const { data } = await serviceClient()
      .from("product_events")
      .select("custo_cents")
      .eq("order_id", order.id)
      .eq("event", "purchase")
      .single();
    expect(Number(data?.custo_cents)).toBe(2_200_000_000);
  });
});
