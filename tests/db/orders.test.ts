import { describe, expect, it } from "vitest";

import {
  createCustomer,
  createOrder,
  createVariant,
  serviceClient,
  stockOf,
} from "./helpers";

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
    const order = await createOrder({ userId: null, variantId, quantidade: 3 });
    const admin = serviceClient();

    await admin.rpc("reserve_stock", { p_order_id: order.id });
    expect(await stockOf(variantId)).toBe(1);

    const cancel = await admin.rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "canceled",
    });
    expect(cancel.error).toBeNull();
    await admin.rpc("restore_stock", { p_order_id: order.id });
    expect(await stockOf(variantId)).toBe(4);
  });
});

describe("order status", () => {
  it("changes status and records the event", async () => {
    const { variantId } = await createVariant({ estoque: 1 });
    const order = await createOrder({ userId: null, variantId });
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
    const order = await createOrder({ userId: null, variantId });
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
