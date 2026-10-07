import { describe, expect, it } from "vitest";
import {
  normalizeOrderNumber,
  trackingSchema,
} from "@/lib/orders/tracking-schema";
describe("tracking schema", () => {
  it.each(["BA-000123", "ba000123", "ba 123", "000123", "123", "#BA-000123"])(
    "normalizes %s",
    (value) => {
      expect(normalizeOrderNumber(value)).toBe("BA-000123");
    },
  );
  it.each(["", "BA", "AB123", "BA123x", "1234567890"])(
    "rejects %s without truncating",
    (value) => {
      expect(normalizeOrderNumber(value)).toBeNull();
    },
  );
  it("normalizes email", () => {
    expect(
      trackingSchema.parse({
        numero: "123",
        email: "  CLIENTE@EXAMPLE.TEST  ",
      }),
    ).toEqual({ numero: "BA-000123", email: "cliente@example.test" });
  });
  it("rejects email and order errors", () => {
    for (const value of [
      { numero: "abc", email: "x@example.test" },
      { numero: "123", email: "invalid" },
    ])
      expect(trackingSchema.safeParse(value).success).toBe(false);
  });
});

describe("order numbers past BA-999999", () => {
  it("keeps seven digits", () => {
    expect(normalizeOrderNumber("BA-1000000")).toBe("BA-1000000");
    expect(normalizeOrderNumber("1234567890")).toBeNull();
  });
});
