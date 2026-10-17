import { beforeEach, describe, expect, it, vi } from "vitest";

// signUp with every boundary replaced (Codex review of #42, finding 1).
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ host: "localhost:3000" }),
}));
vi.mock("@/lib/env-public", () => ({
  publicEnv: { NEXT_PUBLIC_SITE_URL: "http://localhost:3000" },
}));
vi.mock("@/lib/auth/rate-limit", () => ({
  allowAttempt: async () => true,
  clientIp: async () => "127.0.0.1",
}));
vi.mock("@/lib/cart/server", () => ({ mergeGuestCart: vi.fn() }));

const state = vi.hoisted(() => ({
  user: null as null | { id: string; identities: unknown[] },
  rpc: vi.fn(async () => ({ error: null })),
  updates: 0,
}));
vi.mock("@/lib/db/server", () => ({
  createClient: async () => ({
    auth: {
      signUp: async () => ({
        data: { user: state.user, session: null },
        error: null,
      }),
    },
  }),
}));
vi.mock("@/lib/db/admin", () => ({
  createAdminClient: () => ({
    rpc: state.rpc,
    from: () => ({
      update: () => ({
        eq: async () => {
          state.updates++;
          return { error: null };
        },
      }),
    }),
  }),
}));

import { signUp } from "@/lib/auth/actions";

function form() {
  const f = new FormData();
  f.set("nome", "Maria Teste");
  f.set("email", "maria@example.test");
  f.set("senha", "senha12345");
  f.set("aceite", "on");
  f.set("marketing", "on");
  return f;
}

beforeEach(() => {
  state.rpc.mockClear();
  state.updates = 0;
});

describe("cadastro com aceite de ofertas", () => {
  it("conta nova grava os termos e o aceite", async () => {
    state.user = {
      id: "11111111-1111-4111-8111-111111111111",
      identities: [{}],
    };
    const r = await signUp({ ok: false }, form());
    expect(r.ok).toBe(true);
    expect(state.rpc).toHaveBeenCalledTimes(1);
    expect(state.updates).toBe(1);
  });

  it("e-mail que já tem conta recebe a mesma resposta e nada é gravado", async () => {
    state.user = { id: "22222222-2222-4222-8222-222222222222", identities: [] };
    const nova = await signUp({ ok: false }, form());
    expect(nova.ok).toBe(true);
    expect(nova.message).toMatch(/Enviamos um link/);
    expect(state.rpc).not.toHaveBeenCalled();
    expect(state.updates).toBe(0);
  });
});
