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
