import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { createTestCustomer, localAdmin } from "./supabase";

// 1x1 PNG, generated in memory: no fixture files.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);

async function login(page: Page, email: string, senha: string, volta: string) {
  await page.goto(`/entrar?volta=${encodeURIComponent(volta)}`);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(senha);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Aguarde..." })).toHaveCount(
    0,
    { timeout: 30_000 },
  );
}

async function createAdmin() {
  const c = await createTestCustomer("Pai Admin");
  await localAdmin().from("profiles").update({ role: "admin" }).eq("id", c.id);
  return c;
}

test.describe("painel admin", () => {
  test("cliente comum recebe 404 em todas as telas do admin", async ({
    page,
  }) => {
    const c = await createTestCustomer();
    await login(page, c.email, c.senha, "/conta");
    for (const url of [
      "/admin",
      "/admin/pedidos",
      "/admin/produtos",
      "/admin/produtos/novo",
      "/admin/configuracoes",
    ]) {
      const res = await page.goto(url);
      expect(res?.status(), url).toBe(404);
    }
  });

  test("cliente comum não recebe a tela do admin por navegação parcial (RSC)", async ({
    page,
  }) => {
    // A client-side navigation from /admin/produtos/novo only asks for the
    // [id] segment; the /admin layout (and its role check) is not rendered.
    const db = localAdmin();
    const { data: cat } = await db
      .from("categories")
      .select("id")
      .eq("slug", "eletronicos")
      .single();
    const custo = 987_654;
    const { data: prod } = await db
      .from("products")
      .insert({
        nome: "Produto RSC",
        slug: `rsc-${randomUUID().slice(0, 8)}`,
        category_id: cat!.id,
        ncm: "85183000",
        ativo: false,
      })
      .select("id")
      .single();
    await db.from("product_variants").insert({
      product_id: prod!.id,
      sku: `RSC-${randomUUID().slice(0, 6)}`.toUpperCase(),
      nome: "Única",
      preco_cents: 10_000,
      custo_cents: custo,
      estoque: 1,
      peso_g: 100,
      altura_cm: 1,
      largura_cm: 1,
      comprimento_cm: 1,
    });

    try {
      const c = await createTestCustomer();
      await login(page, c.email, c.senha, "/conta");
      const tree = [
        "",
        {
          children: [
            "admin",
            {
              children: [
                "produtos",
                { children: ["novo", { children: ["__PAGE__", {}] }] },
              ],
            },
          ],
        },
      ];
      const res = await page.request.get(`/admin/produtos/${prod!.id}`, {
        headers: {
          RSC: "1",
          "Next-Router-State-Tree": encodeURIComponent(JSON.stringify(tree)),
        },
      });
      const body = await res.text();
      expect(body).not.toContain(String(custo));
      expect(body).not.toContain("9876,54");
      expect(body).not.toContain("Produto RSC");
    } finally {
      await db.from("products").delete().eq("id", prod!.id);
    }
  });

  test("admin cadastra produto com foto e variação e ele aparece na loja", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const admin = await createAdmin();
    await login(page, admin.email, admin.senha, "/admin/produtos/novo");
    await expect(page).toHaveURL(/\/admin\/produtos\/novo$/);

    const nome = `Fone de teste ${randomUUID().slice(0, 6)}`;
    await page.getByLabel("Nome do produto").fill(nome);
    await page.getByLabel("Categoria").selectOption({ label: "Eletrônicos" });
    await page.getByLabel("À venda na loja").check();
    await page.getByLabel("NCM").fill("8518.30.00");

    await page.locator('input[type="file"]').setInputFiles({
      name: "foto.png",
      mimeType: "image/png",
      buffer: PNG,
    });
    await expect(page.getByText("Capa")).toBeVisible({ timeout: 20_000 });

    await page.getByLabel("Nome da variação (cor, tamanho...)").fill("Preto");
    await page.getByLabel("SKU").fill(`E2E-${randomUUID().slice(0, 6)}`);
    await page.getByLabel("Preço (R$)").fill("99,90");
    await page.getByLabel("Estoque", { exact: true }).fill("7");
    await page.getByLabel("Peso (g)").fill("250");
    await page.getByLabel("Altura (cm)").fill("5");
    await page.getByLabel("Largura (cm)").fill("12");
    await page.getByLabel("Comprimento (cm)").fill("18");

    await page.getByRole("button", { name: "Salvar produto" }).click();
    await expect(page.getByText("Produto salvo.")).toBeVisible({
      timeout: 30_000,
    });

    // The link opens a new tab; follow its address in this one.
    const href = await page
      .getByRole("link", { name: /Ver na loja/ })
      .getAttribute("href");
    await page.goto(href ?? "/");
    await expect(
      page.getByRole("heading", { level: 1, name: nome }),
    ).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("R$ 99,90").first()).toBeVisible();
  });

  test("erro de validação aponta o campo e não apaga o que foi digitado", async ({
    page,
  }) => {
    const admin = await createAdmin();
    await login(page, admin.email, admin.senha, "/admin/produtos/novo");
    await page.getByLabel("Nome do produto").fill("Sem NCM");
    await page.getByLabel("Preço (R$)").fill("10,00");
    await page.getByRole("button", { name: "Salvar produto" }).click();
    await expect(page.getByText("Confira os campos marcados.")).toBeVisible();
    await expect(page.getByText(/NCM tem 8 dígitos/)).toBeVisible();
    await expect(page.getByLabel("Nome do produto")).toHaveValue("Sem NCM");
    await expect(page.getByLabel("Preço (R$)")).toHaveValue("10,00");
  });

  test("painel mostra os números e configurações não mostram chaves", async ({
    page,
  }) => {
    const admin = await createAdmin();
    await login(page, admin.email, admin.senha, "/admin");
    await expect(page.getByText("Vendas de hoje")).toBeVisible();
    await expect(page.getByText("Pedidos a enviar")).toBeVisible();

    await page.goto("/admin/configuracoes");
    await expect(page.getByText(/Melhor Envio/).first()).toBeVisible();
    const html = await page.content();
    expect(html).not.toMatch(/eyJ[a-zA-Z0-9_-]{20,}\./);
  });
});
