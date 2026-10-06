import { describe, expect, it } from "vitest";

import { formatBRL } from "@/lib/format";

// Intl uses a no-break space between "R$" and the number.
const normalize = (s: string) => s.replace(/ /g, " ");

describe("formatBRL", () => {
  it("formats integer cents as BRL", () => {
    expect(normalize(formatBRL(8990))).toBe("R$ 89,90");
    expect(normalize(formatBRL(0))).toBe("R$ 0,00");
    expect(normalize(formatBRL(5))).toBe("R$ 0,05");
    expect(normalize(formatBRL(123456789))).toBe("R$ 1.234.567,89");
  });

  it("rejects non-integer amounts (money is never float)", () => {
    expect(() => formatBRL(89.9)).toThrow(TypeError);
    expect(() => formatBRL(Number.NaN)).toThrow(TypeError);
  });
});
