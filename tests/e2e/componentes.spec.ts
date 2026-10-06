import { expect, test, type Locator } from "@playwright/test";

// Effective touch target: the element box or its ::before hit area, whichever is taller.
async function targetHeight(locator: Locator) {
  return locator.evaluate((el) => {
    const box = el.getBoundingClientRect().height;
    const before = parseFloat(getComputedStyle(el, "::before").height) || 0;
    return Math.max(box, before);
  });
}

test.describe("acessibilidade do layout", () => {
  test("todo alvo interativo visível tem pelo menos 44 px", async ({
    page,
  }) => {
    await page.goto("/dev/componentes");
    const targets = page.locator(
      "header a, header button, nav a, nav button, main a, main button",
    );
    const count = await targets.count();
    expect(count).toBeGreaterThan(10);

    for (let i = 0; i < count; i++) {
      const target = targets.nth(i);
      if (!(await target.isVisible())) continue;
      const label =
        (await target.getAttribute("aria-label")) ?? (await target.innerText());
      expect(
        await targetHeight(target),
        `alvo: ${label}`,
      ).toBeGreaterThanOrEqual(44);
    }
  });

  test("campo de busca mostra foco ao navegar por teclado", async ({
    page,
  }) => {
    await page.goto("/");
    const busca = page
      .getByRole("searchbox", { name: "Buscar na loja" })
      .locator("visible=true");
    const form = page.getByRole("search").locator("visible=true");

    await expect(form).toHaveCSS("outline-style", "none");

    // Tab from the top of the page until the search field gets focus.
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      if (await busca.evaluate((el) => el === document.activeElement)) break;
    }
    await expect(busca).toBeFocused();
    await expect(form).toHaveCSS("outline-style", "solid");
    await expect(form).toHaveCSS("outline-color", "rgb(198, 255, 61)");
  });
});

test.describe("vitrine de componentes", () => {
  test("mostra botões, preços em centavos e cards", async ({ page }) => {
    await page.goto("/dev/componentes");
    for (const name of ["Principal", "Lima", "Contorno"]) {
      await expect(page.getByRole("button", { name })).toBeVisible();
    }
    await expect(page.locator('[data-cents="8990"]').first()).toHaveText(
      /R\$\s89,90/,
    );
    await expect(
      page.getByRole("link", { name: /Fone Bluetooth/ }),
    ).toContainText("em até 12x no cartão");
  });
});

// The allowed Supabase host is covered by tests/unit/images.test.ts with a fake
// URL, so no real environment value shows up in test output or server logs.
test.describe("imagens de produto", () => {
  const imageUrl = (src: string) =>
    `/_next/image?url=${encodeURIComponent(src)}&w=256&q=75`;

  test("recusa foto de host fora da lista", async ({ request }) => {
    const response = await request.get(
      imageUrl("https://exemplo.invalid/foto.png"),
    );
    expect(response.status()).toBe(400);
    expect(await response.text()).toContain("parameter is not allowed");
  });
});
