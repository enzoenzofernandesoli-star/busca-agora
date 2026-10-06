import { describe, expect, it } from "vitest";

import {
  centsToReaisInput,
  filtersHref,
  parseFilters,
  reaisToCents,
} from "@/lib/catalog/filters";

describe("reaisToCents", () => {
  it.each([
    ["49", 4900],
    ["49,9", 4990],
    ["49,90", 4990],
    ["0,05", 5],
    ["1.299,90", 129990],
    ["R$ 89,90", 8990],
    ["49.90", 4990],
  ])("%s -> %i", (input, cents) => {
    expect(reaisToCents(input)).toBe(cents);
  });

  it.each(["", "abc", "-10", "49,999", "1e3", "12345678"])(
    "rejects %s",
    (input) => {
      expect(reaisToCents(input)).toBeUndefined();
    },
  );
});

describe("parseFilters", () => {
  it("defaults: newest first, page 1", () => {
    expect(parseFilters({})).toEqual({
      q: undefined,
      marca: undefined,
      minCents: undefined,
      maxCents: undefined,
      ordem: "novidades",
      pagina: 1,
      filtro: undefined,
    });
  });

  it("with a search term, relevance is the default sort", () => {
    expect(parseFilters({ q: "  fone   bluetooth " })).toMatchObject({
      q: "fone bluetooth",
      ordem: "relevancia",
    });
  });

  it("drops invalid values instead of failing", () => {
    expect(
      parseFilters({
        marca: "Marca Ruim!",
        min: "abc",
        ordem: "hack",
        pagina: "-3",
      }),
    ).toMatchObject({
      marca: undefined,
      minCents: undefined,
      ordem: "novidades",
      pagina: 1,
    });
  });

  it("caps the page and the search length", () => {
    const parsed = parseFilters({ pagina: "99999", q: "a".repeat(300) });
    expect(parsed.pagina).toBe(1);
    expect(parseFilters({ pagina: "9999" }).pagina).toBe(500);
    expect(parsed.q).toHaveLength(100);
  });

  it("swaps min and max when reversed", () => {
    expect(parseFilters({ min: "100", max: "50" })).toMatchObject({
      minCents: 5000,
      maxCents: 10000,
    });
  });

  it("uses the first value of repeated params", () => {
    expect(parseFilters({ q: ["fone", "caixa"] }).q).toBe("fone");
  });
});

it("accepts only known shelf filters", () => {
  expect(parseFilters({ filtro: "ofertas" }).filtro).toBe("ofertas");
  expect(parseFilters({ filtro: "tudo" }).filtro).toBeUndefined();
  expect(
    filtersHref("/busca", parseFilters({ filtro: "mais-buscados" }), {}),
  ).toBe("/busca?filtro=mais-buscados");
});

describe("filtersHref", () => {
  const base = parseFilters({ q: "fone", pagina: "3" });

  it("resets the page when a filter changes", () => {
    expect(filtersHref("/busca", base, { marca: "sonora", pagina: 1 })).toBe(
      "/busca?q=fone&marca=sonora",
    );
  });

  it("keeps prices in reais", () => {
    expect(
      filtersHref("/c/eletronicos", parseFilters({}), {
        minCents: 4990,
        maxCents: 10000,
      }),
    ).toBe("/c/eletronicos?min=49%2C90&max=100");
  });

  it("omits the default sort", () => {
    expect(
      filtersHref("/busca", base, { ordem: "relevancia", pagina: 1 }),
    ).toBe("/busca?q=fone");
  });

  it("centsToReaisInput", () => {
    expect(centsToReaisInput(4990)).toBe("49,90");
    expect(centsToReaisInput(5000)).toBe("50");
    expect(centsToReaisInput(5)).toBe("0,05");
  });
});
