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
