import { describe, expect, it } from "vitest";

import {
  anonClient,
  createCustomer,
  createOrder,
  createVariant,
  serviceClient,
} from "./helpers";

describe("admin_dashboard_v2", () => {
  it("returns 14 days, the latest orders and the numbers", async () => {
    await createOrder({ userId: null });
    const { data, error } = await serviceClient().rpc("admin_dashboard_v2");
    expect(error).toBeNull();
    const d = data as { dias: unknown[]; ultimos: { numero: string }[] };
    expect(d.dias).toHaveLength(14);
    expect(d.ultimos.length).toBeGreaterThan(0);
    expect(d.ultimos.length).toBeLessThanOrEqual(8);
  });

  it("customers and visitors cannot call the panel functions", async () => {
    const c = await createCustomer("painel");
    for (const client of [c.client, anonClient()]) {
      expect((await client.rpc("admin_dashboard_v2")).error).not.toBeNull();
      expect(
        (
          await client.rpc("admin_delete_product", {
            p_id: crypto.randomUUID(),
          })
        ).error,
      ).not.toBeNull();
      expect(
        (
          await client.rpc("admin_set_role", {
            p_target: c.id,
            p_role: "admin",
            p_actor: c.id,
          })
        ).error,
      ).not.toBeNull();
    }
  });
});

describe("admin_delete_product", () => {
  it("deletes product and variants; past orders keep their copy", async () => {
    const admin = serviceClient();
    const { productId, variantId } = await createVariant({ estoque: 3 });
    const order = await createOrder({ userId: null, variantId });
    const { data, error } = await admin.rpc("admin_delete_product", {
      p_id: productId,
    });
    expect(error).toBeNull();
    expect((data as { vendido: boolean }).vendido).toBe(true);
    const { data: p } = await admin
      .from("products")
      .select("id")
      .eq("id", productId);
    expect(p).toEqual([]);
    const { data: itens } = await admin
      .from("order_items")
      .select("variant_id, nome")
      .eq("order_id", order.id);
    expect(itens?.[0]?.variant_id).toBeNull();
    expect(itens?.[0]?.nome).toBeTruthy();
  });
});

describe("admin_set_role", () => {
  it("promotes, demotes, never self-demotes and never removes the last admin", async () => {
    const admin = serviceClient();
    const a = await createCustomer("equipe-a");
    const b = await createCustomer("equipe-b");
    // Only admins in this test's world matter: remember who was admin.
    const { data: antes } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin");
    const outros = (antes ?? []).map((x) => x.id);
    await admin.from("profiles").update({ role: "customer" }).in("id", outros);
    try {
      await admin.from("profiles").update({ role: "admin" }).eq("id", a.id);
      expect(
        (
          await admin.rpc("admin_set_role", {
            p_target: b.id,
            p_role: "admin",
            p_actor: a.id,
          })
        ).error,
      ).toBeNull();
      const self = await admin.rpc("admin_set_role", {
        p_target: a.id,
        p_role: "customer",
        p_actor: a.id,
      });
      expect(self.error?.message).toBe("cannot_demote_self");
      expect(
        (
          await admin.rpc("admin_set_role", {
            p_target: b.id,
            p_role: "customer",
            p_actor: a.id,
          })
        ).error,
      ).toBeNull();
      const last = await admin.rpc("admin_set_role", {
        p_target: a.id,
        p_role: "customer",
        p_actor: b.id,
      });
      expect(last.error?.message).toBe("last_admin");
    } finally {
      await admin
        .from("profiles")
        .update({ role: "customer" })
        .in("id", [a.id, b.id]);
      if (outros.length) {
        await admin.from("profiles").update({ role: "admin" }).in("id", outros);
      }
    }
  });
});
