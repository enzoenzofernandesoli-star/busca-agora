import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  requireEnv: () => "TEST-token",
}));
vi.mock("@/lib/env-public", () => ({
  publicEnv: { NEXT_PUBLIC_SITE_URL: "https://busca-agora.vercel.app" },
}));

import { mercadoPagoProvider } from "@/lib/payments/mercadopago/client";
import { PaymentProviderError } from "@/lib/payments/types";

afterEach(() => vi.unstubAllGlobals());

async function refundError(fetchImpl: typeof fetch) {
  vi.stubGlobal("fetch", fetchImpl);
  try {
    await mercadoPagoProvider.refund("123");
  } catch (e) {
    return e;
  }
  return null;
}

describe("estorno no Mercado Pago: recusa certa x resultado incerto", () => {
  it("4xx é recusa definitiva", async () => {
    const e = await refundError(
      async () => new Response("{}", { status: 400 }),
    );
    expect(e).toBeInstanceOf(PaymentProviderError);
    expect((e as PaymentProviderError).definitive).toBe(true);
  });

  it.each([500, 503, 408, 429])("HTTP %i é incerto", async (status) => {
    const e = await refundError(async () => new Response("{}", { status }));
    expect((e as PaymentProviderError).definitive).toBe(false);
  });

  it("timeout ou rede caída é incerto", async () => {
    const e = await refundError(async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    });
    expect(e).toBeInstanceOf(PaymentProviderError);
    expect((e as PaymentProviderError).definitive).toBe(false);
  });

  it("resposta 200 ilegível ou inesperada é incerta", async () => {
    const bad = await refundError(
      async () => new Response("<html>", { status: 200 }),
    );
    expect((bad as PaymentProviderError).definitive).toBe(false);
    const odd = await refundError(async () =>
      Response.json({ algo: true }, { status: 201 }),
    );
    expect((odd as PaymentProviderError).definitive).toBe(false);
  });

  it("estorno aceito não lança", async () => {
    const e = await refundError(async () =>
      Response.json({ id: 1, status: "approved", amount: 10 }, { status: 201 }),
    );
    expect(e).toBeNull();
  });
});
