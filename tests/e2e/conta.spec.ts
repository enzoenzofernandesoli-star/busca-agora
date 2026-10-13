import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { createTestCustomer } from "./supabase";

async function login(page: Page, email: string, senha: string, volta = "") {
  await page.goto(
    `/entrar${volta ? `?volta=${encodeURIComponent(volta)}` : ""}`,
  );
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(senha);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  // The action answers with a redirect or an error; the first dev compile
  // of the destination page can take a while.
  await expect(page.getByRole("button", { name: "Aguarde..." })).toHaveCount(
    0,
    {
      timeout: 30_000,
    },
  );
}

test.describe("conta do cliente", () => {
  test("cadastro exige o aceite e entra na conta", async ({ page }) => {
    const email = `cadastro-${randomUUID().slice(0, 8)}@example.test`;
    await page.goto("/cadastro");
    await page.getByLabel("Nome completo").fill("Maria Teste");
    await page.getByLabel("E-mail").fill(email);
    await page.getByLabel("Senha", { exact: true }).fill("senha12345");
    await page.getByRole("button", { name: "Criar conta" }).click();

    // Without the checkbox: error, and what was typed stays in the form.
    await expect(page.getByText(/aceite os Termos de uso/)).toBeVisible();
    await expect(page.getByLabel("E-mail")).toHaveValue(email);

    await page.getByLabel("Senha", { exact: true }).fill("senha12345");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page).toHaveURL(/\/conta$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "Meus dados" }),
    ).toBeVisible();
    await expect(page.getByLabel("Nome completo")).toHaveValue("Maria Teste");
  });

  test("login, logout e volta para a página pedida", async ({ page }) => {
    const c = await createTestCustomer();

    await page.goto("/conta/enderecos");
    await expect(page).toHaveURL(/\/entrar\?volta=%2Fconta%2Fenderecos/);

    await login(page, c.email, "senha-errada1");
    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();

    await login(page, c.email, c.senha, "/conta/enderecos");
    await expect(page).toHaveURL(/\/conta\/enderecos$/);

    await page.getByRole("button", { name: "Sair" }).first().click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto("/conta");
    await expect(page).toHaveURL(/\/entrar/);
  });

  test("dados pessoais: CPF inválido é recusado, válido é salvo", async ({
    page,
  }) => {
    const c = await createTestCustomer();
    await login(page, c.email, c.senha);
    await expect(page).toHaveURL(/\/conta$/);

    await page.getByLabel("CPF").fill("111.111.111-11");
    await page.getByRole("button", { name: "Salvar dados" }).click();
    await expect(page.getByText("CPF inválido")).toBeVisible();

    // 529.982.247-25: public documentation example, not a real person.
    await page.getByLabel("CPF").fill("529.982.247-25");
    await page.getByRole("button", { name: "Salvar dados" }).click();
    await expect(page.getByText("Dados salvos.")).toBeVisible();
    await page.reload();
    await expect(page.getByLabel("CPF")).toHaveValue("529.982.247-25");
  });

  test("cadastra e edita endereço com CEP preenchendo sozinho", async ({
    page,
  }) => {
    // Never call ViaCEP from tests: answer the store's own CEP route.
    await page.route("**/api/cep/01001000", (route) =>
      route.fulfill({
        json: {
          endereco: {
            cep: "01001000",
            rua: "Praça da Sé",
            bairro: "Sé",
            cidade: "São Paulo",
            uf: "SP",
          },
        },
      }),
    );
    const c = await createTestCustomer();
    await login(page, c.email, c.senha, "/conta/enderecos");
    await expect(page.getByText("Onde seu pedido vai chegar?")).toBeVisible();

    await page.getByRole("button", { name: "Adicionar endereço" }).click();
    await page.getByRole("main").getByLabel("CEP").fill("01001000");
    await expect(page.getByLabel("Rua")).toHaveValue("Praça da Sé");
    await expect(page.getByLabel("Número")).toBeFocused();
    await page.getByLabel("Número").fill("100");
    await page.getByRole("button", { name: "Salvar endereço" }).click();

    await expect(page.getByText("Praça da Sé, 100")).toBeVisible();
    await expect(page.getByText("Principal")).toBeVisible();

    await page.getByRole("button", { name: "Editar" }).click();
    await page.getByLabel("Número").fill("200");
    await page.getByRole("button", { name: "Salvar endereço" }).click();
    await expect(page.getByText("Praça da Sé, 200")).toBeVisible();
  });

  test("cliente comum não entra no /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/entrar\?volta=%2Fadmin/);

    const c = await createTestCustomer();
    await login(page, c.email, c.senha);
    await expect(page).toHaveURL(/\/conta$/);
    const res = await page.goto("/admin");
    expect(res?.status()).toBe(404);
  });

  test("exclusão de conta pede confirmação e apaga o login", async ({
    page,
  }) => {
    const c = await createTestCustomer();
    await login(page, c.email, c.senha);
    await page.getByRole("button", { name: "Excluir minha conta" }).click();
    const dialog = page.getByRole("dialog");
    const confirmar = dialog.getByRole("button", { name: "Excluir conta" });
    await expect(confirmar).toBeDisabled();
    await dialog.getByLabel(/Digite EXCLUIR/).fill("EXCLUIR");
    await confirmar.click();
    await expect(page).toHaveURL(/\/\?conta=excluida/);

    await login(page, c.email, c.senha);
    await expect(page.getByText("E-mail ou senha incorretos.")).toBeVisible();
  });
});

test.describe("telas de entrada", () => {
  test("Google vem primeiro e o fundo vivo nunca fica atrás do texto branco", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "desktop", "larguras ajustadas no teste");
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const rota of ["/entrar", "/cadastro"])
      for (const width of [320, 390, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(rota);
        const google = page.getByRole("button", {
          name: "Continuar com Google",
        });
        const email = page.getByLabel("E-mail");
        const g = await google.boundingBox();
        const e = await email.boundingBox();
        expect(g && e && g.y < e.y, `${rota} ${width}px: Google primeiro`).toBe(
          true,
        );
        const section = page.locator("section").filter({ has: google });
        // White copy on the dark stage (left column on desktop, top on phones).
        const textos = await section
          .locator(":scope > div:not([aria-hidden]) >> nth=0")
          .locator("p, li")
          .evaluateAll((els) =>
            els
              .filter((el) => el.getClientRects().length > 0)
              .flatMap((el) => {
                const range = document.createRange();
                range.selectNodeContents(el);
                return [...range.getClientRects()].map(
                  (r) => r.toJSON() as DOMRect,
                );
              }),
          );
        expect(textos.length).toBeGreaterThan(0);
        // Bright layers: the magnifier and the coloured wave band.
        const camadas = await section
          .locator(".ba-auth-sweep, .ba-auth-wave")
          .evaluateAll((els) =>
            els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect),
          );
        for (const t of textos)
          for (const c of camadas)
            expect(
              t.left < c.right &&
                c.left < t.right &&
                t.top < c.bottom &&
                c.top < t.bottom,
              `${rota} ${width}px: decoração clara atrás do texto`,
            ).toBe(false);
      }
  });
});
