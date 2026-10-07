import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_SITE_URL: "https://exemplo.test" },
  requireEnv: () => "nao-usado",
}));
const loadOrderNotice = vi.fn();
vi.mock("@/lib/orders/notice-data", async (orig) => ({
  ...(await orig<typeof import("@/lib/orders/notice-data")>()),
  loadOrderNotice: (id: string) => loadOrderNotice(id),
}));

const { emailHandler, EMAIL_OFF, EMAIL_STALE } =
  await import("@/lib/jobs/handlers");
import type { Job } from "@/lib/jobs/worker";

const criado = "2026-10-08T12:00:00.000Z";
const job: Job = {
  id: "j1",
  tipo: "email",
  etapa: "paid",
  order_id: "o1",
  status: "running",
  tentativas: 0,
  ultimo_erro: null,
  run_at: criado,
  created_at: criado,
  updated_at: criado,
};

describe("emailHandler", () => {
  it("does nothing while the Resend key is missing", async () => {
    const send = vi.fn();
    const h = emailHandler({ send }, () => false);
    expect(await h(job)).toBe(EMAIL_OFF);
    expect(send).not.toHaveBeenCalled();
  });

  it("never sends a notice older than 23 h (Resend keeps keys 24 h)", async () => {
    const send = vi.fn();
    const h = emailHandler(
      { send },
      () => true,
      () => new Date(Date.parse(criado) + 23 * 3_600_000 + 1),
    );
    expect(await h(job)).toBe(EMAIL_STALE);
    expect(send).not.toHaveBeenCalled();
    expect(loadOrderNotice).not.toHaveBeenCalled();
  });
});
