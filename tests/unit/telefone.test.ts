import { describe, expect, it } from "vitest";
import { formatTelefone, telefoneSchema } from "@/lib/br/telefone";

describe("telephone", () => {
  it.each([
    ["", ""],
    ["1", "(1"],
    ["11", "(11"],
    ["113", "(11) 3"],
    ["113333", "(11) 3333"],
    ["1133334", "(11) 3333-4"],
    ["1133334444", "(11) 3333-4444"],
    ["11988887777", "(11) 98888-7777"],
    ["1198888777712", "(11) 98888-7777"],
  ])("formats %s", (value, expected) => {
    expect(formatTelefone(value)).toBe(expected);
  });
  it.each([
    ["(11) 3333-4444", "1133334444"],
    ["(11) 98888-7777", "11988887777"],
    ["9933334444", "9933334444"],
  ])("normalizes %s", (value, expected) => {
    expect(telefoneSchema.parse(value)).toBe(expected);
  });
  it.each([
    "1033334444",
    "0033334444",
    "11888887777",
    "123",
    "119888877771",
    "11988887777abc",
    "",
  ])("rejects %s", (value) => {
    const result = telefoneSchema.safeParse(value);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0]?.message).toBe("Telefone inválido");
  });
});
