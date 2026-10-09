import { describe, expect, it } from "vitest";
import { tempoRelativo } from "@/components/admin/recent-orders";

describe("tempoRelativo", () => {
  const now = "2026-10-08T17:00:00Z";
  it("shows agora below a minute", () => {
    expect(tempoRelativo("2026-10-08T16:59:30Z", now)).toBe("agora");
  });
  it("shows minutes", () => {
    expect(tempoRelativo("2026-10-08T16:55:00Z", now)).toBe("há 5 min");
  });
  it("shows hours", () => {
    expect(tempoRelativo("2026-10-08T15:00:00Z", now)).toBe("há 2 h");
  });
  it("shows ontem based on São Paulo calendar", () => {
    expect(tempoRelativo("2026-10-07T20:00:00Z", now)).toBe("ontem");
    expect(tempoRelativo("2026-10-08T02:00:00Z", "2026-10-08T04:00:00Z")).toBe(
      "ontem",
    );
  });
  it("formats older dates", () => {
    expect(tempoRelativo("2026-10-01T20:00:00Z", now)).toBe("01/10");
  });
  it("keeps recent cross-midnight events in minutes", () => {
    expect(tempoRelativo("2026-10-08T02:58:00Z", "2026-10-08T03:03:00Z")).toBe(
      "há 5 min",
    );
  });
  it("handles invalid and future dates", () => {
    expect(tempoRelativo("invalid", now)).toBe("Data indisponível");
    expect(tempoRelativo("2026-10-08T17:05:00Z", now)).toBe("agora");
  });
});
