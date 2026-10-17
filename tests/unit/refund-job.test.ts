import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const row = vi.hoisted(() => ({
  value: {
    status: "paid",
    estorno_status: "solicitado" as string | null,
    estorno_token: "tok",
  },
}));
vi.mock("@/lib/db/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: row.value, error: null }) }),
      }),
    }),
  }),
}));
vi.mock("@/lib/payments/reconcile", () => ({
  reconcileSettlingPayment: vi.fn(),
}));

import { refundHandler } from "@/lib/jobs/refund";
import type { Job } from "@/lib/jobs/worker";

const job = { order_id: "o1", etapa: "tok" } as unknown as Job;

describe("job de conferência do estorno", () => {
  it("termina quando o Mercado Pago confirma", async () => {
    const h = refundHandler(async () => ({
      resultado: "refunded",
      statusProvedor: "refunded",
    }));
    await expect(h(job)).resolves.toBeUndefined();
  });

  it("tenta de novo (lança) enquanto não confirma, sem liberar nada", async () => {
    const h = refundHandler(async () => ({
      resultado: "already_paid",
      statusProvedor: "approved",
    }));
    await expect(h(job)).rejects.toThrow(/não confirmado/);
  });

  it("estorno já resolvido ou de outro token não faz nada", async () => {
    const reconcile = vi.fn();
    row.value = { status: "paid", estorno_status: null, estorno_token: "tok" };
    await expect(refundHandler(reconcile)(job)).resolves.toBe(
      "Estorno já resolvido",
    );
    row.value = {
      status: "paid",
      estorno_status: "solicitado",
      estorno_token: "outro",
    };
    await expect(refundHandler(reconcile)(job)).resolves.toBe(
      "Estorno já resolvido",
    );
    expect(reconcile).not.toHaveBeenCalled();
  });
});
