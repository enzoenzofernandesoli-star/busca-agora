import { describe, expect, it } from "vitest";

import { loginHref, safeNext } from "@/lib/auth/redirect";
import {
  newPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/auth/schemas";

describe("safeNext", () => {
  it.each([
    ["/conta/enderecos", "/conta/enderecos"],
    ["/p/fone?x=1#y", "/p/fone?x=1#y"],
  ])("keeps internal path %s", (input, out) => {
    expect(safeNext(input)).toBe(out);
  });

  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "javascript:alert(1)",
    "evil.com",
    "/entrar",
    "/auth/callback?code=1",
    "/conta\r\nSet-Cookie: x",
    "",
    undefined,
    42,
  ])("rejects %s", (input) => {
    expect(safeNext(input)).toBe("/conta");
  });

  it("builds the login link", () => {
    expect(loginHref("/conta/enderecos")).toBe(
      "/entrar?volta=%2Fconta%2Fenderecos",
    );
  });
});

describe("auth schemas", () => {
  const ok = {
    nome: "Cliente Teste",
    email: "  Cliente@Example.TEST ",
    senha: "senha1234",
    aceite: "on",
  };

  it("normalizes the e-mail", () => {
    expect(signUpSchema.parse(ok).email).toBe("cliente@example.test");
  });

  it("requires accepting the terms", () => {
    const r = signUpSchema.safeParse({ ...ok, aceite: undefined });
    expect(r.success).toBe(false);
  });

  it.each(["curta1", "somenteletras", "12345678"])(
    "rejects weak password %s",
    (senha) => {
      expect(signUpSchema.safeParse({ ...ok, senha }).success).toBe(false);
    },
  );

  it("sign in needs e-mail and password", () => {
    expect(
      signInSchema.safeParse({ email: "a@b.test", senha: "" }).success,
    ).toBe(false);
  });

  it("new password must match the confirmation", () => {
    const r = newPasswordSchema.safeParse({
      senha: "nova12345",
      confirmacao: "outra12345",
    });
    expect(r.success).toBe(false);
  });
});
