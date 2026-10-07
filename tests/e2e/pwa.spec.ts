import { expect, test } from "@playwright/test";

test.describe("app instalável", () => {
  test("manifest com nome, cor, start_url e ícones que existem", async ({
    request,
  }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.ok()).toBe(true);
    const m = (await res.json()) as {
      name: string;
      start_url: string;
      theme_color: string;
      display: string;
      icons: { src: string; sizes: string; purpose?: string }[];
    };
    expect(m.name).toBe("Busca Agora");
    expect(m.theme_color.toLowerCase()).toBe("#3324f5");
    expect(m.start_url).toBe("/?origem=pwa");
    expect(m.display).toBe("standalone");
    for (const size of ["192x192", "512x512"]) {
      expect(
        m.icons.some((i) => i.sizes === size && i.purpose === "maskable"),
      ).toBe(true);
      expect(m.icons.some((i) => i.sizes === size && i.purpose === "any")).toBe(
        true,
      );
    }
    for (const icon of m.icons) {
      const img = await request.get(icon.src);
      expect(img.ok(), icon.src).toBe(true);
      expect(img.headers()["content-type"]).toContain("image/png");
    }
  });

  test("service worker servido sem cache e tudo que ele pré-carrega existe", async ({
    request,
  }) => {
    const sw = await request.get("/sw.js");
    expect(sw.ok()).toBe(true);
    expect(sw.headers()["cache-control"]).toContain("no-cache");
    expect(sw.headers()["content-type"]).toContain("javascript");
    const body = await sw.text();
    const lista = /addAll\(\[([\s\S]*?)\]\)/.exec(body)?.[1] ?? "";
    const urls = [...lista.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
    expect(urls.length).toBeGreaterThan(3);
    for (const url of urls) {
      expect((await request.get(url)).ok(), url).toBe(true);
    }
  });

  test("página offline com a marca", async ({ page }) => {
    await page.goto("/offline");
    await expect(
      page.getByRole("heading", { name: "Sem conexão" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Tentar de novo/ }),
    ).toHaveAttribute("href", "/");
  });
});

test.describe("páginas legais", () => {
  for (const [url, titulo] of [
    ["/termos", "Termos de uso"],
    ["/privacidade", "Política de privacidade"],
    ["/trocas", "Trocas e devoluções"],
    ["/sobre", "Sobre a Busca Agora"],
    ["/contato", "Fale com a gente"],
  ] as const) {
    test(`${url} abre com título e sem rolagem para o lado`, async ({
      page,
    }) => {
      const res = await page.goto(url);
      expect(res?.status()).toBe(200);
      await expect(
        page.getByRole("heading", { level: 1, name: titulo }),
      ).toBeVisible();
      const largura = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(largura).toBeLessThanOrEqual(0);
    });
  }

  test("rodapé e páginas legais mostram a identidade da loja", async ({
    page,
  }) => {
    await page.goto("/privacidade");
    await expect(page.getByText("Vendedor:")).toBeVisible();
    await expect(page.getByText("CPF/CNPJ:")).toBeVisible();
  });
});

test.describe("aviso de cookies", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("aparece na primeira visita e some de vez depois de Entendi", async ({
    page,
  }) => {
    await page.goto("/termos");
    const aviso = page.getByRole("region", { name: "Aviso de cookies" });
    await expect(aviso).toBeVisible();
    await aviso.getByRole("button", { name: "Entendi" }).click();
    await expect(aviso).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(aviso).toHaveCount(0);
  });
});
