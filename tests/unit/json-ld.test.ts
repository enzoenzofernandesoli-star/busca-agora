import { describe, expect, it } from "vitest";
import {
  breadcrumbJsonLd,
  jsonLdScript,
  productJsonLd,
} from "@/lib/seo/json-ld";
import type { ProductJsonLdInput } from "@/lib/seo/json-ld";

const input: ProductJsonLdInput = {
  siteUrl: "https://buscaagora.com.br",
  slug: "fone-bluetooth",
  nome: "Fone Bluetooth",
  descricao: "Fone sem fio.",
  imagens: [],
  sku: "DEV-001-PRETO",
  precoCents: 8990,
  emEstoque: true,
  categoria: "Eletrônicos",
};

describe("productJsonLd", () => {
  it.each([
    [8990, "89.90"],
    [5, "0.05"],
    [100000, "1000.00"],
  ])("formats %i cents", (precoCents, price) => {
    expect(productJsonLd({ ...input, precoCents }).offers).toMatchObject({
      "@type": "Offer",
      price,
    });
  });
  it("uses AggregateOffer for a price range", () => {
    expect(
      productJsonLd({ ...input, precoMaxCents: 11990 }).offers,
    ).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: "89.90",
      highPrice: "119.90",
    });
  });
  it("uses Offer for equal prices", () => {
    expect(
      productJsonLd({ ...input, precoMaxCents: 8990 }).offers["@type"],
    ).toBe("Offer");
  });
  it("marks unavailable products", () => {
    expect(
      productJsonLd({ ...input, emEstoque: false }).offers.availability,
    ).toBe("https://schema.org/OutOfStock");
  });
  it("omits missing brands", () => {
    expect(productJsonLd(input)).not.toHaveProperty("brand");
  });
  it("includes provided brands", () => {
    expect(productJsonLd({ ...input, marca: "Sonora" }).brand).toEqual({
      "@type": "Brand",
      name: "Sonora",
    });
  });
  it.each([89.9, -1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid cents %s",
    (precoCents) => {
      expect(() => productJsonLd({ ...input, precoCents })).toThrow(TypeError);
    },
  );
  it("validates maximum cents too", () => {
    expect(() => productJsonLd({ ...input, precoMaxCents: 89.9 })).toThrow(
      TypeError,
    );
  });
});

describe("jsonLdScript", () => {
  it("escapes closing script tags and preserves data", () => {
    const data = { name: "</script><script>alert(1)</script>" };
    const result = jsonLdScript(data);
    expect(result).not.toContain("<");
    expect(result).toContain("\\u003c/script>");
    expect(JSON.parse(result)).toEqual(data);
  });
});

describe("breadcrumbJsonLd", () => {
  it("uses consecutive positions and absolute URLs", () => {
    expect(
      breadcrumbJsonLd(input.siteUrl, [
        { nome: "Início", path: "/" },
        { nome: "Eletrônicos", path: "/c/eletronicos" },
      ]).itemListElement,
    ).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Início",
        item: "https://buscaagora.com.br/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Eletrônicos",
        item: "https://buscaagora.com.br/c/eletronicos",
      },
    ]);
  });
});
