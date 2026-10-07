import { beforeAll, describe, expect, it } from "vitest";

import {
  anonClient,
  createCustomer,
  createOrder,
  createVariant,
  serviceClient,
  type TestUser,
} from "./helpers";

describe("RLS: customers only see their own data", () => {
  let a: TestUser;
  let b: TestUser;
  let orderA: { id: string };
  let orderB: { id: string };

  beforeAll(async () => {
    a = await createCustomer("a");
    b = await createCustomer("b");
    const { variantId } = await createVariant({ estoque: 10 });
    orderA = await createOrder({ userId: a.id, variantId });
    orderB = await createOrder({ userId: b.id, variantId });

    const admin = serviceClient();
    for (const [user, order] of [
      [a, orderA],
      [b, orderB],
    ] as const) {
      const { error: addressError } = await admin.from("addresses").insert({
        user_id: user.id,
        cep: "01001000",
        rua: "Praça da Sé",
        numero: "1",
        bairro: "Sé",
        cidade: "São Paulo",
        uf: "SP",
        principal: true,
      });
      if (addressError) throw addressError;

      const inserts = await Promise.all([
        admin
          .from("invoices")
          .insert({ order_id: order.id, status: "autorizada" }),
        admin
          .from("shipments")
          .insert({ order_id: order.id, status: "pendente" }),
        admin
          .from("order_events")
          // A customer-visible event (the RLS hides admin-only ones).
          .insert({
            order_id: order.id,
            evento: "status_changed",
            detalhe: { de: "pending_payment", para: "pending_payment" },
          }),
      ]);
      for (const { error } of inserts) if (error) throw error;
    }
  });

  it.each([
    ["orders", "id"],
    ["order_items", "order_id"],
    ["invoices", "order_id"],
    ["shipments", "order_id"],
    ["order_events", "order_id"],
  ])("A reads own %s and not B's", async (table, column) => {
    const own = await a.client.from(table).select("*").eq(column, orderA.id);
    expect(own.error).toBeNull();
    expect(own.data?.length).toBeGreaterThan(0);

    const other = await a.client.from(table).select("*").eq(column, orderB.id);
    expect(other.error).toBeNull();
    expect(other.data).toEqual([]);
  });

  it("A lists only own orders", async () => {
    const { data, error } = await a.client.from("orders").select("user_id");
    expect(error).toBeNull();
    expect(data?.every((row) => row.user_id === a.id)).toBe(true);
  });

  it("A reads own address and not B's", async () => {
    const own = await a.client.from("addresses").select("user_id");
    expect(own.error).toBeNull();
    expect(own.data).toEqual([{ user_id: a.id }]);

    const other = await a.client
      .from("addresses")
      .select("*")
      .eq("user_id", b.id);
    expect(other.data).toEqual([]);
  });

  it("A cannot change B's address", async () => {
    const { data } = await a.client
      .from("addresses")
      .update({ numero: "999" })
      .eq("user_id", b.id)
      .select();
    expect(data).toEqual([]);
  });

  it("A reads only own profile", async () => {
    const { data, error } = await a.client.from("profiles").select("id");
    expect(error).toBeNull();
    expect(data).toEqual([{ id: a.id }]);
  });

  it("a customer cannot make themselves admin", async () => {
    const { error } = await a.client
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", a.id);
    expect(error?.code).toBe("42501");

    const { data } = await serviceClient()
      .from("profiles")
      .select("role")
      .eq("id", a.id)
      .single();
    expect(data?.role).toBe("customer");
  });

  it("a customer edits own name", async () => {
    const { error } = await a.client
      .from("profiles")
      .update({ nome: "Novo Nome" })
      .eq("id", a.id);
    expect(error).toBeNull();
  });

  it("a customer cannot write orders, payments, jobs or webhook logs", async () => {
    const order = await a.client
      .from("orders")
      .update({ total_cents: 1 })
      .eq("id", orderA.id);
    expect(order.error?.code).toBe("42501");

    const payment = await a.client.from("payments").insert({
      order_id: orderA.id,
      mp_payment_id: "fake",
      metodo: "pix",
      status: "approved",
      valor_cents: 1,
    });
    expect(payment.error?.code).toBe("42501");

    const job = await a.client
      .from("jobs")
      .insert({ tipo: "email", order_id: orderA.id });
    expect(job.error?.code).toBe("42501");

    const log = await a.client.from("webhook_logs").select("*");
    expect(log.error?.code).toBe("42501");
  });

  it("a customer cannot call the server-only functions", async () => {
    for (const [fn, args] of [
      ["reserve_stock", { p_order_id: orderA.id }],
      ["restore_stock", { p_order_id: orderA.id }],
      ["set_order_status", { p_order_id: orderA.id, p_status: "paid" }],
    ] as const) {
      const { error } = await a.client.rpc(fn, args);
      expect(error, fn).not.toBeNull();
    }

    const { data } = await serviceClient()
      .from("orders")
      .select("status")
      .eq("id", orderA.id)
      .single();
    expect(data?.status).toBe("pending_payment");
  });

  it("anonymous sees no orders, addresses or profiles", async () => {
    const anon = anonClient();
    for (const table of ["orders", "addresses", "profiles", "invoices"]) {
      const { data, error } = await anon.from(table).select("*");
      // Either refused outright or an empty result: never rows.
      expect(error !== null || data?.length === 0, table).toBe(true);
    }
  });
});

describe("catalog: cost never reaches the browser", () => {
  let activeVariantId: string;
  let inactiveVariantId: string;

  beforeAll(async () => {
    activeVariantId = (await createVariant({ estoque: 3, custoCents: 4321 }))
      .variantId;
    inactiveVariantId = (await createVariant({ estoque: 3, ativo: false }))
      .variantId;
  });

  it("anonymous cannot select custo_cents from the table", async () => {
    const { error } = await anonClient()
      .from("product_variants")
      .select("custo_cents");
    expect(error?.code).toBe("42501");
  });

  it("anonymous cannot select * from the table (it includes the cost)", async () => {
    const { error } = await anonClient().from("product_variants").select("*");
    expect(error?.code).toBe("42501");
  });

  it("logged-in customer cannot select custo_cents either", async () => {
    const c = await createCustomer("custo");
    const { error } = await c.client
      .from("product_variants")
      .select("custo_cents");
    expect(error?.code).toBe("42501");
  });

  it("the public view has no cost column", async () => {
    const { data, error } = await anonClient()
      .from("product_variants_public")
      .select("*")
      .eq("id", activeVariantId)
      .single();
    expect(error).toBeNull();
    expect(data).not.toHaveProperty("custo_cents");
    expect(data?.preco_cents).toBe(8990);
  });

  it("variants of inactive products are hidden", async () => {
    const { data } = await anonClient()
      .from("product_variants_public")
      .select("id")
      .eq("id", inactiveVariantId);
    expect(data).toEqual([]);
  });

  it("anonymous reads the seeded categories", async () => {
    const { data, error } = await anonClient()
      .from("categories")
      .select("slug, cor")
      .order("ordem");
    expect(error).toBeNull();
    expect(data).toEqual(
      expect.arrayContaining([
        { slug: "eletronicos", cor: "#7ADFFF" },
        { slug: "cosmeticos", cor: "#FF9AC8" },
      ]),
    );
  });

  it("anonymous cannot write the catalog", async () => {
    const { error } = await anonClient()
      .from("categories")
      .insert({ nome: "X", slug: "x", cor: "#000000" });
    expect(error?.code).toBe("42501");
  });
});
