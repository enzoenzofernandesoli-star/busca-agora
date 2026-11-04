import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Footer } from "@/components/loja/footer";
import { ProductCard } from "@/components/loja/product-card";
import { ProductPerks } from "@/components/loja/product-perks";
import { TopBar } from "@/components/loja/top-bar";
import AboutPage from "@/app/(loja)/sobre/page";
import { LOJA, PREFIXO_EXEMPLO, produtoVisivel } from "@/lib/config/empresa";
import { PROMESSAS, categoryBand, promessasDaLoja } from "@/lib/site";

const card = {
  href: "/p/fone",
  nome: "Fone",
  categoria: "eletronicos" as const,
  precoCents: 8990,
};

describe("flags da loja", () => {
  it("começa sem nota fiscal, sem domínio próprio", () => {
    expect(LOJA.emiteNotaFiscal).toBe(false);
    expect(LOJA.dominioProprio).toBeNull();
  });

  it("produtos exemplo aparecem só em desenvolvimento e teste", () => {
    // Vitest runs with NODE_ENV=test: samples on, as in local dev.
    expect(LOJA.mostrarProdutosExemplo).toBe(true);
    expect(produtoVisivel(`${PREFIXO_EXEMPLO}fone`)).toBe(true);
    LOJA.mostrarProdutosExemplo = false;
    try {
      expect(produtoVisivel(`${PREFIXO_EXEMPLO}fone`)).toBe(false);
      expect(produtoVisivel("fone-bluetooth")).toBe(true);
      expect(produtoVisivel("fone-exemplo-de-uso")).toBe(true);
    } finally {
      LOJA.mostrarProdutosExemplo = true;
    }
  });
});

describe("promessas", () => {
  it("só o que a operação cumpre hoje, sem nota fiscal", () => {
    expect(promessasDaLoja()).toEqual([...PROMESSAS]);
    expect(promessasDaLoja().join(" ")).not.toMatch(/nota fiscal/i);
    for (const band of Object.values(categoryBand)) {
      expect(band.join(" ")).not.toMatch(/nota fiscal/i);
    }
  });

  it("faixa do topo e vantagens do produto sem nota fiscal", () => {
    const html =
      renderToStaticMarkup(<TopBar />) +
      renderToStaticMarkup(<ProductPerks categoria="eletronicos" />);
    expect(html).not.toMatch(/nota fiscal/i);
    expect(html).toContain("Despacho em até 24 h");
  });
});

describe("rodapé", () => {
  it("não oferece boleto", async () => {
    const html = renderToStaticMarkup(await Footer());
    expect(html).not.toMatch(/boleto/i);
    expect(html).toContain("Pix");
  });
});

describe("preço de/por", () => {
  it("sem preço anterior: nada riscado e sem selo de desconto", () => {
    for (const precoDeCents of [undefined, null, 8990, 5000]) {
      const html = renderToStaticMarkup(
        <ProductCard {...card} precoDeCents={precoDeCents} />,
      );
      expect(html).not.toContain("line-through");
      expect(html).not.toContain("Preço anterior");
      expect(html).not.toContain("de desconto");
    }
  });

  it("com preço anterior maior: riscado e selo", () => {
    const html = renderToStaticMarkup(
      <ProductCard {...card} precoDeCents={10990} />,
    );
    expect(html).toContain("line-through");
    expect(html).toContain("-18%");
  });

  it("card diz só em até 12x, sem valor de parcela", () => {
    const html = renderToStaticMarkup(<ProductCard {...card} />);
    expect(html).toContain("em até 12x");
    expect(html).not.toMatch(/12x de R\$/);
  });
});

describe("/sobre", () => {
  it("conta a história nova, sem família", async () => {
    const html = renderToStaticMarkup(await AboutPage());
    expect(html).not.toMatch(/fam[ií]lia|\bpai\b|\bfilho/i);
    expect(html).toContain("Por que a gente existe");
    expect(html).toContain("O que você pode esperar da gente");
    expect(html).toContain("69.919.406/0001-79");
  });
});

vi.mock("server-only", () => ({}));
