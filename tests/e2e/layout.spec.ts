import { expect, test } from "@playwright/test";

test.describe("layout da loja", () => {
  test("home abre com logo, busca e dados legais", async ({ page }, info) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { level: 1, name: /Buscou\?/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: "Busca Agora" }).first(),
    ).toBeVisible();

    const busca = page.getByRole("combobox", { name: "Buscar na loja" });
    await expect(busca.locator("visible=true")).toHaveCount(1);

    const bottomNav = page.getByRole("navigation", {
      name: "Navegação principal",
    });

    if (info.project.name === "mobile") {
      await expect(bottomNav).toBeVisible();
      await expect(
        bottomNav.getByRole("link", { name: "Início" }),
      ).toHaveAttribute("aria-current", "page");
    } else {
      await expect(bottomNav).toBeHidden();
      await expect(page.getByTestId("dados-legais")).toContainText("CPF/CNPJ");
    }
  });

  test("título da Home cabe no cartão em 320 px", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "só celular");
    await page.setViewportSize({ width: 320, height: 844 });
    await page.goto("/");
    // The rotating word reserves the widest word's width: checking its box
    // covers every word of the cycle.
    const palavra = page.locator(".ba-rotating-word");
    const cartao = page
      .locator("h1")
      .locator("xpath=ancestor::div[contains(@class,'bg-noite')][1]");
    const p = await palavra.boundingBox();
    const c = await cartao.boundingBox();
    expect(p && c).toBeTruthy();
    if (p && c) expect(p.x + p.width).toBeLessThanOrEqual(c.x + c.width - 16);
  });

  test("busca digitando: só o campo visível digita, também ao trocar de tamanho", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "mobile", "começa no celular");
    test.setTimeout(60_000);
    await page.goto("/");
    const celular = page.locator("#busca-m");
    const computador = page.locator("#busca");
    const baseCelular = await celular.getAttribute("placeholder");
    const baseComputador = await computador.getAttribute("placeholder");
    // Phone field types after ~3 s; the hidden desktop field never does.
    await expect
      .poll(() => celular.getAttribute("placeholder"), { timeout: 15_000 })
      .toMatch(/^Busque /);
    expect(await computador.getAttribute("placeholder")).toBe(baseComputador);

    // Cross the md breakpoint: the phone field stops, the desktop one starts.
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(celular).toHaveAttribute("placeholder", baseCelular ?? "");
    await expect
      .poll(() => computador.getAttribute("placeholder"), { timeout: 15_000 })
      .toMatch(/^Busque /);
    expect(await celular.getAttribute("placeholder")).toBe(baseCelular);
  });

  test("trilha montada na primeira troca já mostra a palavra atual", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "desktop", "trilha só no computador");
    // The browser never gets idle: the trail mounts on the first word change.
    await page.addInitScript(() => {
      window.requestIdleCallback = (() =>
        0) as typeof window.requestIdleCallback;
    });
    await page.goto("/");
    await expect(page.locator("svg path[id^='ba-trilha-']")).toHaveCount(0);
    // First change: fone -> sérum (index 1).
    await expect(page.locator("#ba-trilha-1")).toBeAttached({
      timeout: 10_000,
    });
    await expect(page.locator("#ba-trilha-0")).toHaveCount(0);
  });

  test("barra de baixo sempre marca uma aba", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "barra só no celular");
    const casos: [string, string][] = [
      ["/c/eletronicos", "Início"],
      ["/busca?q=fone", "Início"],
      ["/termos", "Início"],
      ["/carrinho", "Carrinho"],
      ["/rastreio", "Pedidos"],
      ["/entrar", "Conta"],
    ];
    const nav = page.getByRole("navigation", { name: "Navegação principal" });
    for (const [rota, aba] of casos) {
      await page.goto(rota);
      await expect(nav.getByRole("link")).toHaveCount(4);
      await expect(nav.locator('[aria-current="page"]')).toHaveText(aba);
    }
  });

  test("busca envia o termo para /busca", async ({ page }) => {
    await page.goto("/");
    // The opening animation takes the focus on hydration: wait for it.
    await expect(page.locator(".ba-splash")).toHaveCount(0, {
      timeout: 10_000,
    });
    const busca = page
      .getByRole("combobox", { name: "Buscar na loja" })
      .locator("visible=true");
    await busca.fill("fone");
    await busca.press("Enter");
    await expect(page).toHaveURL(/\/busca\?q=fone/);
  });
});
