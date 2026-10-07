import { describe, expect, it } from "vitest";

import { firstNameFromCookies } from "@/lib/auth/session-cookie";

function encode(session: unknown): string {
  return "base64-" + Buffer.from(JSON.stringify(session)).toString("base64url");
}

const session = {
  access_token: "x",
  user: { user_metadata: { nome: "Maria da Silva" } },
};

describe("firstNameFromCookies", () => {
  it("reads the first name from a single cookie", () => {
    expect(
      firstNameFromCookies(`ba_visto=1; sb-abc-auth-token=${encode(session)}`),
    ).toBe("Maria");
  });

  it("joins chunks in order", () => {
    const v = encode(session);
    const mid = Math.floor(v.length / 2);
    expect(
      firstNameFromCookies(
        `sb-abc-auth-token.1=${v.slice(mid)}; sb-abc-auth-token.0=${v.slice(0, mid)}`,
      ),
    ).toBe("Maria");
  });

  it("keeps accents (UTF-8)", () => {
    const s = { user: { user_metadata: { full_name: "Ênio Gonçalves" } } };
    expect(firstNameFromCookies(`sb-x-auth-token=${encode(s)}`)).toBe("Ênio");
  });

  it("falls back to 'cliente' without a name, null without a session", () => {
    expect(
      firstNameFromCookies(`sb-x-auth-token=${encode({ user: {} })}`),
    ).toBe("cliente");
    expect(firstNameFromCookies("ba_visto=1")).toBeNull();
    expect(firstNameFromCookies("")).toBeNull();
    expect(firstNameFromCookies("sb-x-auth-token=base64-@@@")).toBeNull();
  });
});

describe("malformed cookies never throw", () => {
  it.each([
    "sb-abc-auth-token=%",
    "sb-abc-auth-token=%E0%A4%A",
    "sb-abc-auth-token=base64-%ZZ",
    "sb-abc-auth-token=null",
    "sb-abc-auth-token=123",
  ])("%s -> null", (header) => {
    expect(() => firstNameFromCookies(header)).not.toThrow();
    expect(firstNameFromCookies(header)).toBeNull();
  });
});
