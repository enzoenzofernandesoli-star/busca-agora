import { describe, expect, it } from "vitest";
import {
  quoteRequestSchema,
  quoteResponseSchema,
  reaisFromCents,
  toShippingOptions,
} from "@/lib/shipping/melhorenvio/schemas";

const service = {
  id: 1,
  name: "PAC",
  company: {
    id: 1,
    name: "Correios",
    picture: "https://example.test/correios.png",
  },
  price: "23.45",
  delivery_time: 6,
  delivery_range: { min: 5, max: 6 },
};

describe("Melhor Envio quote schemas", () => {
  it("maps documented fields and ignores unavailable services and extras", () => {
    const response = [
      service,
      {
        ...service,
        id: 2,
        name: "SEDEX",
        price: "32.40",
        delivery_time: 2,
        packages: [],
      },
      {
        id: 3,
        name: "Expresso",
        company: { id: 2, name: "Jadlog" },
        error: "Serviço indisponível",
      },
    ];
    expect(quoteResponseSchema.safeParse(response).success).toBe(true);
    expect(toShippingOptions(response)).toEqual([
      {
        servicoId: "1",
        servico: "PAC",
        transportadora: "Correios",
        precoCents: 2345,
        prazoDias: 6,
        prazoMin: 5,
        prazoMax: 6,
      },
      {
        servicoId: "2",
        servico: "SEDEX",
        transportadora: "Correios",
        precoCents: 3240,
        prazoDias: 2,
        prazoMin: 5,
        prazoMax: 6,
      },
    ]);
  });
  it.each([
    ["23.45", 2345],
    ["23", 2300],
    ["23.4", 2340],
    ["0", 0],
    ["0.05", 5],
  ])("converts %s without floating arithmetic", (price, expected) => {
    expect(toShippingOptions([{ ...service, price }])[0]?.precoCents).toBe(
      expected,
    );
  });
  it("prefers customized values", () => {
    expect(
      toShippingOptions([
        {
          ...service,
          custom_price: "19.99",
          custom_delivery_time: 4,
          custom_delivery_range: { min: 2, max: 4 },
        },
      ])[0],
    ).toMatchObject({
      precoCents: 1999,
      prazoDias: 4,
      prazoMin: 2,
      prazoMax: 4,
    });
  });
  it("falls back from null customized values", () => {
    expect(
      toShippingOptions([
        {
          ...service,
          custom_price: null,
          custom_delivery_time: null,
          custom_delivery_range: null,
        },
      ])[0]?.precoCents,
    ).toBe(2345);
  });
  it("sorts by price and then delivery time", () => {
    expect(
      toShippingOptions([
        { ...service, id: 1, price: "30" },
        { ...service, id: 2, price: "20", delivery_time: 6 },
        { ...service, id: 3, price: "20", delivery_time: 2 },
      ]).map((option) => option.servicoId),
    ).toEqual(["3", "2", "1"]);
  });
  it.each(["-1", "23,45", "NaN", "1.234", "", "900719925474099100"])(
    "drops invalid price %s",
    (price) => {
      expect(toShippingOptions([{ ...service, price }])).toEqual([]);
    },
  );
  it.each([null, {}, [{ id: "1" }], [{ ...service, delivery_time: -1 }]])(
    "rejects malformed responses",
    (response) => {
      expect(toShippingOptions(response)).toEqual([]);
    },
  );
  it("drops services missing price or deadline", () => {
    expect(
      toShippingOptions([{ id: 1, name: "PAC", company: service.company }]),
    ).toEqual([]);
  });
  it("validates the request body", () => {
    expect(
      quoteRequestSchema.safeParse({
        from: { postal_code: "01001000" },
        to: { postal_code: "96020360" },
        products: [
          {
            id: "example",
            width: 11,
            height: 2,
            length: 16,
            weight: 0.3,
            insurance_value: 89.9,
            quantity: 1,
          },
        ],
        options: { receipt: false, own_hand: false },
      }).success,
    ).toBe(true);
  });
  it("rejects invalid postal codes and empty products", () => {
    expect(
      quoteRequestSchema.safeParse({
        from: { postal_code: "invalid" },
        to: { postal_code: "01001000" },
        products: [],
      }).success,
    ).toBe(false);
  });
  it("converts insurance cents to the provider boundary", () => {
    expect(reaisFromCents(8990)).toBe(89.9);
    expect(reaisFromCents(5)).toBe(0.05);
  });
  it.each([-1, 89.9, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid insurance cents %s",
    (cents) => {
      expect(() => reaisFromCents(cents)).toThrow(TypeError);
    },
  );
});

describe("one malformed service does not hide the others", () => {
  it("keeps the valid options", () => {
    const options = toShippingOptions([
      { id: 9, name: "Estranho", price: 12, company: { id: 3, name: "X" } },
      {
        id: 1,
        name: "PAC",
        custom_price: "23.45",
        custom_delivery_time: 7,
        company: { id: 1, name: "Correios" },
      },
    ]);
    expect(options.map((o) => o.servico)).toEqual(["PAC"]);
  });
});
