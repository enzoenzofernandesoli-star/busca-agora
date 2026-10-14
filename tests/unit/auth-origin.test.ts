import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("@/lib/env-public", () => ({
  publicEnv: { NEXT_PUBLIC_SITE_URL: "https://buscaagora.com.br" },
}));

import { pickOrigin } from "@/lib/auth/origin";

const allowed = ["https://buscaagora.com.br", "https://busca-agora.vercel.app"];
const fallback = "https://buscaagora.com.br";

describe("pickOrigin", () => {
  it("volta para o endereço da Vercel quando o cliente está nele", () => {
    expect(
      pickOrigin("busca-agora.vercel.app", "https", allowed, fallback),
    ).toBe("https://busca-agora.vercel.app");
  });

  it("aceita localhost em http", () => {
    expect(pickOrigin("localhost:3100", "http", allowed, fallback)).toBe(
      "http://localhost:3100",
    );
  });

  it("ignora host forjado e usa o endereço do site", () => {
    expect(pickOrigin("evil.example", "https", allowed, fallback)).toBe(
      fallback,
    );
    expect(
      pickOrigin(
        "busca-agora.vercel.app.evil.example",
        "https",
        allowed,
        fallback,
      ),
    ).toBe(fallback);
  });

  it("sem host usa o endereço do site", () => {
    expect(pickOrigin(null, null, allowed, fallback)).toBe(fallback);
  });

  it("http fora do localhost não passa", () => {
    expect(
      pickOrigin("busca-agora.vercel.app", "http", allowed, fallback),
    ).toBe(fallback);
  });
});
