import { beforeEach, describe, expect, it, vi } from "vitest";

import { PaymentProviderError } from "@/lib/payments/types";

// refundOrder with every boundary replaced: admin session, database RPCs,
// the provider and the reconciliation (Codex review 3, finding 1).
vi.mock("server-only", () => ({}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), updateTag: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth/session", () => ({
  requireAdmin: async () => ({ email: "admin@example.test" }),
}));
vi.mock("@/lib/jobs/run", () => ({ kickJobs: vi.fn() }));
vi.mock("@/lib/store-info", () => ({ STORE_INFO_TAG: "store-info" }));
vi.mock("@/lib/env-public", () => ({
  publicEnv: { NEXT_PUBLIC_SITE_URL: "https://busca-agora.vercel.app" },
}));

const state = vi.hoisted(() => ({
  rpcCalls: [] as string[],
  refund: (async () => {}) as () => Promise<void>,
  reconcile: (async () => null) as () => Promise<{
    resultado: string;
    statusProvedor: string;
  } | null>,
}));

vi.mock("@/lib/db/admin", () => ({
  createAdminClient: () => ({
    rpc: (name: string) => {
      state.rpcCalls.push(name);
      const result =
        name === "begin_refund"
          ? { data: { resultado: "ok", token: "tok" }, error: null }
          : { data: true, error: null };
      // Awaitable like a Supabase builder, with .single() for begin_refund.
      return Object.assign(Promise.resolve(result), {
        single: async () => result,
      });
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({
            data: { paid_payment_id: "123" },
            error: null,
          }),
        }),
      }),
      insert: async () => ({ error: null }),
    }),
  }),
}));
vi.mock("@/lib/payments", async () => {
  const types = await vi.importActual<typeof import("@/lib/payments/types")>(
    "@/lib/payments/types",
  );
  return {
    PaymentProviderError: types.PaymentProviderError,
    getPaymentProvider: () => ({ refund: () => state.refund() }),
  };
});
vi.mock("@/lib/payments/reconcile", () => ({
  reconcileSettlingPayment: () => state.reconcile(),
}));

import { refundOrder } from "@/lib/admin/actions";

function form() {
  const f = new FormData();
  f.set("orderId", "11111111-1111-4111-8111-111111111111");
  return f;
}

beforeEach(() => {
  state.rpcCalls = [];
});

describe("estorno no admin", () => {
  it("4xx com o pagamento já estornado no Mercado Pago: não libera o envio", async () => {
    state.refund = async () => {
      throw new PaymentProviderError("HTTP 400 4296 already refunded", true);
    };
    state.reconcile = async () => ({
      resultado: "refunded",
      statusProvedor: "refunded",
    });
    const r = await refundOrder(form());
    expect(r.ok).toBe(true);
    expect(state.rpcCalls).not.toContain("end_refund");
  });

  it("4xx e a consulta falha: continua bloqueado", async () => {
    state.refund = async () => {
      throw new PaymentProviderError("HTTP 400 2063", true);
    };
    state.reconcile = async () => {
      throw new Error("rede");
    };
    const r = await refundOrder(form());
    expect(r.ok).toBe(false);
    expect(state.rpcCalls).not.toContain("end_refund");
  });

  it("recusa clara e o pagamento confirmado como aprovado: libera", async () => {
    state.refund = async () => {
      throw new PaymentProviderError("HTTP 400", true);
    };
    state.reconcile = async () => ({
      resultado: "already_paid",
      statusProvedor: "approved",
    });
    const r = await refundOrder(form());
    expect(r.ok).toBe(false);
    expect(state.rpcCalls).toContain("end_refund");
  });

  it("timeout com o pagamento ainda aprovado: continua bloqueado", async () => {
    state.refund = async () => {
      throw new PaymentProviderError("timeout", false);
    };
    state.reconcile = async () => ({
      resultado: "already_paid",
      statusProvedor: "approved",
    });
    const r = await refundOrder(form());
    expect(r.ok).toBe(false);
    expect(state.rpcCalls).not.toContain("end_refund");
  });
});
