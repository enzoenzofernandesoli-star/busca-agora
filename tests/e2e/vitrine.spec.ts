import { expect, test } from "@playwright/test";

// Uses the 6 sample products from scripts/seed-dev.ts (tests/e2e/global-setup.ts).
const FONE = "/p/fone-bluetooth-com-microfone-e-cancelamento-de-ruido";

test.describe("vitrine", () => {
  test("home mostra os mais buscados com preço", async ({ page }) => {
    await page.goto("/");
    const secao = page.getByRole("region", { name: "Mais buscados" });
    await expect(secao.getByRole("link").first()).toBeVisible();
    await expect(secao).toContainText("R$ 89,90");
  });

  test("busca sem acento acha o sérum e filtra por preço", async ({ page }) => {
    await page.goto("/busca?q=serum");
    await expect(
      page.getByRole("heading", { level: 1, name: /serum/ }),
    ).toBeVisible();
    // The local database may also hold rows from the db tests: assert on
    // the seed products, not on totals.
    await expect(
      page.getByRole("link", { name: /Sérum facial com vitamina C 30 ml/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Fone Bluetooth/ }),
    ).toHaveCount(0);

    await page.goto("/c/eletronicos?min=100&max=200");
    await expect(page.getByRole("link", { name: /Smartwatch/ })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Caixa de som portátil/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Carregador turbo/ }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /Fone Bluetooth/ }),
    ).toHaveCount(0);
  });

  test("filtro e ordenação pelo formulário", async ({ page }, info) => {
    await page.goto("/c/eletronicos");
    if (info.project.name === "mobile") {
      await page.getByText("Filtrar e ordenar").click();
    }
    const form = page
      .getByRole("form", { name: "Filtros" })
      .locator("visible=true");
    await form.getByLabel("Ordenar por").selectOption("menor_preco");
    await form.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page).toHaveURL(/ordem=menor_preco/);
    const primeiro = page.locator("main ul li").first();
    await expect(primeiro).toContainText("R$ 59,90");
  });

  test("sugestões aparecem enquanto digita", async ({ page }) => {
    await page.goto("/");
    const busca = page
      .getByRole("combobox", { name: "Buscar na loja" })
      .locator("visible=true");
    await busca.fill("smartw");
    const opcao = page.getByRole("option", { name: /Smartwatch/ });
    await expect(opcao).toBeVisible();
    await busca.press("ArrowDown");
    await busca.press("Enter");
    await expect(page).toHaveURL(/\/p\/smartwatch/);
  });

  test("página de produto: variantes, estoque e compra desabilitada", async ({
    page,
  }) => {
    await page.goto(FONE);
    await expect(
      page.getByRole("heading", { level: 1, name: /Fone Bluetooth/ }),
    ).toBeVisible();
    await expect(page.getByText("R$ 89,90").first()).toBeVisible();
    await expect(page.getByText("em até 12x no cartão").first()).toBeVisible();

    await page.getByRole("button", { name: "Azul (esgotado)" }).click();
    await expect(page.getByText("Esgotado").first()).toBeVisible();
    await page.getByRole("button", { name: "Preto", exact: true }).click();
    await expect(page.getByText("Em estoque")).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Adicionar ao carrinho" }),
    ).toBeDisabled();

    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .textContent();
    expect(jsonLd).toContain('"price":"89.90"');
  });

  test("404 com a marca para URL e produto inexistentes", async ({ page }) => {
    for (const url of ["/nao-existe", "/p/nao-existe", "/c/roupas"]) {
      const res = await page.goto(url);
      expect(res?.status(), url).toBe(404);
      await expect(page.getByText("Aqui não tá.")).toBeVisible();
    }
  });
});

test.describe("abertura (splash)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  // Real-time animation on a dev server shared with parallel tests: under
  // load the 1.5 s window can be missed. Retry instead of loosening the test.
  test.describe.configure({ retries: 1 });

  // page.clock cannot be used here: a frozen clock also stops React from
  // hydrating, so the splash would never close. Real time, generous waits.
  test("aparece só na primeira visita e some sozinho", async ({
    page,
    context,
  }) => {
    const res = await page.goto("/");
    // Rendered on the server, so it covers the page from the first paint.
    expect(await res?.text()).toContain("Abertura da Busca Agora");
    await expect
      .poll(async () => (await context.cookies()).map((c) => c.name))
      .toContain("ba_visto");
    const splash = page.getByRole("dialog", {
      name: "Abertura da Busca Agora",
    });
    // 1.5 s after hydration at most (with margin for the dev server).
    await expect(splash).toHaveCount(0, { timeout: 3_000 });

    await page.reload();
    await expect(splash).toHaveCount(0);
  });

  test("Pular fecha na hora", async ({ page, context }) => {
    // Under parallel load the 1.5 s auto-close can beat the click. Pause the
    // CSS fade and drop only the splash's 1500 ms timer, so this test checks
    // the button and nothing else.
    await page.addInitScript(() => {
      const realSetTimeout = window.setTimeout.bind(window);
      window.setTimeout = ((
        handler: TimerHandler,
        delay?: number,
        ...args: unknown[]
      ) =>
        delay === 1500
          ? 0
          : realSetTimeout(
              handler,
              delay,
              ...args,
            )) as typeof window.setTimeout;
      document.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent =
          ".ba-splash, .ba-splash * { animation-play-state: paused !important; }";
        document.head.appendChild(style);
      });
    });
    await page.goto("/");
    // The cookie is written on hydration: from here the button works.
    await expect
      .poll(async () => (await context.cookies()).map((c) => c.name), {
        intervals: [50],
      })
      .toContain("ba_visto");
    const splash = page.getByRole("dialog", {
      name: "Abertura da Busca Agora",
    });
    await page
      .getByRole("button", { name: "Pular" })
      .click({ force: true, timeout: 1_000 });
    await expect(splash).toHaveCount(0, { timeout: 300 });
  });

  test("nunca aparece em link direto de produto", async ({ page }) => {
    await page.goto(FONE);
    await expect(
      page.getByRole("dialog", { name: "Abertura da Busca Agora" }),
    ).toHaveCount(0);
  });

  test("respeita prefers-reduced-motion", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("http://localhost:3100/");
    await expect(
      page.getByRole("dialog", { name: "Abertura da Busca Agora" }),
    ).toBeHidden();
    await context.close();
  });
});
