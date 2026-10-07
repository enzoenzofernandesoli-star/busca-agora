import { expect, test, type Page } from "@playwright/test";

import { createTestCustomer } from "./supabase";

// Seed products (scripts/seed-dev.ts).
const SMARTWATCH = "/p/smartwatch-com-monitor-de-batimentos";
const CAIXA = "/p/caixa-de-som-portatil-a-prova-dagua";

// Never call Melhor Envio from tests: answer the store's own quote route.
async function mockFrete(page: Page) {
  await page.route("**/api/frete", async (route) => {
    const body = route.request().postDataJSON() as { cep: string };
    if (body.cep === "00000000") {
      return route.fulfill({ json: { ok: false, motivo: "cep_invalido" } });
    }
    return route.fulfill({
      json: {
        ok: true,
        opcoes: [
          {
            servicoId: "1",
            servico: "PAC",
            transportadora: "Correios",
            precoCents: 2345,
            prazoDias: 7,
          },
          {
            servicoId: "2",
            servico: "SEDEX",
            transportadora: "Correios",
            precoCents: 3990,
            prazoDias: 3,
          },
        ],
      },
    });
  });
}

async function addFromProductPage(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
  await expect(page.getByText("Adicionado").first()).toBeVisible({
    timeout: 20_000,
  });
}

test.describe("carrinho", () => {
  test("adiciona, altera quantidade, calcula frete e remove", async ({
    page,
  }) => {
    await mockFrete(page);
    await addFromProductPage(page, SMARTWATCH);
    await expect(
      page.getByRole("link", { name: "Carrinho com 1 item" }).first(),
    ).toBeAttached();

    await page.goto("/carrinho");
    await expect(
      page.getByText("Smartwatch com monitor de batimentos"),
    ).toBeVisible();
    await expect(page.getByText("R$ 129,90").first()).toBeVisible();

    await page
      .getByRole("button", { name: /Aumentar quantidade de Smartwatch/ })
      .click();
    await expect(page.getByText("R$ 259,80").first()).toBeVisible({
      timeout: 15_000,
    });

    await page.getByLabel(/CEP/).fill("20040002");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(page.getByText("PAC")).toBeVisible();
    await expect(page.getByText("R$ 23,45")).toBeVisible();

    await page.getByRole("button", { name: "Remover" }).click();
    await expect(page.getByText("Seu carrinho está vazio")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("CEP inválido mostra mensagem clara", async ({ page }) => {
    await mockFrete(page);
    await page.goto(SMARTWATCH);
    await page.getByLabel(/CEP/).fill("00000000");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(page.getByText(/CEP inválido/)).toBeVisible();
  });

  test("Comprar agora leva ao carrinho", async ({ page }) => {
    await page.goto(CAIXA);
    await page.getByRole("button", { name: "Comprar agora" }).click();
    await expect(page).toHaveURL(/\/carrinho$/, { timeout: 20_000 });
    await expect(page.getByText(/Caixa de som port/)).toBeVisible();
  });

  test("o carrinho de visitante vai para a conta no login", async ({
    page,
  }) => {
    const c = await createTestCustomer();
    await addFromProductPage(page, CAIXA);

    await page.goto("/entrar?volta=%2Fcarrinho");
    await page.getByLabel("E-mail").fill(c.email);
    await page.getByLabel("Senha", { exact: true }).fill(c.senha);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page).toHaveURL(/\/carrinho$/, { timeout: 30_000 });
    await expect(page.getByText(/Caixa de som port/)).toBeVisible();
  });
});
