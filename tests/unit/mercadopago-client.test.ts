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

describe("erros do Mercado Pago nunca carregam dados pessoais", () => {
  it("só o status e os códigos, sem o texto devolvido", async () => {
    const e = (await refundError(async () =>
      Response.json(
        {
          error: "bad_request",
          message: "payer cliente@example.test cpf 529.982.247-25 rua X 100",
          cause: [{ code: 4296, description: "cliente@example.test" }],
        },
        { status: 400 },
      ),
    )) as PaymentProviderError;
    expect(e.message).toContain("HTTP 400");
    expect(e.message).toContain("bad_request");
    expect(e.message).toContain("4296");
    expect(e.message).not.toMatch(/@|529.982|rua/i);
  });

  it("corpo que não é JSON vira só o status", async () => {
    const e = (await refundError(
      async () => new Response("erro de cliente@example.test", { status: 502 }),
    )) as PaymentProviderError;
    expect(e.message).toBe("mercadopago /v1/payments/123/refunds: HTTP 502");
  });
});

describe("códigos do Mercado Pago: só os conhecidos", () => {
  it("CPF ou e-mail no campo error ou no código da causa não passam", async () => {
    const e = (await refundError(async () =>
      Response.json(
        {
          error: "52998224725",
          cause: [
            { code: "52998224725" },
            { code: "maria@example.test" },
            { code: 2063 },
          ],
        },
        { status: 400 },
      ),
    )) as PaymentProviderError;
    expect(e.message).toBe(
      "mercadopago /v1/payments/123/refunds: HTTP 400 códigos 2063",
    );
  });
});
