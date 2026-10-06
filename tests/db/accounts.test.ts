import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  createCustomer,
  createOrder,
  createVariant,
  serviceClient,
} from "./helpers";

describe("hit_rate_limit", () => {
  it("allows up to the limit, then refuses", async () => {
    const admin = serviceClient();
    const chave = `teste-${randomUUID()}`;
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      const { data, error } = await admin.rpc("hit_rate_limit", {
        p_chave: chave,
        p_max: 3,
        p_janela_segundos: 900,
      });
      expect(error).toBeNull();
      results.push(data as boolean);
    }
    expect(results).toEqual([true, true, true, false]);
  });

  it("counts parallel attempts without losing any", async () => {
    const admin = serviceClient();
    const chave = `teste-${randomUUID()}`;
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        admin.rpc("hit_rate_limit", {
          p_chave: chave,
          p_max: 5,
          p_janela_segundos: 900,
        }),
      ),
    );
    expect(results.filter((r) => r.data === true)).toHaveLength(5);
  });

  it("customers cannot call it nor read the table", async () => {
    const c = await createCustomer("ratelimit");
    const rpc = await c.client.rpc("hit_rate_limit", {
      p_chave: "x",
      p_max: 1000,
      p_janela_segundos: 1,
    });
    expect(rpc.error).not.toBeNull();
    const table = await c.client.from("auth_rate_limits").select("*");
    expect(table.error?.code).toBe("42501");
  });
});

describe("delete_account", () => {
  it("removes the login and personal data, keeps the orders unlinked", async () => {
    const admin = serviceClient();
    const c = await createCustomer("excluir");
    await admin.from("profiles").update({ cpf: "52998224725" }).eq("id", c.id);
    await admin.from("addresses").insert({
      user_id: c.id,
      cep: "01001000",
      rua: "Praça da Sé",
      numero: "1",
      bairro: "Sé",
      cidade: "São Paulo",
      uf: "SP",
    });
    const { variantId } = await createVariant({ estoque: 3 });
    const order = await createOrder({ userId: c.id, variantId });

    const { error } = await admin.rpc("delete_account", { p_user_id: c.id });
    expect(error).toBeNull();

    const profile = await admin.from("profiles").select("id").eq("id", c.id);
    expect(profile.data).toEqual([]);
    const addresses = await admin
      .from("addresses")
      .select("id")
      .eq("user_id", c.id);
    expect(addresses.data).toEqual([]);
    const { data: user } = await admin.auth.admin.getUserById(c.id);
    expect(user.user).toBeNull();

    // The order stays, unlinked, with the fiscal copies taken at checkout.
    const { data: kept } = await admin
      .from("orders")
      .select("user_id, cliente_nome, cliente_cpf")
      .eq("id", order.id)
      .single();
    expect(kept).toEqual({
      user_id: null,
      cliente_nome: "Cliente de teste",
      cliente_cpf: "00000000191",
    });
  });

  it("refuses admin accounts", async () => {
    const admin = serviceClient();
    const c = await createCustomer("admin-excluir");
    await admin.from("profiles").update({ role: "admin" }).eq("id", c.id);
    const { error } = await admin.rpc("delete_account", { p_user_id: c.id });
    expect(error?.message).toBe("admin_account");
  });

  it("customers cannot call it", async () => {
    const c = await createCustomer("excluir-rpc");
    const { error } = await c.client.rpc("delete_account", {
      p_user_id: c.id,
    });
    expect(error).not.toBeNull();
  });
});
