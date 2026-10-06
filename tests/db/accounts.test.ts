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

describe("terms acceptance is written by the server only", () => {
  it("a customer cannot set terms_accepted_at directly", async () => {
    const c = await createCustomer("termos");
    const { error } = await c.client
      .from("profiles")
      .update({ terms_accepted_at: "2000-01-01T00:00:00Z" })
      .eq("id", c.id);
    expect(error?.code).toBe("42501");

    const { data } = await serviceClient()
      .from("profiles")
      .select("terms_accepted_at")
      .eq("id", c.id)
      .single();
    expect(data?.terms_accepted_at).toBeNull();
  });

  it("the customer still edits name, CPF and phone", async () => {
    const c = await createCustomer("termos-edita");
    const { error } = await c.client
      .from("profiles")
      .update({ nome: "Novo", cpf: "52998224725", telefone: "11988887777" })
      .eq("id", c.id);
    expect(error).toBeNull();
  });
});

describe("main address changes atomically", () => {
  const base = {
    p_cep: "01001000",
    p_rua: "Praça da Sé",
    p_bairro: "Sé",
    p_cidade: "São Paulo",
    p_uf: "SP",
  };

  async function mains(userId: string) {
    const { data } = await serviceClient()
      .from("addresses")
      .select("id")
      .eq("user_id", userId)
      .eq("principal", true);
    return (data ?? []).map((r) => r.id);
  }

  it("first address becomes main; a new main moves the mark", async () => {
    const c = await createCustomer("end-principal");
    const first = await c.client.rpc("save_address", {
      ...base,
      p_numero: "1",
      p_principal: false,
    });
    expect(first.error).toBeNull();
    expect(await mains(c.id)).toEqual([first.data]);

    const second = await c.client.rpc("save_address", {
      ...base,
      p_numero: "2",
      p_principal: true,
    });
    expect(await mains(c.id)).toEqual([second.data]);
  });

  it("unknown or foreign target fails and keeps the current main", async () => {
    const a = await createCustomer("end-a");
    const b = await createCustomer("end-b");
    const own = await a.client.rpc("save_address", {
      ...base,
      p_numero: "1",
      p_principal: true,
    });
    const foreign = await b.client.rpc("save_address", {
      ...base,
      p_numero: "9",
      p_principal: true,
    });

    for (const target of [randomUUID(), foreign.data as string]) {
      const set = await a.client.rpc("set_main_address", {
        p_address_id: target,
      });
      expect(set.error?.message).toBe("address_not_found");

      const edit = await a.client.rpc("save_address", {
        ...base,
        p_numero: "3",
        p_principal: true,
        p_address_id: target,
      });
      expect(edit.error?.message).toBe("address_not_found");

      const del = await a.client.rpc("delete_address", {
        p_address_id: target,
      });
      expect(del.error?.message).toBe("address_not_found");
    }

    expect(await mains(a.id)).toEqual([own.data]);
    expect(await mains(b.id)).toEqual([foreign.data]);
  });

  it("unchecking main while editing keeps it main", async () => {
    const c = await createCustomer("end-desmarca");
    const only = await c.client.rpc("save_address", {
      ...base,
      p_numero: "1",
      p_principal: true,
    });
    await c.client.rpc("save_address", {
      ...base,
      p_numero: "10",
      p_principal: false,
      p_address_id: only.data as string,
    });
    expect(await mains(c.id)).toEqual([only.data]);
  });

  it("parallel main changes end with exactly one main", async () => {
    const c = await createCustomer("end-paralelo");
    const ids: string[] = [];
    for (let i = 1; i <= 4; i++) {
      const r = await c.client.rpc("save_address", {
        ...base,
        p_numero: String(i),
        p_principal: false,
      });
      ids.push(r.data as string);
    }
    await Promise.all(
      ids.map((id) => c.client.rpc("set_main_address", { p_address_id: id })),
    );
    expect(await mains(c.id)).toHaveLength(1);
  });

  it("deleting the main promotes the oldest remaining address", async () => {
    const c = await createCustomer("end-exclui");
    const first = await c.client.rpc("save_address", {
      ...base,
      p_numero: "1",
      p_principal: false,
    });
    const second = await c.client.rpc("save_address", {
      ...base,
      p_numero: "2",
      p_principal: true,
    });
    const del = await c.client.rpc("delete_address", {
      p_address_id: second.data as string,
    });
    expect(del.error).toBeNull();
    expect(await mains(c.id)).toEqual([first.data]);
  });
});
