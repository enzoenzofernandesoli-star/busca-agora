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
    const primeiro = page
      .getByRole("list", { name: "Produtos" })
      .getByRole("listitem")
      .first();
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
    await expect(opcao).toHaveAttribute("aria-selected", "true");
    await busca.press("Enter");
    // First dev compile of the product page can be slow under parallel load.
    await expect(page).toHaveURL(/\/p\/smartwatch/, { timeout: 20_000 });
  });

  test("página de produto: variantes, estoque e botões de compra", async ({
    page,
  }) => {
    await page.goto(FONE);
    await expect(
      page.getByRole("heading", { level: 1, name: /Fone Bluetooth/ }),
    ).toBeVisible();
    await expect(page.getByText("R$ 89,90").first()).toBeVisible();
    await expect(page.getByText("em até 12x no cartão").first()).toBeVisible();

    await page.getByRole("button", { name: "Azul (esgotado)" }).click();
    // Sold-out variant: a single disabled "Esgotado" button.
    await expect(
      page.getByRole("button", { name: "Esgotado", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByRole("button", { name: "Adicionar ao carrinho" }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Preto", exact: true }).click();
    await expect(page.getByText("Em estoque")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Adicionar ao carrinho" }),
    ).toBeEnabled();

    const jsonLd = await page
      .locator('script[type="application/ld+json"]')
      .textContent();
    expect(jsonLd).toContain('"price":"89.90"');
  });

  test("página além da última volta para a última página", async ({ page }) => {
    await page.goto("/c/eletronicos?pagina=99");
    // Lands on the last page that exists (page 1 has no ?pagina); how many
    // pages depends on the rows other test suites left in the local DB.
    await expect(page).toHaveURL(/\/c\/eletronicos(\?pagina=[1-9]\d?)?$/);
    await expect(
      page.getByText("0 produtos encontrados", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page
        .getByRole("list", { name: "Produtos" })
        .getByRole("listitem")
        .first(),
    ).toBeVisible();
  });

  test("ofertas: topo próprio e cards com desconto e preço riscado", async ({
    page,
  }) => {
    await page.goto("/busca?filtro=ofertas");
    await expect(
      page.getByRole("heading", { level: 1, name: "Ofertas" }),
    ).toBeVisible();
    const card = page
      .getByRole("list", { name: "Produtos" })
      .getByRole("listitem")
      .first();
    // Seed has a product with a crossed-out price.
    await expect(card.getByText(/^-\d+%/)).toBeVisible();
    await expect(card.getByText("Preço anterior:")).toBeAttached();
  });

  test("ofertas: decoração clara nunca atrás do texto", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "desktop", "larguras ajustadas no teste");
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/busca?filtro=ofertas");
      const header = page
        .locator("header")
        .filter({ has: page.getByRole("heading", { name: "Ofertas" }) });
      // Real text lines (Range rects), not the paragraph boxes.
      const textos = await header
        .locator("h1 ~ p, h1, span.uppercase")
        .evaluateAll((els) =>
          els.flatMap((el) => {
            const range = document.createRange();
            range.selectNodeContents(el);
            return [...range.getClientRects()].map(
              (r) => r.toJSON() as DOMRect,
            );
          }),
        );
      // Light layers (white ring, yellow glow), grown by their 24 px blur.
      const camadas = await header
        .locator(":scope > div[aria-hidden='true']")
        .evaluateAll((els) =>
          els
            .filter((el) => getComputedStyle(el).display !== "none")
            .map((el) => {
              const r = el.getBoundingClientRect();
              return {
                left: r.left - 24,
                right: r.right + 24,
                top: r.top - 24,
                bottom: r.bottom + 24,
              };
            }),
        );
      // The art must not cover the text either (no blur there).
      const arte = await header.locator(":scope > svg").boundingBox();
      if (arte)
        camadas.push({
          left: arte.x,
          right: arte.x + arte.width,
          top: arte.y,
          bottom: arte.y + arte.height,
        });
      for (const t of textos)
        for (const c of camadas) {
          const cruza =
            t.left < c.right &&
            c.left < t.right &&
            t.top < c.bottom &&
            c.top < t.bottom;
          expect(cruza, `${width}px: camada clara atrás do texto`).toBe(false);
        }
    }
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
  test("aparece toda vez que abre o site e some sozinho", async ({ page }) => {
    const res = await page.goto("/");
    // Rendered on the server, so it covers the page from the first paint.
    expect(await res?.text()).toContain("Abertura da Busca Agora");
    const splash = page.getByRole("dialog", {
      name: "Abertura da Busca Agora",
    });
    // 1.5 s after hydration at most (with margin for the dev server).
    await expect(splash).toHaveCount(0, { timeout: 3_000 });

    // F5 opens the store again: the animation plays again (decision 11/10).
    await page.reload();
    await expect(splash).toHaveCount(1);
    await expect(splash).toHaveCount(0, { timeout: 3_000 });
  });

  test("Pular fecha na hora", async ({ page }) => {
    // Under parallel load the 1.5 s auto-close can beat the click. Pause the
    // CSS fade and drop the splash's auto-close timer (its delay counts from
    // the page load, so it can be 0 on a slow dev server: match the handler),
    // so this test checks the button and nothing else.
    await page.addInitScript(() => {
      const realSetTimeout = window.setTimeout.bind(window);
      window.setTimeout = ((
        handler: TimerHandler,
        delay?: number,
        ...args: unknown[]
      ) =>
        String(handler).includes("fecharSplash")
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
    const pular = page.getByRole("button", { name: "Pular" });
    // Focused on hydration: from here the button works.
    await expect(pular).toBeFocused({ timeout: 15_000 });
    const splash = page.getByRole("dialog", {
      name: "Abertura da Busca Agora",
    });
    await pular.click({ force: true, timeout: 1_000 });
    await expect(splash).toHaveCount(0, { timeout: 300 });
  });

  test("sem JavaScript a abertura some sozinha", async ({ browser }) => {
    // The CSS exit animation ends hidden: the page is never blocked.
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("http://localhost:3100/");
    await expect(
      page.getByRole("dialog", { name: "Abertura da Busca Agora" }),
    ).toBeHidden({ timeout: 3_000 });
    await context.close();
  });

  test("voltar para a home pelo menu não repete a abertura", async ({
    page,
  }) => {
    await page.goto("/");
    const splash = page.getByRole("dialog", {
      name: "Abertura da Busca Agora",
    });
    await expect(splash).toHaveCount(0, { timeout: 5_000 });

    await page.goto("/c/eletronicos");
    await page
      .getByRole("link", { name: /^Busca Agora, (página inicial|início)$/ })
      .locator("visible=true")
      .first()
      .click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /Buscou\?/ }),
    ).toBeVisible();
    await expect(splash).toHaveCount(0);
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
