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
