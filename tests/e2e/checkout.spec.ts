import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { createTestCustomer, localAdmin } from "./supabase";

// Phase 5 end to end with the fake Mercado Pago (PAYMENTS_FAKE=true in
// playwright.config.ts) and fixed shipping quotes: cart -> checkout ->
// "Mercado Pago" -> signed webhook -> thank-you page reading the database.

// Products made for these tests leave the store when each test ends, so the
// catalog tests never see them.
const created: string[] = [];
test.afterEach(async () => {
  if (created.length === 0) return;
  await localAdmin()
    .from("products")
    .update({ ativo: false })
    .in("id", created.splice(0));
});

async function customerWithCart(estoque = 5) {
  const c = await createTestCustomer("Cliente Checkout");
  const db = localAdmin();
  const { data: cat } = await db
    .from("categories")
    .select("id")
    .eq("slug", "cosmeticos")
    .single();
  const { data: prod, error: pErr } = await db
    .from("products")
    .insert({
      nome: `Teste checkout ${randomUUID().slice(0, 6)}`,
      slug: `teste-checkout-${randomUUID().slice(0, 8)}`,
      category_id: cat!.id,
      ncm: "33049910",
      ativo: true,
    })
    .select("id")
    .single();
  if (pErr) throw pErr;
  const { data: variant, error: vErr } = await db
    .from("product_variants")
    .insert({
      product_id: prod.id,
      sku: `E2E-${randomUUID().slice(0, 8)}`,
      preco_cents: 10000,
      estoque,
      peso_g: 200,
      altura_cm: 5,
      largura_cm: 10,
      comprimento_cm: 15,
    })
    .select("id")
    .single();
  if (vErr) throw vErr;
  const { data: cart } = await db
    .from("carts")
    .upsert({ user_id: c.id }, { onConflict: "user_id" })
    .select("id")
    .single();
  await db
    .from("cart_items")
    .insert({ cart_id: cart!.id, variant_id: variant.id, quantidade: 1 });
  created.push(prod.id);
  return { ...c, variantId: variant.id };
}

async function login(page: Page, email: string, senha: string) {
  await page.goto("/entrar?volta=%2Fcheckout");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(senha);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/checkout$/, { timeout: 60_000 });
}

async function fillCheckout(page: Page) {
  await page.route("**/api/cep/**", (route) =>
    route.fulfill({
      json: {
        endereco: {
          cep: "01310100",
          rua: "Avenida Paulista",
          bairro: "Bela Vista",
          cidade: "São Paulo",
          uf: "SP",
        },
      },
    }),
  );
  const main = page.getByRole("main");
  await main.getByLabel("CEP", { exact: true }).fill("01310100");
  await expect(main.getByLabel("Rua")).toHaveValue("Avenida Paulista", {
    timeout: 15_000,
  });
  await main.getByLabel("Número").fill("1000");
  await main.getByLabel(/CPF para a nota fiscal/).fill("52998224725");
  await main.getByText("Correios · PAC").click({ timeout: 20_000 });
  await main.getByText("Pix", { exact: true }).click();
}

test.describe("checkout", () => {
  // The fake payment page calls our own webhook: the dev server compiles
  // several routes in a row on the first run.
  test.describe.configure({ timeout: 120_000 });

  test("compra com Pix até o pedido confirmado", async ({ page }) => {
    const c = await customerWithCart();
    await login(page, c.email, c.senha);
    await fillCheckout(page);
    // Display total: R$ 100,00 + PAC R$ 23,45.
    await expect(page.getByText("R$ 123,45").first()).toBeVisible();

    await page.getByRole("button", { name: "Ir para o pagamento" }).click();
    await expect(page).toHaveURL(/\/dev\/pagamento-teste/, { timeout: 60_000 });
    await page.getByRole("button", { name: "Aprovar pagamento" }).click();

    await expect(page).toHaveURL(/\/pedido\/BA-\d+\/obrigado$/, {
      timeout: 60_000,
    });
    await expect(
      page.getByRole("heading", { name: "Pedido confirmado!" }),
    ).toBeVisible();

    const db = localAdmin();
    const numero = page.url().match(/BA-\d+/)![0];
    const { data: order } = await db
      .from("orders")
      .select("status, total_cents, payment_method")
      .eq("numero", numero)
      .single();
    expect(order).toEqual({
      status: "paid",
      total_cents: 12345,
      payment_method: "pix",
    });
    const { data: v } = await db
      .from("product_variants")
      .select("estoque")
      .eq("id", c.variantId)
      .single();
    expect(v?.estoque).toBe(4);
  });

  test("valor pago diferente do pedido não confirma", async ({ page }) => {
    const c = await customerWithCart();
    await login(page, c.email, c.senha);
    await fillCheckout(page);
    await page.getByRole("button", { name: "Ir para o pagamento" }).click();
    await expect(page).toHaveURL(/\/dev\/pagamento-teste/, { timeout: 60_000 });
    await page.getByRole("button", { name: "Pagar valor errado" }).click();
    await expect(page).toHaveURL(/\/obrigado$/, { timeout: 60_000 });
    await expect(
      page.getByRole("heading", { name: "Falta pouco!" }),
    ).toBeVisible();
  });

  test("visitante vai para o login", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/entrar\?volta=%2Fcheckout/);
  });

  test("webhook sem assinatura é recusado", async ({ request }) => {
    const res = await request.post(
      "/api/webhooks/mercadopago?data.id=123&type=payment",
      { data: { type: "payment", data: { id: "123" } } },
    );
    expect(res.status()).toBe(401);
  });
});
