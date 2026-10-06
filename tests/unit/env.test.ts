import { describe, expect, it } from "vitest";

import { createRequireEnv, EnvError, parseServerEnv } from "@/lib/env-schema";

// Fake values only. Never put real keys in tests.
const minimum = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://exemplo.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-falsa",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-falsa",
};

describe("parseServerEnv", () => {
  it("accepts the 4 required variables and applies defaults", () => {
    const env = parseServerEnv(minimum);
    expect(env.MELHORENVIO_ENV).toBe("sandbox");
    expect(env.NFE_ENV).toBe("homologacao");
    expect(env.NFE_ENABLED).toBe(false);
    expect(env.MP_ACCESS_TOKEN).toBeUndefined();
  });

  it("treats empty strings as missing", () => {
    const env = parseServerEnv({
      ...minimum,
      NFE_ENABLED: "",
      MP_ACCESS_TOKEN: "",
    });
    expect(env.NFE_ENABLED).toBe(false);
    expect(env.MP_ACCESS_TOKEN).toBeUndefined();
  });

  it("parses NFE_ENABLED=true", () => {
    expect(
      parseServerEnv({ ...minimum, NFE_ENABLED: "true" }).NFE_ENABLED,
    ).toBe(true);
  });

  it("lists every missing required variable by name, without values", () => {
    const secret = "valor-que-nao-pode-vazar";
    let message = "";
    try {
      parseServerEnv({ NEXT_PUBLIC_SUPABASE_ANON_KEY: secret });
    } catch (error) {
      expect(error).toBeInstanceOf(EnvError);
      message = (error as Error).message;
    }
    expect(message).toContain("NEXT_PUBLIC_SITE_URL");
    expect(message).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(message).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(message).not.toContain(secret);
  });

  it("rejects invalid enum values without echoing them", () => {
    expect(() =>
      parseServerEnv({ ...minimum, MELHORENVIO_ENV: "producao-errada" }),
    ).toThrow(/MELHORENVIO_ENV/);
    expect(() =>
      parseServerEnv({ ...minimum, MELHORENVIO_ENV: "producao-errada" }),
    ).not.toThrow(/producao-errada/);
  });
});

describe("SENTRY_DSN", () => {
  it("is optional", () => {
    expect(parseServerEnv(minimum).SENTRY_DSN).toBeUndefined();
  });

  it("must be a URL when set", () => {
    expect(() =>
      parseServerEnv({ ...minimum, SENTRY_DSN: "nao-e-url" }),
    ).toThrow(/SENTRY_DSN/);
    expect(
      parseServerEnv({
        ...minimum,
        SENTRY_DSN: "https://chave-falsa@o0.ingest.sentry.io/0",
      }).SENTRY_DSN,
    ).toBeDefined();
  });
});

describe("requireEnv", () => {
  it("returns the value when set", () => {
    const requireEnv = createRequireEnv(
      parseServerEnv({ ...minimum, MP_ACCESS_TOKEN: "token-falso" }),
    );
    expect(requireEnv("MP_ACCESS_TOKEN")).toBe("token-falso");
  });

  it("throws a clear error naming the missing variable", () => {
    const requireEnv = createRequireEnv(parseServerEnv(minimum));
    expect(() => requireEnv("RESEND_API_KEY")).toThrow(EnvError);
    expect(() => requireEnv("RESEND_API_KEY")).toThrow(/RESEND_API_KEY/);
  });
});
