import { describe, expect, it } from "vitest";
import { cartFingerprint, toQuoteProducts } from "@/lib/shipping/package";
import type { ShippingItem } from "@/lib/shipping/types";

const item: ShippingItem = {
  variantId: "variant-a",
  quantidade: 2,
  pesoG: 300,
  alturaCm: 1,
  larguraCm: 5,
  comprimentoCm: 10,
  precoCents: 8990,
};

describe("quote products", () => {
  it("applies minimum dimensions and unit insurance", () => {
    expect(toQuoteProducts([item])).toEqual([
      {
        id: "variant-a",
        width: 11,
        height: 2,
        length: 16,
        weight: 0.3,
        insurance_value: 89.9,
        quantity: 2,
      },
    ]);
  });
  it("rounds dimensions and grams upward", () => {
    expect(
      toQuoteProducts([
        {
          ...item,
          alturaCm: 2.1,
          larguraCm: 11.1,
          comprimentoCm: 16.1,
          pesoG: 300.1,
        },
      ])[0],
    ).toMatchObject({ height: 3, width: 12, length: 17, weight: 0.301 });
  });
  it.each([
    [1, 0.001],
    [0.1, 0.001],
    [1000, 1],
  ])("converts %s grams", (pesoG, weight) => {
    expect(toQuoteProducts([{ ...item, pesoG }])[0]?.weight).toBe(weight);
  });
  it("rejects an empty cart", () => {
    expect(() => toQuoteProducts([])).toThrow(RangeError);
  });
  it.each([0, -1, 1.5, NaN, Infinity])("rejects quantity %s", (quantidade) => {
    expect(() => toQuoteProducts([{ ...item, quantidade }])).toThrow(
      RangeError,
    );
  });
  it.each(["pesoG", "alturaCm", "larguraCm", "comprimentoCm"] as const)(
    "rejects invalid %s",
    (field) => {
      for (const value of [0, -1, NaN, Infinity])
        expect(() => toQuoteProducts([{ ...item, [field]: value }])).toThrow(
          RangeError,
        );
    },
  );
  it("returns one product per item without mutating input", () => {
    const items = [item, { ...item, variantId: "variant-b" }];
    expect(toQuoteProducts(items)).toHaveLength(2);
    expect(items[0]).toEqual(item);
  });
});

describe("cart fingerprint", () => {
  it("is stable across input order and does not mutate", () => {
    const items = [
      { variantId: "b", quantidade: 2 },
      { variantId: "a", quantidade: 1 },
    ];
    expect(cartFingerprint(items)).toBe("a:1|b:2");
    expect(cartFingerprint([...items].reverse())).toBe(cartFingerprint(items));
    expect(items[0]?.variantId).toBe("b");
  });
  it("changes when quantity changes", () => {
    expect(cartFingerprint([{ variantId: "a", quantidade: 2 }])).not.toBe(
      cartFingerprint([{ variantId: "a", quantidade: 1 }]),
    );
  });
  it("supports an empty fingerprint", () => {
    expect(cartFingerprint([])).toBe("");
  });
});
