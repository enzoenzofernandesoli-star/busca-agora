import { describe, expect, it } from "vitest";
import {
  parseCartResponse,
  parseCheckoutResponse,
  parseGenerateResponse,
  parsePrintResponse,
  parseTrackingResponse,
  trackingToOrderStatus,
  meErrorMessage,
} from "@/lib/shipping/melhorenvio/label-schemas";
const id = "11111111-1111-4111-8111-111111111111";
describe("Melhor Envio label response contracts", () => {
  it("reads cart identity without extra customer fields", () => {
    expect(
      parseCartResponse({
        id,
        protocol: "ORD-TEST",
        status: "pending",
        from: { name: "Cliente Exemplo" },
      }),
    ).toEqual({ cartId: id, protocolo: "ORD-TEST", status: "pending" });
    expect(() => parseCartResponse({ status: "pending" })).toThrow(
      "Resposta de carrinho inválida",
    );
  });
  it("checks purchase.orders membership", () => {
    const json = {
      purchase: {
        id: "purchase-test",
        status: "paid",
        orders: [{ id, status: "released" }],
      },
    };
    expect(parseCheckoutResponse(json, id)).toEqual({
      compraId: "purchase-test",
      status: "paid",
    });
    expect(() => parseCheckoutResponse(json, "another")).toThrow(
      "Compra não incluiu a etiqueta",
    );
    expect(() => parseCheckoutResponse({ orders: [{ id }] }, id)).toThrow(
      "Resposta de compra inválida",
    );
  });
  it("reads indexed generation status without reflecting remote PII", () => {
    expect(
      parseGenerateResponse(
        { [id]: { status: true, message: "Envio gerado com sucesso" } },
        id,
      ).ok,
    ).toBe(true);
    const failed = parseGenerateResponse(
      { [id]: { status: false, message: "Erro: cliente@example.test" } },
      id,
    );
    expect(failed.ok).toBe(false);
    expect(failed.mensagem).not.toContain("cliente@example.test");
    expect(() => parseGenerateResponse({}, id)).toThrow("Geração não incluiu");
  });
  it("accepts HTTPS print links only", () => {
    expect(
      parsePrintResponse({
        url: "https://sandbox.melhorenvio.com.br/imprimir/test",
      }).url,
    ).toContain("https:");
    expect(() => parsePrintResponse({ url: "http://example.test" })).toThrow(
      "Link da etiqueta inválido",
    );
  });
  it.each([
    ["posted", "shipped"],
    ["delivered", "delivered"],
    ["canceled", "canceled"],
    ["pending", null],
  ])("maps %s", (status, want) => {
    const parsed = parseTrackingResponse({
      [id]: {
        id,
        status,
        tracking: "CARRIER123",
        melhorenvio_tracking: "ME123",
        posted_at: status === "posted" ? "2026-10-08 13:55:05" : null,
        delivered_at: null,
        canceled_at: null,
      },
    })[id]!;
    expect(parsed.rastreio).toBe("CARRIER123");
    expect(trackingToOrderStatus(parsed)).toBe(want);
  });
  it("falls back to ME tracking and prioritizes cancellation over old posting", () => {
    const t = parseTrackingResponse({
      [id]: {
        status: "canceled",
        tracking: null,
        melhorenvio_tracking: "ME123",
        posted_at: "2026-10-08 12:00:00",
        canceled_at: "2026-10-09 12:00:00",
      },
    })[id]!;
    expect(t.rastreio).toBe("ME123");
    expect(trackingToOrderStatus(t)).toBe("canceled");
    expect(
      trackingToOrderStatus({
        ...t,
        status: "pending",
        entregueEm: "2026-10-09 13:00:00",
      }),
    ).toBe("delivered");
  });
  it("rejects missing tracking status", () => {
    expect(() => parseTrackingResponse({ [id]: { tracking: null } })).toThrow(
      "Resposta de rastreio inválida",
    );
  });
  it("returns safe known errors", () => {
    expect(
      meErrorMessage(422, {
        message: "Saldo insuficiente, cliente@example.test",
      }),
    ).toBe("Saldo insuficiente na carteira do Melhor Envio");
    expect(meErrorMessage(403, { token: "secret" })).toBe(
      "Token do Melhor Envio sem permissão",
    );
    expect(
      meErrorMessage(422, { errors: { cep: ["CEP inválido: 00000-000"] } }),
    ).toBe("CEP inválido para a etiqueta");
    expect(
      meErrorMessage(500, { message: "secret cliente@example.test" }),
    ).toBe("Melhor Envio recusou (HTTP 500)");
  });
});
