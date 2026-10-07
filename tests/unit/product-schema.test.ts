import { describe, expect, it } from "vitest";
import {
  parseProductForm,
  productSchema,
  slugify,
  variantSchema,
} from "@/lib/admin/product-schema";

const variant = {
  sku: "fone-preto",
  nome: "Preto",
  preco: "89,90",
  precoDe: "",
  custo: "",
  estoque: "15",
  pesoG: "300",
  alturaCm: "2,5",
  larguraCm: "11",
  comprimentoCm: "16",
  ean: "",
};
const product = {
  nome: "Fone Bluetooth",
  slug: "",
  descricao: "Descrição do produto",
  categoryId: "11111111-1111-4111-8111-111111111111",
  ncm: "8518.30.00",
  variantes: [variant],
};

describe("slugify", () => {
  it.each([
    ["Sérum Facial + Vitamina C!", "serum-facial-vitamina-c"],
    [" ÁÉÍÓÚ çã -- ", "aeiou-ca"],
    ["***", ""],
  ])("normalizes %s", (value, expected) => {
    expect(slugify(value)).toBe(expected);
  });
  it("caps length without a trailing dash", () => {
    const slug = slugify("a".repeat(79) + " bbbbb");
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});
describe("variant schema", () => {
  it.each([
    ["89,90", 8990],
    ["1.299,90", 129990],
  ])("converts price %s", (preco, expected) => {
    expect(variantSchema.parse({ ...variant, preco }).preco_cents).toBe(
      expected,
    );
  });
  it("maps all database fields and optional values", () => {
    expect(variantSchema.parse(variant)).toEqual({
      sku: "FONE-PRETO",
      nome: "Preto",
      preco_cents: 8990,
      preco_de_cents: null,
      custo_cents: null,
      estoque: 15,
      peso_g: 300,
      altura_cm: 2.5,
      largura_cm: 11,
      comprimento_cm: 16,
      ean: null,
    });
  });
  it.each(["80", "89,90"])("rejects reference price %s", (precoDe) => {
    expect(variantSchema.safeParse({ ...variant, precoDe }).success).toBe(
      false,
    );
  });
  it("accepts greater reference price and zero cost", () => {
    expect(
      variantSchema.parse({ ...variant, precoDe: "119,90", custo: "0" }),
    ).toMatchObject({ preco_de_cents: 11990, custo_cents: 0 });
  });
  it.each(["0", "-1", "foo", "1,234"])("rejects price %s", (preco) => {
    expect(variantSchema.safeParse({ ...variant, preco }).success).toBe(false);
  });
  it.each(["0", "200,1", "2,55", "Infinity"])(
    "rejects dimension %s",
    (alturaCm) => {
      expect(variantSchema.safeParse({ ...variant, alturaCm }).success).toBe(
        false,
      );
    },
  );
  it.each(["0", "30001", "1.5"])("rejects weight %s", (pesoG) => {
    expect(variantSchema.safeParse({ ...variant, pesoG }).success).toBe(false);
  });
  it("rejects invalid EAN and SKU", () => {
    expect(variantSchema.safeParse({ ...variant, ean: "123" }).success).toBe(
      false,
    );
    expect(
      variantSchema.safeParse({ ...variant, sku: "com espaço" }).success,
    ).toBe(false);
  });
});
describe("product schema", () => {
  it("normalizes NCM, generates slug and applies defaults", () => {
    expect(productSchema.parse(product)).toMatchObject({
      slug: "fone-bluetooth",
      ncm: "85183000",
      cfop: "5102",
      origem: 0,
      brand_id: null,
      ativo: false,
      destaque: false,
    });
  });
  it("maps checked checkboxes", () => {
    expect(
      productSchema.parse({ ...product, ativo: "on", destaque: "on" }),
    ).toMatchObject({ ativo: true, destaque: true });
  });
  it("rejects case-insensitive duplicate SKU", () => {
    const result = productSchema.safeParse({
      ...product,
      variantes: [variant, { ...variant, sku: "FONE-PRETO" }],
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(
        result.error.issues.some(
          (issue) => issue.message === "SKU repetido: FONE-PRETO",
        ),
      ).toBe(true);
  });
  it("requires at least one variant", () => {
    const result = productSchema.safeParse({ ...product, variantes: [] });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0]?.message).toBe(
        "Cadastre pelo menos uma variação",
      );
  });
  it("rejects invalid fiscal fields and origin", () => {
    for (const changes of [{ ncm: "abc" }, { cfop: "123" }, { origem: "9" }])
      expect(productSchema.safeParse({ ...product, ...changes }).success).toBe(
        false,
      );
  });
  it("parses FormData variants", () => {
    const data = new FormData();
    for (const [key, value] of Object.entries(product))
      data.set(
        key,
        key === "variantes" ? JSON.stringify(value) : String(value),
      );
    expect(parseProductForm(data).success).toBe(true);
    data.set("variantes", "{broken");
    const result = parseProductForm(data);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(
        result.error.issues.some(
          (issue) => issue.message === "Variações inválidas",
        ),
      ).toBe(true);
  });
});
