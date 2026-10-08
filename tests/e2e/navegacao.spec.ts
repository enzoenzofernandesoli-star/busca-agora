import { expect, test } from "@playwright/test";

test.describe("trocar de página", () => {
  test.describe.configure({ timeout: 60_000 });
  test("a barra aparece no clique e some quando a página nova chega", async ({
    page,
  }) => {
    // Slow network for the next page (its prefetch too, which starts as soon
    // as the link is on screen), so the wait is visible.
    await page.route(
      (url) => url.pathname === "/trocas",
      async (route) => {
        await new Promise((r) => setTimeout(r, 5000));
        await route.continue();
      },
    );
    await page.goto("/sobre");
    // Desktop footer and mobile legal line both link here.
    const barra = page.getByTestId("barra-navegacao");
    await expect(barra).toHaveAttribute("data-fase", "parado");
    // Hydrated: before that a link is a plain page load (no bar, by design).
    await expect(barra).toHaveAttribute("data-pronto", "1", {
      timeout: 20_000,
    });

    await page
      .getByRole("contentinfo")
      .getByRole("link", { name: /^Trocas/ })
      .filter({ visible: true })
      .first()
      .click();
    await expect(barra).toHaveAttribute("data-fase", "carregando", {
      timeout: 1_000,
    });
    await expect(
      page.getByRole("heading", { level: 1, name: "Trocas e devoluções" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(barra).toHaveAttribute("data-fase", "parado", {
      timeout: 2_000,
    });
  });

  test("link para a mesma página (só #âncora) não mostra a barra", async ({
    page,
  }) => {
    await page.goto("/privacidade");
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent("ba:navegacao-inicio", {
          detail: `${location.pathname}#cookies`,
        }),
      );
    });
    await expect(page.getByTestId("barra-navegacao")).toHaveAttribute(
      "data-fase",
      "parado",
    );
  });
});

test("rota de saúde responde (usada para manter o servidor acordado)", async ({
  request,
}) => {
  const res = await request.get("/api/saude");
  expect(res.ok()).toBe(true);
  expect(await res.json()).toEqual({ ok: true });
});

test("redirecionado de volta para a mesma página, a barra termina", async ({
  page,
}) => {
  // Logged out on the login page of /conta/pedidos: clicking "Pedidos"
  // asks for /conta/pedidos and the server sends us right back here.
  await page.goto("/entrar?volta=%2Fconta%2Fpedidos");
  const barra = page.getByTestId("barra-navegacao");
  await expect(barra).toHaveAttribute("data-pronto", "1", { timeout: 20_000 });
  // Record every phase, to prove the bar did start.
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="barra-navegacao"]')!;
    const fases: string[] = [];
    (window as unknown as { fases: string[] }).fases = fases;
    new MutationObserver(() =>
      fases.push(el.getAttribute("data-fase") ?? ""),
    ).observe(el, { attributes: true, attributeFilter: ["data-fase"] });
  });
  await page
    .getByRole("link", { name: /pedidos/i })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/entrar\?volta=%2Fconta%2Fpedidos$/);
  await expect(barra).toHaveAttribute("data-fase", "parado", {
    timeout: 4_000,
  });
  const fases = await page.evaluate(
    () => (window as unknown as { fases: string[] }).fases,
  );
  expect(fases).toContain("carregando");
});
