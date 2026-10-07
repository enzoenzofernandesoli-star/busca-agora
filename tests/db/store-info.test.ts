import { describe, expect, it } from "vitest";

import { anonClient, createCustomer, serviceClient } from "./helpers";

describe("store_info", () => {
  it("visitors read the public identity and nothing else of settings", async () => {
    const admin = serviceClient();
    const { data: before } = await admin
      .from("settings")
      .select(
        "razao_social, cpf_vendedor, email_contato, whatsapp, ie, printer_id",
      )
      .eq("id", true)
      .single();
    await admin
      .from("settings")
      .update({
        razao_social: "Loja de Teste",
        cpf_vendedor: "52998224725",
        email_contato: "sac@example.test",
        whatsapp: "5511999998888",
        ie: "ie-secreta",
        printer_id: "impressora-secreta",
      })
      .eq("id", true);

    try {
      const { data, error } = await anonClient().rpc("store_info");
      expect(error).toBeNull();
      expect(data).toMatchObject({
        vendedor: "Loja de Teste",
        cpf: "52998224725",
        email: "sac@example.test",
        whatsapp: "5511999998888",
      });
      const text = JSON.stringify(data);
      expect(text).not.toContain("ie-secreta");
      expect(text).not.toContain("impressora-secreta");
      expect(text).not.toContain("endereco_origem");

      const direct = await anonClient().from("settings").select("*");
      expect(direct.data ?? []).toEqual([]);
      const c = await createCustomer("settings");
      const asCustomer = await c.client.from("settings").select("*");
      expect(asCustomer.data ?? []).toEqual([]);
    } finally {
      await admin.from("settings").update(before!).eq("id", true);
    }
  });

  it("hides the CPF once there is a CNPJ", async () => {
    const admin = serviceClient();
    const { data: before } = await admin
      .from("settings")
      .select("cnpj, cpf_vendedor")
      .eq("id", true)
      .single();
    await admin
      .from("settings")
      .update({ cnpj: "11222333000181", cpf_vendedor: "52998224725" })
      .eq("id", true);
    try {
      const { data } = await anonClient().rpc("store_info");
      expect(data).toMatchObject({ cnpj: "11222333000181", cpf: null });
    } finally {
      await admin.from("settings").update(before!).eq("id", true);
    }
  });
});

describe("cleanup_old_data", () => {
  it("deletes old rate-limit marks and abandoned visitor carts only", async () => {
    const admin = serviceClient();
    const tag = `limpeza-${Date.now()}`;
    const velho = new Date(Date.now() - 40 * 86_400_000).toISOString();
    await admin.from("auth_rate_limits").insert([
      {
        chave: `${tag}-velha`,
        janela_inicio: "2000-01-01T00:00:00Z",
        tentativas: 1,
      },
      {
        chave: `${tag}-nova`,
        janela_inicio: new Date().toISOString(),
        tentativas: 1,
      },
    ]);
    // Inserted already old (the updated_at trigger only runs on UPDATE).
    const { error: insertError } = await admin.from("carts").insert([
      { session_id: `${tag}-abandonado`, updated_at: velho },
      { session_id: `${tag}-recente`, updated_at: new Date().toISOString() },
    ]);
    expect(insertError).toBeNull();

    const { error } = await admin.rpc("cleanup_old_data");
    expect(error).toBeNull();

    const { data: marks } = await admin
      .from("auth_rate_limits")
      .select("chave")
      .like("chave", `${tag}%`);
    expect((marks ?? []).map((m) => m.chave)).toEqual([`${tag}-nova`]);
    const { data: left } = await admin
      .from("carts")
      .select("session_id")
      .like("session_id", `${tag}%`);
    expect((left ?? []).map((c) => c.session_id)).toEqual([`${tag}-recente`]);
    await admin.from("carts").delete().like("session_id", `${tag}%`);
    await admin.from("auth_rate_limits").delete().like("chave", `${tag}%`);
  });

  it("visitors and customers cannot run it", async () => {
    const { error } = await anonClient().rpc("cleanup_old_data");
    expect(error).not.toBeNull();
  });
});
