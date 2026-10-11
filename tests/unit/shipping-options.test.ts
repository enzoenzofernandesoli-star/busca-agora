import { describe, expect, it } from "vitest";

import { pickOptions, withCarrierName } from "@/lib/shipping/options";
import type { ShippingOption } from "@/lib/shipping/types";

function option(
  servicoId: string,
  transportadora: string,
  servico: string,
  precoCents: number,
  prazoDias: number,
): ShippingOption {
  return { servicoId, transportadora, servico, precoCents, prazoDias };
}

describe("withCarrierName", () => {
  it("prefixes the carrier and drops the leading dot", () => {
    expect(
      withCarrierName(option("1", "Jadlog", ".Package", 100, 3)).servico,
    ).toBe("Jadlog · Package");
    expect(
      withCarrierName(option("2", "Correios", "PAC", 100, 3)).servico,
    ).toBe("Correios · PAC");
  });

  it("does not repeat a carrier already in the name", () => {
    expect(
      withCarrierName(option("3", "Loggi", "Loggi Ponto", 100, 3)).servico,
    ).toBe("Loggi Ponto");
  });
});

describe("pickOptions", () => {
  const all = [
    option("1", "J&T Express", "Standard", 1505, 2),
    option("2", "Buslog", "Express", 1514, 3),
    option("3", "Jadlog", ".Package Centralizado", 1515, 6),
    option("4", "Loggi", "Ponto", 1527, 5),
    option("5", "Jadlog", ".Com", 1646, 1),
    option("6", "Correios", "PAC", 2587, 5),
    option("7", "Correios", "SEDEX", 3500, 2),
  ];

  it("keeps cheapest, fastest, cheapest Correios and next cheapest, by price", () => {
    const picked = pickOptions(all);
    expect(picked.map((o) => o.servicoId)).toEqual(["1", "2", "5", "6"]);
    expect(picked[0]?.servico).toBe("J&T Express · Standard");
  });

  it("returns short lists unchanged in size", () => {
    expect(pickOptions(all.slice(0, 2))).toHaveLength(2);
    expect(pickOptions([])).toEqual([]);
  });
});
