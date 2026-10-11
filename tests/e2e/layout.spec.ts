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
    const busca = page
      .getByRole("combobox", { name: "Buscar na loja" })
      .locator("visible=true");
    await busca.fill("fone");
    await busca.press("Enter");
    await expect(page).toHaveURL(/\/busca\?q=fone/);
  });
});
