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
            // A different price per destination shows which CEP was quoted.
            precoCents: body.cep === "01310100" ? 1111 : 2345,
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
    // The header badge follows quantity changes, not only additions.
    await expect(
      page.getByRole("link", { name: "Carrinho com 2 itens" }).first(),
    ).toBeAttached();

    await page.getByLabel(/Calcular frete/).fill("20040002");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(page.getByText("PAC", { exact: true })).toBeVisible();
    await expect(page.getByText("R$ 23,45")).toBeVisible();

    await page.getByRole("button", { name: "Remover" }).click();
    await expect(page.getByText("Seu carrinho está vazio")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("link", { name: "Carrinho vazio" }).first(),
    ).toBeAttached();
  });

  test("no celular a barra fixa leva ao pagamento e some perto do resumo", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await addFromProductPage(page, SMARTWATCH);
    await page.goto("/carrinho");
    const barra = page.getByRole("link", { name: "Continuar", exact: true });
    await expect(barra).toBeVisible();
    await expect(barra).toHaveAttribute("href", "/checkout");
    // Button half behind the bottom nav: not usable yet, so the bar stays.
    const navTop = await page
      .getByRole("navigation", { name: "Navegação principal" })
      .evaluate((n) => n.getBoundingClientRect().top);
    await page.locator("#carrinho-continuar").evaluate((el, top) => {
      const r = el.getBoundingClientRect();
      window.scrollBy(0, r.top - (top - r.height / 2));
    }, navTop);
    await expect(barra).toBeVisible();
    // Fully above the nav: the summary button takes over.
    await page
      .locator("#carrinho-continuar")
      .evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(barra).toBeHidden();
  });

  test("com movimento reduzido a barra e a linha não animam", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await addFromProductPage(page, SMARTWATCH);
    await page.goto("/carrinho");
    const barra = page.getByRole("link", { name: "Continuar", exact: true });
    await expect(barra).toBeVisible();
    for (const el of [
      barra.locator(".."),
      page
        .getByRole("list")
        .filter({ hasText: "Smartwatch" })
        .locator("li > div")
        .first(),
    ]) {
      const estilo = await el.evaluate((n) => {
        const cs = getComputedStyle(n);
        return { dur: cs.transitionDuration, anim: cs.animationName };
      });
      expect(
        estilo.dur.split(",").every((d) => parseFloat(d) < 0.001),
        JSON.stringify(estilo),
      ).toBe(true);
      expect(estilo.anim).toBe("none");
    }
    await page
      .locator("#carrinho-continuar")
      .evaluate((el) => el.scrollIntoView({ block: "center" }));
    await expect(barra).toBeHidden();
    const transform = await page
      .locator("[data-escondida]")
      .evaluate((n) => getComputedStyle(n).transform);
    expect(transform).toBe("none");
  });

  test("CEP inválido mostra mensagem clara", async ({ page }) => {
    await mockFrete(page);
    await page.goto(SMARTWATCH);
    await page.getByLabel(/Calcular frete/).fill("00000000");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(page.getByText(/CEP inválido/)).toBeVisible();
  });

  test("trocar o CEP no topo recalcula o frete já calculado", async ({
    page,
  }) => {
    await mockFrete(page);
    await page.goto(SMARTWATCH);
    await page.getByLabel(/Calcular frete/).fill("20040002");
    await page.getByRole("button", { name: "Calcular" }).click();
    await expect(page.getByText("R$ 23,45")).toBeVisible();

    await page
      .getByRole("button", { name: /Enviar para/ })
      .filter({ visible: true })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Para onde vamos enviar?",
    });
    await dialog.getByLabel("CEP").fill("01310100");
    await dialog.getByRole("button", { name: "Salvar CEP" }).click();

    await expect(page.getByLabel(/Calcular frete/)).toHaveValue("01310-100");
    await expect(page.getByText("R$ 11,11")).toBeVisible();
    await expect(page.getByText("R$ 23,45")).toHaveCount(0);
  });

  test("o carrinho do topo só pula ao adicionar", async ({ page }) => {
    await addFromProductPage(page, SMARTWATCH);
    await expect(page.locator(".ba-bump").first()).toBeAttached();
    // Opening the cart syncs the count (same event) but adds nothing.
    await page.goto("/carrinho");
    await expect(
      page.getByText("Smartwatch com monitor de batimentos"),
    ).toBeVisible();
    await expect(page.locator(".ba-bump")).toHaveCount(0);
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
