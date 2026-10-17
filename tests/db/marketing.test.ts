import { describe, expect, it } from "vitest";

import { anonClient, createCustomer, serviceClient } from "./helpers";

async function consent(id: string) {
  const { data, error } = await serviceClient()
    .from("profiles")
    .select(
      "marketing_opt_in, marketing_opt_in_at, marketing_opt_out_at, marketing_channels",
    )
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

describe("aceite de marketing (LGPD)", () => {
  it("começa desligado", async () => {
    const c = await createCustomer("mkt-padrao");
    expect(await consent(c.id)).toEqual({
      marketing_opt_in: false,
      marketing_opt_in_at: null,
      marketing_opt_out_at: null,
      marketing_channels: [],
    });
  });

  it("o cliente liga e desliga, e o banco grava as datas", async () => {
    const c = await createCustomer("mkt-liga");
    expect(
      (
        await c.client.rpc("set_my_marketing_consent", {
          p_opt_in: true,
          p_channels: ["whatsapp"],
        })
      ).error,
    ).toBeNull();
    const ligado = await consent(c.id);
    expect(ligado.marketing_opt_in).toBe(true);
    expect(ligado.marketing_channels).toEqual(["whatsapp"]);
    expect(ligado.marketing_opt_in_at).not.toBeNull();

    await c.client.rpc("set_my_marketing_consent", {
      p_opt_in: false,
      p_channels: [],
    });
    const desligado = await consent(c.id);
    expect(desligado.marketing_opt_in).toBe(false);
    expect(desligado.marketing_channels).toEqual([]);
    expect(desligado.marketing_opt_out_at).not.toBeNull();
  });

  it("canal inválido é recusado e o cliente não grava as colunas direto", async () => {
    const c = await createCustomer("mkt-direto");
    const bad = await c.client.rpc("set_my_marketing_consent", {
      p_opt_in: true,
      p_channels: ["sms"],
    });
    expect(bad.error).not.toBeNull();
    await c.client
      .from("profiles")
      .update({ marketing_opt_in: true })
      .eq("id", c.id);
    expect((await consent(c.id)).marketing_opt_in).toBe(false);
  });

  it("visitante não chama as funções", async () => {
    const anon = anonClient();
    expect(
      (
        await anon.rpc("set_my_marketing_consent", {
          p_opt_in: true,
          p_channels: [],
        })
      ).error,
    ).not.toBeNull();
    const c = await createCustomer("mkt-anon");
    expect(
      (
        await anon.rpc("set_marketing_consent", {
          p_user_id: c.id,
          p_opt_in: true,
          p_channels: [],
        })
      ).error,
    ).not.toBeNull();
    expect((await consent(c.id)).marketing_opt_in).toBe(false);
  });
});
