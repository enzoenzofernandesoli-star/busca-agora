import { expect, test, type Page } from "@playwright/test";

import { createTestCustomer, createTestOrder } from "./supabase";

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

test.describe("meus pedidos", () => {
  test.describe.configure({ timeout: 90_000 });
  test("cliente vê o próprio pedido entregue e pede troca", async ({
    page,
  }) => {
    const c = await createTestCustomer();
    const pedido = await createTestOrder({
      userId: c.id,
      email: c.email,
      ate: "delivered",
    });
    await login(page, c.email, c.senha, "/conta/pedidos");

    await page.getByRole("link", { name: new RegExp(pedido.numero) }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: pedido.numero }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("AA123456789BR")).toBeVisible();
    await expect(page.getByText("Pedido entregue").first()).toBeVisible();

    await page
      .getByRole("button", { name: "Pedir troca ou devolução" })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Troca", { exact: true }).check();
    await dialog.getByLabel("Motivo").selectOption("defeito");
    await dialog
      .getByLabel("O que aconteceu?")
      .fill("O fone parou de funcionar do lado esquerdo.");
    await dialog.getByRole("button", { name: "Enviar pedido" }).click();
    await expect(dialog.getByText(/Pedido registrado/)).toBeVisible({
      timeout: 20_000,
    });

    await page.reload();
    await expect(page.getByText("Você pediu troca")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Pedir troca ou devolução" }),
    ).toHaveCount(0);
  });

  test("outro cliente recebe 404 no pedido de alguém", async ({ page }) => {
    const dono = await createTestCustomer("Dono");
    const pedido = await createTestOrder({
      userId: dono.id,
      email: dono.email,
      ate: "paid",
    });
    const outro = await createTestCustomer("Outro");
    await login(page, outro.email, outro.senha, "/conta");
    const res = await page.goto(`/conta/pedidos/${pedido.numero}`);
    expect(res?.status()).toBe(404);
  });
});

test.describe("rastreio público", () => {
  test("acha com o e-mail certo e não acha com o errado", async ({ page }) => {
    const email = `rastreio-${Date.now()}@example.test`;
    const pedido = await createTestOrder({
      userId: null,
      email,
      ate: "shipped",
    });

    await page.goto("/rastreio");
    await page.getByLabel("Número do pedido").fill(pedido.numero);
    await page.getByLabel("E-mail usado na compra").fill("errado@example.test");
    await page.getByRole("button", { name: "Rastrear pedido" }).click();
    await expect(page.getByText(/Não achamos um pedido/)).toBeVisible({
      timeout: 20_000,
    });
    // The typed values survive the error.
    await expect(page.getByLabel("Número do pedido")).toHaveValue(
      pedido.numero,
    );

    await page.getByLabel("E-mail usado na compra").fill(email.toUpperCase());
    await page.getByRole("button", { name: "Rastrear pedido" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: pedido.numero }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("AA123456789BR")).toBeVisible();
    // The e-mail never goes into the address bar.
    expect(page.url()).not.toContain("example.test");
  });

  test("link sem a prova do e-mail volta para o formulário", async ({
    page,
  }) => {
    const pedido = await createTestOrder({
      userId: null,
      email: `sem-token-${Date.now()}@example.test`,
      ate: "paid",
    });
    await page.goto(`/rastreio/${pedido.numero}`);
    await expect(page).toHaveURL(/\/rastreio$/);
    await page.goto(`/rastreio/${pedido.numero}?t=9999999999.falso`);
    await expect(page).toHaveURL(/\/rastreio$/);
  });
});

test("a fila só roda com o segredo do cron", async ({ request }) => {
  const casos: Record<string, string>[] = [
    {},
    { Authorization: "Bearer errado" },
  ];
  for (const headers of casos) {
    const post = await request.post("/api/cron/jobs", { headers });
    expect(post.status()).toBe(401);
    const get = await request.get("/api/cron/jobs", { headers });
    expect(get.status()).toBe(401);
  }
});
