import { describe, expect, it } from "vitest";
import { errorText, MAX_ATTEMPTS, nextRunAt } from "@/lib/jobs/backoff";
describe("job backoff", () => {
  const now = new Date("2026-10-07T12:00:00Z");
  it.each([
    [1, 1],
    [2, 5],
    [3, 15],
    [4, 60],
  ])("attempt %i waits %i minutes", (attempt, minutes) => {
    expect(nextRunAt(attempt, now)?.getTime()).toBe(
      now.getTime() + minutes * 60000,
    );
  });
  it("exhausts at five", () => {
    expect(MAX_ATTEMPTS).toBe(5);
    expect(nextRunAt(5, now)).toBeNull();
  });
  it.each([0, -1, 6, 1.5, NaN])("rejects %s", (attempt) => {
    expect(() => nextRunAt(attempt, now)).toThrow(RangeError);
  });
  it("redacts credentials before truncation", () => {
    for (const secret of [
      "Bearer abc123",
      "re_123abcdef",
      "123456789:" + "A".repeat(35),
      "B".repeat(40),
    ]) {
      const text = errorText("Falha: " + secret);
      expect(text).toContain("[oculto]");
      expect(text).not.toContain(secret);
    }
  });
  it("keeps regular messages and handles unknown values", () => {
    expect(errorText(new Error("Conexão indisponível"))).toBe(
      "Conexão indisponível",
    );
    expect(errorText({ token: "private" })).toBe("Erro desconhecido");
    expect(errorText("a\n\n b")).toBe("a b");
    expect(errorText("x ".repeat(600)).length).toBeLessThanOrEqual(500);
  });
});
