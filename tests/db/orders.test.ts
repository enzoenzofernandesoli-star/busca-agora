import { describe, expect, it } from "vitest";

import {
  createCustomer,
  createOrder,
  createReservedOrder,
  createVariant,
  serviceClient,
  stockOf,
} from "./helpers";

async function orderMarkers(orderId: string) {
  const { data, error } = await serviceClient()
    .from("orders")
    .select("status, estoque_baixado_em, estoque_devolvido_em")
    .eq("id", orderId)
    .single();
  if (error) throw error;
  return data;
}

describe("stock reservation", () => {
  it("two orders race for the last unit: exactly one wins", async () => {
    const { variantId } = await createVariant({ estoque: 1 });
    const first = await createOrder({ userId: null, variantId });
    const second = await createOrder({ userId: null, variantId });

    const admin = serviceClient();
    const results = await Promise.all([
      admin.rpc("reserve_stock", { p_order_id: first.id }),
      admin.rpc("reserve_stock", { p_order_id: second.id }),
    ]);

    const failures = results.filter((r) => r.error);
    expect(results.length - failures.length).toBe(1);
    expect(failures).toHaveLength(1);
    expect(failures[0]?.error?.message).toBe("insufficient_stock");
    expect(await stockOf(variantId)).toBe(0);
  });

  it("is all or nothing when there is not enough", async () => {
    const { variantId } = await createVariant({ estoque: 2 });
    const order = await createOrder({ userId: null, variantId, quantidade: 3 });

    const { error } = await serviceClient().rpc("reserve_stock", {
      p_order_id: order.id,
    });
    expect(error?.message).toBe("insufficient_stock");
    expect(await stockOf(variantId)).toBe(2);
  });

  it("rolls back the first item when the second one is short", async () => {
    const enough = (await createVariant({ estoque: 5 })).variantId;
    const short = (await createVariant({ estoque: 1 })).variantId;
    // Whichever variant is locked first, one is taken before the other fails.
    const order = await createOrder({
      userId: null,
      items: [
        { variantId: enough, quantidade: 2 },
        { variantId: short, quantidade: 2 },
      ],
    });

    const { error } = await serviceClient().rpc("reserve_stock", {
      p_order_id: order.id,
    });
    expect(error?.message).toBe("insufficient_stock");
    expect(await stockOf(enough)).toBe(5);
    expect(await stockOf(short)).toBe(1);
    expect((await orderMarkers(order.id)).estoque_baixado_em).toBeNull();
  });

  it("refuses an order without items", async () => {
    const order = await createOrder({ userId: null, items: [] });
    const { error } = await serviceClient().rpc("reserve_stock", {
      p_order_id: order.id,
    });
    expect(error?.message).toBe("order_has_no_items");
  });

  it("reserving the same order twice takes the stock once", async () => {
    const { variantId } = await createVariant({ estoque: 5 });
    const order = await createOrder({ userId: null, variantId, quantidade: 2 });
    const admin = serviceClient();

    await Promise.all([
      admin.rpc("reserve_stock", { p_order_id: order.id }),
      admin.rpc("reserve_stock", { p_order_id: order.id }),
    ]);
    const again = await admin.rpc("reserve_stock", { p_order_id: order.id });

    expect(again.error).toBeNull();
    expect(await stockOf(variantId)).toBe(3);
  });

  it("canceling gives the stock back, once", async () => {
    const { variantId } = await createVariant({ estoque: 4 });
    const order = await createReservedOrder({
      userId: null,
      variantId,
      quantidade: 3,
    });
    const admin = serviceClient();
    expect(await stockOf(variantId)).toBe(1);

    const cancel = await admin.rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "canceled",
    });
    expect(cancel.error).toBeNull();
    const again = await admin.rpc("restore_stock", { p_order_id: order.id });
    expect(again.error).toBeNull();
    expect(await stockOf(variantId)).toBe(4);
  });

  it.each(["pending_payment", "paid"] as const)(
    "does not give stock back for a %s order",
    async (status) => {
      const { variantId } = await createVariant({ estoque: 3 });
      const order = await createReservedOrder({ userId: null, variantId });
      const admin = serviceClient();
      if (status === "paid") {
        await admin.rpc("set_order_status", {
          p_order_id: order.id,
          p_status: "paid",
        });
      }

      const { error } = await admin.rpc("restore_stock", {
        p_order_id: order.id,
      });
      expect(error?.message).toBe("order_not_canceled");
      expect(await stockOf(variantId)).toBe(2);
    },
  );

  it("freezes the items once the stock is reserved", async () => {
    const { variantId } = await createVariant({ estoque: 5 });
    const order = await createReservedOrder({ userId: null, variantId });
    const admin = serviceClient();

    const update = await admin
      .from("order_items")
      .update({ quantidade: 3 })
      .eq("order_id", order.id);
    expect(update.error?.message).toBe("order_items_frozen");

    const insert = await admin.from("order_items").insert({
      order_id: order.id,
      variant_id: variantId,
      nome: "Extra",
      sku: "SKU",
      ncm: "85171231",
      preco_cents: 8990,
      quantidade: 1,
    });
    expect(insert.error?.message).toBe("order_items_frozen");

    const remove = await admin
      .from("order_items")
      .delete()
      .eq("order_id", order.id);
    expect(remove.error?.message).toBe("order_items_frozen");

    await admin.rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "canceled",
    });
    expect(await stockOf(variantId)).toBe(5);
  });

  it("an item change racing the reservation cannot slip in", async () => {
    const { variantId } = await createVariant({ estoque: 5 });
    const order = await createOrder({ userId: null, variantId });
    const admin = serviceClient();

    const [reserve, update] = await Promise.all([
      admin.rpc("reserve_stock", { p_order_id: order.id }),
      admin
        .from("order_items")
        .update({ quantidade: 3 })
        .eq("order_id", order.id),
    ]);
    expect(reserve.error).toBeNull();

    // Either the change landed before the reservation (and 3 were taken) or
    // it was refused after it (and 1 was taken). Never 1 taken with 3 listed.
    const { data: items } = await admin
      .from("order_items")
      .select("quantidade")
      .eq("order_id", order.id);
    const listed = items?.[0]?.quantidade;
    expect(5 - (await stockOf(variantId))).toBe(listed);
    if (update.error) expect(update.error.message).toBe("order_items_frozen");

    await admin.rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "canceled",
    });
    expect(await stockOf(variantId)).toBe(5);
  });
});

describe("order status", () => {
  it("changes status and records the event", async () => {
    const { variantId } = await createVariant({ estoque: 1 });
    const order = await createReservedOrder({ userId: null, variantId });
    const admin = serviceClient();

    const { error } = await admin.rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "paid",
      p_detalhe: { origem: "teste" },
    });
    expect(error).toBeNull();

    const { data: events } = await admin
      .from("order_events")
      .select("evento, detalhe")
      .eq("order_id", order.id);
    expect(events).toEqual([
      {
        evento: "status_changed",
        detalhe: { origem: "teste", de: "pending_payment", para: "paid" },
      },
    ]);
  });

  it("repeating the same status does nothing", async () => {
    const { variantId } = await createVariant({ estoque: 1 });
    const order = await createReservedOrder({ userId: null, variantId });
    const admin = serviceClient();

    await admin.rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "paid",
    });
    const again = await admin.rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "paid",
    });
    expect(again.error).toBeNull();

    const { count } = await admin
      .from("order_events")
      .select("*", { count: "exact", head: true })
      .eq("order_id", order.id);
    expect(count).toBe(1);
  });

  it("refuses an invalid transition", async () => {
    const { variantId } = await createVariant({ estoque: 1 });
    const order = await createOrder({ userId: null, variantId });

    const { error } = await serviceClient().rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "shipped",
    });
    expect(error?.message).toBe("invalid_transition");
  });

  it("refuses paid without reserved stock", async () => {
    const { variantId } = await createVariant({ estoque: 1 });
    const order = await createOrder({ userId: null, variantId });

    const { error } = await serviceClient().rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "paid",
    });
    expect(error?.message).toBe("stock_not_reserved");
    expect((await orderMarkers(order.id)).status).toBe("pending_payment");
  });

  it("refuses paid after the reservation failed", async () => {
    const { variantId } = await createVariant({ estoque: 0 });
    const order = await createOrder({ userId: null, variantId });
    const admin = serviceClient();

    const reserve = await admin.rpc("reserve_stock", { p_order_id: order.id });
    expect(reserve.error?.message).toBe("insufficient_stock");

    const { error } = await admin.rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "paid",
    });
    expect(error?.message).toBe("stock_not_reserved");
  });

  it("the server cannot change status or stock markers directly", async () => {
    const { variantId } = await createVariant({ estoque: 2 });
    const order = await createReservedOrder({ userId: null, variantId });
    const admin = serviceClient();

    for (const change of [
      { status: "canceled" },
      { estoque_baixado_em: null },
      { estoque_devolvido_em: new Date().toISOString() },
      { total_cents: 1 },
    ]) {
      const { error } = await admin
        .from("orders")
        .update(change)
        .eq("id", order.id);
      expect(error?.code, JSON.stringify(change)).toBe("42501");
    }

    const insert = await admin.from("orders").insert({
      status: "paid",
      subtotal_cents: 0,
      total_cents: 0,
      endereco: {},
      cliente_nome: "X",
      cliente_cpf: "00000000191",
      payment_method: "pix",
    });
    expect(insert.error?.code).toBe("42501");

    const remove = await admin.from("orders").delete().eq("id", order.id);
    expect(remove.error?.code).toBe("42501");

    const markers = await orderMarkers(order.id);
    expect(markers.status).toBe("pending_payment");
    expect(markers.estoque_baixado_em).not.toBeNull();
    expect(await stockOf(variantId)).toBe(1);
  });
});

describe("order number and signup", () => {
  it("numbers orders BA-000001 style, in sequence", async () => {
    const { variantId } = await createVariant({ estoque: 1 });
    const first = await createOrder({ userId: null, variantId });
    const second = await createOrder({ userId: null, variantId });

    expect(first.numero).toMatch(/^BA-\d{6}$/);
    expect(Number(second.numero.slice(3))).toBe(
      Number(first.numero.slice(3)) + 1,
    );
  });

  it.each([
    [1, "BA-000001"],
    [999999, "BA-999999"],
    [1000000, "BA-1000000"],
    [12345678, "BA-12345678"],
  ])("formats %i as %s without truncating", async (n, expected) => {
    const { data, error } = await serviceClient().rpc("format_order_number", {
      p_n: n,
    });
    expect(error).toBeNull();
    expect(data).toBe(expected);
  });

  it("creates the profile when a user signs up", async () => {
    const user = await createCustomer("signup");
    const { data } = await serviceClient()
      .from("profiles")
      .select("nome, role")
      .eq("id", user.id)
      .single();
    expect(data).toEqual({ nome: "Cliente signup", role: "customer" });
  });
});
