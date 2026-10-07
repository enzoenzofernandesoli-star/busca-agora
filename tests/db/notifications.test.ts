import { describe, expect, it } from "vitest";

import {
  anonClient,
  createCustomer,
  createOrder,
  createReservedOrder,
  createVariant,
  serviceClient,
} from "./helpers";

async function jobsOf(orderId: string) {
  const { data, error } = await serviceClient()
    .from("jobs")
    .select("tipo, etapa, status")
    .eq("order_id", orderId)
    .order("created_at");
  if (error) throw error;
  return data.map((j) => `${j.tipo}:${j.etapa}`).sort();
}

describe("notices are enqueued by the database", () => {
  it("a new order queues the 'pedido recebido' e-mail", async () => {
    const order = await createOrder({ userId: null });
    expect(await jobsOf(order.id)).toEqual(["email:pending_payment"]);
  });

  it("paid queues the e-mail and the Telegram notice, once", async () => {
    const { variantId } = await createVariant({ estoque: 5 });
    const order = await createReservedOrder({ userId: null, variantId });
    const admin = serviceClient();
    const paid = await admin.rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "paid",
    });
    expect(paid.error).toBeNull();

    // The same notice arriving twice (e.g. a replayed event) adds nothing.
    await admin.rpc("enqueue_job", {
      p_tipo: "email",
      p_order_id: order.id,
      p_etapa: "paid",
    });
    expect(await jobsOf(order.id)).toEqual([
      "email:paid",
      "email:pending_payment",
      "notify:paid",
    ]);
  });

  it("canceled sends no e-mail", async () => {
    const order = await createOrder({ userId: null });
    await serviceClient().rpc("set_order_status", {
      p_order_id: order.id,
      p_status: "canceled",
    });
    expect(await jobsOf(order.id)).toEqual(["email:pending_payment"]);
  });

  it("one return request per order", async () => {
    const order = await createOrder({ userId: null });
    const admin = serviceClient();
    const row = {
      order_id: order.id,
      evento: "devolucao_solicitada",
      detalhe: { tipo: "troca" },
    };
    expect((await admin.from("order_events").insert(row)).error).toBeNull();
    expect((await admin.from("order_events").insert(row)).error?.code).toBe(
      "23505",
    );
  });
});

describe("claim_jobs", () => {
  it("hands each due job to only one worker", async () => {
    const order = await createOrder({ userId: null });
    const admin = serviceClient();
    // Oldest in the queue, so it is within the limit whatever else is pending.
    await admin
      .from("jobs")
      .update({ run_at: "2000-01-01T00:00:00Z" })
      .eq("order_id", order.id);
    const [a, b] = await Promise.all([
      admin.rpc("claim_jobs", { p_tipos: ["email"], p_limit: 50 }),
      admin.rpc("claim_jobs", { p_tipos: ["email"], p_limit: 50 }),
    ]);
    const mine = [...(a.data ?? []), ...(b.data ?? [])].filter(
      (j) => j.order_id === order.id,
    );
    expect(mine).toHaveLength(1);
    expect(mine[0]?.status).toBe("running");
  });

  it("skips jobs not yet due and types it was not asked for", async () => {
    const order = await createOrder({ userId: null });
    const admin = serviceClient();
    await admin
      .from("jobs")
      .update({ run_at: new Date(Date.now() + 3_600_000).toISOString() })
      .eq("order_id", order.id);
    await admin.from("jobs").insert({ tipo: "invoice", order_id: order.id });

    const { data } = await admin.rpc("claim_jobs", {
      p_tipos: ["email", "notify"],
      p_limit: 50,
    });
    const mine = (data ?? []).filter(
      (j: { order_id: string }) => j.order_id === order.id,
    );
    expect(mine).toEqual([]);
  });
});

describe("customers cannot touch the queue", () => {
  it("customers and visitors cannot enqueue, claim or read jobs", async () => {
    const c = await createCustomer("fila");
    const order = await createOrder({ userId: c.id });
    for (const client of [c.client, anonClient()]) {
      const claim = await client.rpc("claim_jobs", { p_tipos: ["email"] });
      expect(claim.error).not.toBeNull();
      const enqueue = await client.rpc("enqueue_job", {
        p_tipo: "email",
        p_order_id: order.id,
        p_etapa: "paid",
      });
      expect(enqueue.error).not.toBeNull();
      const tick = await client.rpc("jobs_tick");
      expect(tick.error).not.toBeNull();
      const { data } = await client
        .from("jobs")
        .select("id")
        .eq("order_id", order.id);
      expect(data ?? []).toEqual([]);
    }
  });

  it("customers cannot write their order's e-mail or events", async () => {
    const c = await createCustomer("evento");
    const order = await createOrder({ userId: c.id });
    const ev = await c.client.from("order_events").insert({
      order_id: order.id,
      evento: "devolucao_solicitada",
    });
    expect(ev.error).not.toBeNull();
    const upd = await c.client
      .from("orders")
      .update({ cliente_email: "outro@example.test" })
      .eq("id", order.id);
    const { data } = await serviceClient()
      .from("orders")
      .select("cliente_email")
      .eq("id", order.id)
      .single();
    expect(upd.error !== null || data?.cliente_email === null).toBe(true);
    expect(data?.cliente_email).toBeNull();
  });
});
