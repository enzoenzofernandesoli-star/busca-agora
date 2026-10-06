import { describe, expect, it } from "vitest";
import { cpfSchema, formatCpf, isValidCpf, onlyDigits } from "@/lib/br/cpf";

describe("CPF", () => {
  it.each(["529.982.247-25", "111.444.777-35", "52998224725", "11144477735"])(
    "accepts documented example %s",
    (value) => {
      expect(isValidCpf(value)).toBe(true);
    },
  );
  it.each([
    "52998224724",
    "52998224715",
    "123",
    "529982247250",
    "",
    "52998224725abc",
    "abc",
    ...Array.from({ length: 10 }, (_, digit) => String(digit).repeat(11)),
  ])("rejects %s", (value) => {
    expect(isValidCpf(value)).toBe(false);
    expect(cpfSchema.safeParse(value).success).toBe(false);
  });
  it.each([
    ["", ""],
    ["123", "123"],
    ["1234", "123.4"],
    ["1234567", "123.456.7"],
    ["1234567890", "123.456.789-0"],
    ["12345678901", "123.456.789-01"],
    ["1234567890123", "123.456.789-01"],
  ])("formats %s", (value, expected) => {
    expect(formatCpf(value)).toBe(expected);
  });
  it("keeps only digits", () => {
    expect(onlyDigits("a12.3-4")).toBe("1234");
  });
  it("normalizes schema output", () => {
    expect(cpfSchema.parse("529.982.247-25")).toBe("52998224725");
  });
  it("reports the expected message", () => {
    const result = cpfSchema.safeParse("invalid");
    if (!result.success)
      expect(result.error.issues[0]?.message).toBe("CPF inválido");
  });
});
