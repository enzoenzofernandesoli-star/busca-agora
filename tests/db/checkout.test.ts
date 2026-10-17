import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  createCustomer,
  createVariant,
  serviceClient,
  stockOf,
} from "./helpers";

const endereco = {
  cep: "01310100",
  rua: "Av. Paulista",
  numero: "1000",
  complemento: null,
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

async function placeOrder(opts: {
  userId: string | null;
  itens: { variant_id: string; quantidade: number }[];
  freteCents?: number;
  metodo?: "pix" | "card";
  validade?: string;
}) {
  return serviceClient()
    .rpc("create_order", {
      p_user_id: opts.userId,
      p_endereco: endereco,
      p_cliente_nome: "Cliente Teste",
      p_cliente_cpf: "52998224725",
      p_payment_method: opts.metodo ?? "pix",
      p_frete_cents: opts.freteCents ?? 2345,
      p_frete_servico: "Correios · PAC",
      p_frete_servico_id: 1,
      p_itens: opts.itens,
      p_validade: opts.validade ?? "30 minutes",
    })
    .single<{ id: string; numero: string; total_cents: number }>();
}

async function pay(
  orderId: string,
  opts: { paymentId?: string; status?: string; valor: number; moeda?: string },
) {
  return serviceClient().rpc("record_payment", {
    p_order_id: orderId,
    p_mp_payment_id: opts.paymentId ?? randomUUID(),
    p_status: opts.status ?? "approved",
    p_metodo: "pix",
    p_valor_cents: opts.valor,
    p_moeda: opts.moeda ?? "BRL",
    p_parcelas: 1,
    p_raw: {},
  });
}

async function orderRow(id: string) {
  const { data, error } = await serviceClient()
    .from("orders")
    .select("status, subtotal_cents, total_cents, estoque_devolvido_em")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

describe("create_order", () => {
  it("prices come from the catalog and the stock is reserved", async () => {
    const { variantId } = await createVariant({ estoque: 5 });
    const { data, error } = await placeOrder({
      userId: null,
      itens: [{ variant_id: variantId, quantidade: 2 }],
    });
    expect(error).toBeNull();
    expect(data?.total_cents).toBe(8990 * 2 + 2345);
    expect(data?.numero).toMatch(/^BA-\d{6,}$/);
    expect(await stockOf(variantId)).toBe(3);
    const { data: itens } = await serviceClient()
      .from("order_items")
      .select("preco_cents, ncm, quantidade")
      .eq("order_id", data!.id);
    expect(itens).toEqual([
      { preco_cents: 8990, ncm: "85171231", quantidade: 2 },
    ]);
  });

  it("out of stock creates nothing", async () => {
    const { variantId } = await createVariant({ estoque: 1 });
    const { error } = await placeOrder({
      userId: null,
      itens: [{ variant_id: variantId, quantidade: 2 }],
    });
    expect(error?.message).toBe("insufficient_stock");
    expect(await stockOf(variantId)).toBe(1);
    const { count } = await serviceClient()
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("variant_id", variantId);
    expect(count).toBe(0);
  });

  it("refuses an inactive product and an empty cart", async () => {
    const { variantId } = await createVariant({ estoque: 3, ativo: false });
    const inactive = await placeOrder({
      userId: null,
      itens: [{ variant_id: variantId, quantidade: 1 }],
    });
    expect(inactive.error?.message).toBe("variant_not_found");
    const empty = await placeOrder({ userId: null, itens: [] });
    expect(empty.error?.message).toBe("empty_cart");
  });

  it("empties what was bought from the customer's cart", async () => {
    const customer = await createCustomer("checkout-cart");
    const { variantId } = await createVariant({ estoque: 4 });
    const admin = serviceClient();
    const { data: cart } = await admin
      .from("carts")
      .insert({ user_id: customer.id })
      .select("id")
      .single();
    await admin
      .from("cart_items")
      .insert({ cart_id: cart!.id, variant_id: variantId, quantidade: 1 });
    const { error } = await placeOrder({
      userId: customer.id,
      itens: [{ variant_id: variantId, quantidade: 1 }],
    });
    expect(error).toBeNull();
    const { count } = await admin
      .from("cart_items")
      .select("id", { count: "exact", head: true })
      .eq("cart_id", cart!.id);
    expect(count).toBe(0);
  });

  it("customers cannot call it", async () => {
    const customer = await createCustomer("checkout-rpc");
    const { error } = await customer.client.rpc("create_order", {
      p_user_id: customer.id,
      p_endereco: endereco,
      p_cliente_nome: "X",
      p_cliente_cpf: "52998224725",
      p_payment_method: "pix",
      p_frete_cents: 0,
      p_frete_servico: "x",
      p_frete_servico_id: 1,
      p_itens: [],
      p_validade: "30 minutes",
    });
    expect(error).not.toBeNull();
  });
});

describe("record_payment", () => {
  it("approved for the exact total marks paid, once", async () => {
    const { variantId } = await createVariant({ estoque: 3 });
    const { data: order } = await placeOrder({
      userId: null,
      itens: [{ variant_id: variantId, quantidade: 1 }],
    });
    const paymentId = randomUUID();
    const first = await pay(order!.id, {
      paymentId,
      valor: order!.total_cents,
    });
    const second = await pay(order!.id, {
      paymentId,
      valor: order!.total_cents,
    });
    expect(first.data).toBe("paid");
    expect(second.data).toBe("already_paid");
    expect((await orderRow(order!.id)).status).toBe("paid");
    expect(await stockOf(variantId)).toBe(2);
    const { count } = await serviceClient()
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("order_id", order!.id);
    expect(count).toBe(1);
  });

  it("a different amount or currency never pays", async () => {
    const { variantId } = await createVariant({ estoque: 3 });
    const { data: order } = await placeOrder({
      userId: null,
      itens: [{ variant_id: variantId, quantidade: 1 }],
    });
    expect((await pay(order!.id, { valor: order!.total_cents - 1 })).data).toBe(
      "mismatch",
    );
    expect(
      (await pay(order!.id, { valor: order!.total_cents, moeda: "USD" })).data,
    ).toBe("mismatch");
    expect((await orderRow(order!.id)).status).toBe("pending_payment");
  });

  it("a payment id of another order is refused", async () => {
    const { variantId } = await createVariant({ estoque: 3 });
    const a = (
      await placeOrder({
        userId: null,
        itens: [{ variant_id: variantId, quantidade: 1 }],
      })
    ).data!;
    const b = (
      await placeOrder({
        userId: null,
        itens: [{ variant_id: variantId, quantidade: 1 }],
      })
    ).data!;
    const paymentId = randomUUID();
    await pay(a.id, { paymentId, status: "pending", valor: a.total_cents });
    expect((await pay(b.id, { paymentId, valor: b.total_cents })).data).toBe(
      "mismatch",
    );
    expect((await orderRow(b.id)).status).toBe("pending_payment");
  });

  it("pending keeps waiting; approved after cancel is flagged, not reopened", async () => {
    const { variantId } = await createVariant({ estoque: 3 });
    const { data: order } = await placeOrder({
      userId: null,
      itens: [{ variant_id: variantId, quantidade: 1 }],
    });
    expect(
      (await pay(order!.id, { status: "pending", valor: order!.total_cents }))
        .data,
    ).toBe("pending");
    await serviceClient().rpc("set_order_status", {
      p_order_id: order!.id,
      p_status: "canceled",
    });
    expect((await pay(order!.id, { valor: order!.total_cents })).data).toBe(
      "late",
    );
    expect((await orderRow(order!.id)).status).toBe("canceled");
  });
});

describe("expire_orders", () => {
  it("cancels unpaid orders past the deadline and returns the stock once", async () => {
    const { variantId } = await createVariant({ estoque: 2 });
    const { data: order } = await placeOrder({
      userId: null,
      itens: [{ variant_id: variantId, quantidade: 2 }],
      validade: "1 second",
    });
    expect(await stockOf(variantId)).toBe(0);
    await new Promise((r) => setTimeout(r, 1500));
    const admin = serviceClient();
    await admin.rpc("expire_orders");
    await admin.rpc("expire_orders");
    const row = await orderRow(order!.id);
    expect(row.status).toBe("canceled");
    expect(row.estoque_devolvido_em).not.toBeNull();
    expect(await stockOf(variantId)).toBe(2);
  });

  it("leaves paid and still-valid orders alone", async () => {
    const { variantId } = await createVariant({ estoque: 2 });
    const { data: order } = await placeOrder({
      userId: null,
      itens: [{ variant_id: variantId, quantidade: 1 }],
    });
    await serviceClient().rpc("expire_orders");
    expect((await orderRow(order!.id)).status).toBe("pending_payment");
  });
});

describe("revisão do Codex (fase 5)", () => {
  async function paidOrder() {
    const { variantId } = await createVariant({ estoque: 5 });
    const { data: order } = await placeOrder({
      userId: null,
      itens: [{ variant_id: variantId, quantidade: 1 }],
    });
    const paymentId = randomUUID();
    expect(
      (await pay(order!.id, { paymentId, valor: order!.total_cents })).data,
    ).toBe("paid");
    return { order: order!, paymentId };
  }

  it("estornar um pagamento divergente não desfaz a venda", async () => {
    const { order } = await paidOrder();
    const wrong = randomUUID();
    expect((await pay(order.id, { paymentId: wrong, valor: 1 })).data).toBe(
      "mismatch",
    );
    expect(
      (await pay(order.id, { paymentId: wrong, status: "refunded", valor: 1 }))
        .data,
    ).toBe("refunded_other");
    expect((await orderRow(order.id)).status).toBe("paid");
  });

  it("segundo pagamento aprovado é marcado como duplicado", async () => {
    const { order } = await paidOrder();
    expect((await pay(order.id, { valor: order.total_cents })).data).toBe(
      "duplicate",
    );
    expect((await orderRow(order.id)).status).toBe("paid");
  });

  it("um retrato antigo nunca faz o pagamento voltar", async () => {
    const { order, paymentId } = await paidOrder();
    expect(
      (
        await pay(order.id, {
          paymentId,
          status: "pending",
          valor: order.total_cents,
        })
      ).data,
    ).toBe("stale");
    const { data } = await serviceClient()
      .from("payments")
      .select("status")
      .eq("mp_payment_id", paymentId)
      .single();
    expect(data?.status).toBe("approved");
  });

  it("estorno com o pedido em trânsito muda para estornado", async () => {
    const { order, paymentId } = await paidOrder();
    const admin = serviceClient();
    for (const s of ["label_ready", "shipped"] as const) {
      const { error } = await admin.rpc("set_order_status", {
        p_order_id: order.id,
        p_status: s,
      });
      expect(error).toBeNull();
    }
    expect(
      (
        await pay(order.id, {
          paymentId,
          status: "charged_back",
          valor: order.total_cents,
        })
      ).data,
    ).toBe("refunded");
    expect((await orderRow(order.id)).status).toBe("refunded");
  });

  async function beginRefund(orderId: string) {
    const { data, error } = await serviceClient()
      .rpc("begin_refund", { p_order_id: orderId })
      .single<{ resultado: string; token: string | null }>();
    if (error) throw error;
    return data;
  }
  async function labelLock(orderId: string) {
    return (
      await serviceClient().rpc("fulfillment_lock", {
        p_order_id: orderId,
        p_tipo: "label",
      })
    ).data;
  }

  it("estorno espera a etiqueta em andamento", async () => {
    const { order } = await paidOrder();
    expect(await labelLock(order.id)).toBe("ok");
    expect((await beginRefund(order.id)).resultado).toBe("ocupado");
  });

  it("estorno aberto bloqueia a expedição sem prazo e cria a conferência", async () => {
    const { order, paymentId } = await paidOrder();
    const begin = await beginRefund(order.id);
    expect(begin.resultado).toBe("ok");
    expect(begin.token).toBeTruthy();
    // Even with no shipment lease at all, nothing ships while the refund is open.
    await serviceClient()
      .from("shipments")
      .update({ trava_ate: null, trava_tipo: null })
      .eq("order_id", order.id);
    expect(await labelLock(order.id)).toBe("ocupado");
    const { data: job } = await serviceClient()
      .from("jobs")
      .select("etapa, status")
      .eq("order_id", order.id)
      .eq("tipo", "refund")
      .single();
    expect(job).toEqual({ etapa: begin.token, status: "pending" });
    expect(
      (
        await pay(order.id, {
          paymentId,
          status: "refunded",
          valor: order.total_cents,
        })
      ).data,
    ).toBe("refunded");
    expect((await orderRow(order.id)).status).toBe("refunded");
  });

  it("um estorno por vez, e só o dono do token fecha", async () => {
    const { order } = await paidOrder();
    const first = await beginRefund(order.id);
    expect(first.resultado).toBe("ok");
    expect((await beginRefund(order.id)).resultado).toBe("em_andamento");
    const admin = serviceClient();
    const wrong = await admin.rpc("end_refund", {
      p_order_id: order.id,
      p_token: randomUUID(),
    });
    expect(wrong.data).toBe(false);
    expect(await labelLock(order.id)).toBe("ocupado");
    const right = await admin.rpc("end_refund", {
      p_order_id: order.id,
      p_token: first.token,
    });
    expect(right.data).toBe(true);
    expect(await labelLock(order.id)).toBe("ok");
  });

  it("pedido sem pagamento confirmado não pode ser estornado", async () => {
    const { variantId } = await createVariant({ estoque: 2 });
    const { data: order } = await placeOrder({
      userId: null,
      itens: [{ variant_id: variantId, quantidade: 1 }],
    });
    expect((await beginRefund(order!.id)).resultado).toBe("inelegivel");
  });
});

describe("origem do pedido", () => {
  it("grava UTM e ref no pedido, cortando o que for longo", async () => {
    const { variantId } = await createVariant({ estoque: 2 });
    const { data, error } = await serviceClient()
      .rpc("create_order", {
        p_user_id: null,
        p_endereco: endereco,
        p_cliente_nome: "Cliente Teste",
        p_cliente_cpf: "52998224725",
        p_payment_method: "pix",
        p_frete_cents: 0,
        p_frete_servico: "Correios · PAC",
        p_frete_servico_id: 1,
        p_itens: [{ variant_id: variantId, quantidade: 1 }],
        p_validade: "30 minutes",
        p_origem: { utm_source: "instagram", ref: "joana", utm_medium: "" },
      })
      .single<{ id: string }>();
    expect(error).toBeNull();
    const { data: o } = await serviceClient()
      .from("orders")
      .select("utm_source, utm_medium, utm_campaign, ref")
      .eq("id", data!.id)
      .single();
    expect(o).toEqual({
      utm_source: "instagram",
      utm_medium: null,
      utm_campaign: null,
      ref: "joana",
    });
  });
});
