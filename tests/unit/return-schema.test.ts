import { describe, expect, it } from "vitest";
import { canRequestReturn, returnSchema } from "@/lib/orders/return-schema";
const delivered = new Date("2026-10-01T12:00:00Z");
describe("return requests", () => {
  it.each([
    [6 * 86400000, true],
    [7 * 86400000, true],
    [7 * 86400000 + 60000, false],
    [-1, false],
  ])("checks window %i", (elapsed, valid) => {
    expect(
      canRequestReturn(
        "delivered",
        delivered,
        new Date(delivered.getTime() + elapsed),
      ),
    ).toBe(valid);
  });
  it("rejects missing date, invalid date and shipped status", () => {
    expect(canRequestReturn("shipped", delivered, delivered)).toBe(false);
    expect(canRequestReturn("delivered", null, delivered)).toBe(false);
    expect(canRequestReturn("delivered", new Date(NaN), delivered)).toBe(false);
  });
  it("validates and trims", () => {
    expect(
      returnSchema.parse({
        numero: "BA-000123",
        tipo: "troca",
        motivo: "defeito",
        detalhe: "  Produto não funciona  ",
      }).detalhe,
    ).toBe("Produto não funciona");
  });
  it.each([
    { numero: "123" },
    { tipo: "outro" },
    { motivo: "invalid" },
    { detalhe: "curto" },
    { detalhe: "x".repeat(1001) },
  ])("rejects invalid field", (change) => {
    expect(
      returnSchema.safeParse({
        numero: "BA-000123",
        tipo: "troca",
        motivo: "defeito",
        detalhe: "Produto não funciona",
        ...change,
      }).success,
    ).toBe(false);
  });
});
