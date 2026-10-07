import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

type Policy =
  | "network-only"
  | "network-first-offline"
  | "cache-first"
  | "stale-while-revalidate";
const { policyFor } = createRequire(import.meta.url)("../../public/sw.js") as {
  policyFor: (url: string, method: string, mode: string) => Policy;
};
const origin = "https://buscaagora.com.br";
describe("service worker privacy policy", () => {
  it.each([
    "/checkout",
    "/conta/pedidos/BA-000001",
    "/admin",
    "/api/frete",
    "/carrinho",
    "/rastreio/BA-000001?t=x",
    "/auth/callback",
    "/entrar",
    "/cadastro",
    "/recuperar-senha",
    "/redefinir-senha",
    "/aceite-termos",
    "/pedido/BA-000001",
  ])("never caches %s", (path) => {
    expect(policyFor(origin + path, "GET", "navigate")).toBe("network-only");
  });
  it("never caches mutations or external origins", () => {
    expect(policyFor(origin + "/", "POST", "navigate")).toBe("network-only");
    expect(
      policyFor(
        "https://project.supabase.co/storage/v1/object/public/a.png",
        "GET",
        "no-cors",
      ),
    ).toBe("network-only");
  });
  it.each([
    "/_next/static/chunks/a.js",
    "/brand/logo.svg",
    "/icons/icon-192.png",
    "/fonts/a.woff2",
  ])("caches static asset %s", (path) => {
    expect(policyFor(origin + path, "GET", "no-cors")).toBe("cache-first");
  });
  it("refreshes optimized images", () => {
    expect(
      policyFor(
        origin + "/_next/image?url=%2Fbrand%2Flogo.svg",
        "GET",
        "no-cors",
      ),
    ).toBe("stale-while-revalidate");
  });
  it.each(["/", "/p/fone"])(
    "falls back offline without caching page HTML: %s",
    (path) => {
      expect(policyFor(origin + path, "GET", "navigate")).toBe(
        "network-first-offline",
      );
      expect(policyFor(origin + path, "GET", "cors")).toBe("network-only");
    },
  );
  it("never caches RSC or optimized private resources", () => {
    expect(policyFor(origin + "/p/fone?_rsc=abc", "GET", "navigate")).toBe(
      "network-only",
    );
    expect(
      policyFor(origin + "/_next/image?url=%2Fapi%2Ffoto", "GET", "cors"),
    ).toBe("network-only");
  });
  it("rejects invalid URLs", () => {
    expect(policyFor("invalid", "GET", "navigate")).toBe("network-only");
  });
});
