import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: { SUPABASE_SERVICE_ROLE_KEY: "chave-de-teste-nao-real" },
}));

const { trackingToken, verifyTrackingToken } =
  await import("@/lib/orders/tracking-token");

describe("tracking token", () => {
  const agora = Date.UTC(2026, 9, 8, 12);

  it("opens the order it was issued for, within the hour", () => {
    const t = trackingToken("BA-000123", agora);
    expect(verifyTrackingToken("BA-000123", t, agora + 59 * 60_000)).toBe(true);
  });

  it("expires after one hour", () => {
    const t = trackingToken("BA-000123", agora);
    expect(verifyTrackingToken("BA-000123", t, agora + 61 * 60_000)).toBe(
      false,
    );
  });

  it("does not open another order", () => {
    const t = trackingToken("BA-000123", agora);
    expect(verifyTrackingToken("BA-000124", t, agora)).toBe(false);
  });

  it("rejects a forged expiry or signature", () => {
    const [exp, sig] = trackingToken("BA-000123", agora).split(".");
    const later = String(Number(exp) + 86_400);
    expect(verifyTrackingToken("BA-000123", `${later}.${sig}`, agora)).toBe(
      false,
    );
    expect(verifyTrackingToken("BA-000123", `${exp}.x${sig}`, agora)).toBe(
      false,
    );
    expect(verifyTrackingToken("BA-000123", undefined, agora)).toBe(false);
    expect(verifyTrackingToken("BA-000123", "lixo", agora)).toBe(false);
  });
});
