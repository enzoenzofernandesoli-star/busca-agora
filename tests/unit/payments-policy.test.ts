import { describe, expect, it } from "vitest";

import { parseServerEnv } from "@/lib/env-schema";
import { fakeIntegrationsAllowed } from "@/lib/payments/policy";

const base = {
  NEXT_PUBLIC_SITE_URL: "https://busca-agora.vercel.app",
  NEXT_PUBLIC_SUPABASE_URL: "https://exemplo.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
};

describe("Mercado Pago simulado", () => {
  it("só em desenvolvimento, testes e prévia da Vercel", () => {
    expect(fakeIntegrationsAllowed({ NODE_ENV: "development" })).toBe(true);
    expect(fakeIntegrationsAllowed({ NODE_ENV: "test" })).toBe(true);
    expect(
      fakeIntegrationsAllowed({
        NODE_ENV: "production",
        VERCEL_ENV: "preview",
      }),
    ).toBe(true);
    expect(
      fakeIntegrationsAllowed({
        NODE_ENV: "production",
        VERCEL_ENV: "production",
      }),
    ).toBe(false);
    // next start outside Vercel: counts as production.
    expect(fakeIntegrationsAllowed({ NODE_ENV: "production" })).toBe(false);
  });

  it("o boot recusa PAYMENTS_FAKE fora desses ambientes", () => {
    expect(() =>
      parseServerEnv({
        ...base,
        NODE_ENV: "production",
        PAYMENTS_FAKE: "true",
      }),
    ).toThrow(/PAYMENTS_FAKE/);
    expect(() =>
      parseServerEnv({
        ...base,
        NODE_ENV: "production",
        VERCEL_ENV: "preview",
        PAYMENTS_FAKE: "true",
      }),
    ).not.toThrow();
    expect(() =>
      parseServerEnv({
        ...base,
        NODE_ENV: "production",
        PAYMENTS_FAKE: "false",
      }),
    ).not.toThrow();
  });
});
