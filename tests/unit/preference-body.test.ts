import { describe, expect, it } from "vitest";
import {
  buildPreferenceBody,
  type PreferenceOrder,
} from "@/lib/payments/mercadopago/preference-body";
import { toCents } from "@/lib/payments/mercadopago/schemas";

const order: PreferenceOrder = {
  id: "order-example",
  numero: "BA-000123",
  totalCents: 24970,
  freteCents: 1990,
  freteServico: "Correios PAC",
  pagamento: "pix",
  cliente: {
    nome: "Cliente Exemplo",
    email: "cliente@example.com",
    cpf: "12345678909",
  },
  itens: [
    {
      sku: "FONE-PRETO",
      nome: "Fone Bluetooth",
      quantidade: 2,
      precoCents: 8990,
    },
    { sku: "SERUM-30", nome: "Sérum 30 ml", quantidade: 1, precoCents: 5000 },
  ],
};
const opts = {
  siteUrl: "https://buscaagora.example/",
  webhookUrl: "https://buscaagora.example/api/webhooks/mercadopago",
  expiresAt: new Date("2026-10-17T16:30:00.000Z"),
};

describe("buildPreferenceBody", () => {
  it("builds exact item prices and a single shipping item", () => {
    const body = buildPreferenceBody(order, opts);
    const items = body.items as {
      id: string;
      title: string;
      quantity: number;
      unit_price: number;
      currency_id: string;
    }[];
    expect(items.map((i) => i.unit_price)).toEqual([89.9, 50, 19.9]);
    expect(items.every((i) => i.currency_id === "BRL")).toBe(true);
    expect(items[2]?.title).toBe("Frete · Correios PAC");
    expect(
      items.reduce(
        (sum, item) => sum + toCents(item.unit_price) * item.quantity,
        0,
      ),
    ).toBe(order.totalCents);
    expect(body).not.toHaveProperty("shipments");
  });
  it("sets reference, return URLs, webhook, expiration, and descriptor", () => {
    const body = buildPreferenceBody(order, opts);
    expect(body).toMatchObject({
      external_reference: order.id,
      back_urls: {
        success: "https://buscaagora.example/pedido/BA-000123/obrigado",
        pending: "https://buscaagora.example/pedido/BA-000123/obrigado",
        failure: "https://buscaagora.example/pedido/BA-000123/obrigado",
      },
      auto_return: "approved",
      notification_url: opts.webhookUrl,
      expires: true,
      expiration_date_to: opts.expiresAt.toISOString(),
      statement_descriptor: "BUSCAAGORA",
      payer: {
        name: "Cliente",
        surname: "Exemplo",
        email: "cliente@example.com",
        identification: { type: "CPF", number: "12345678909" },
      },
    });
  });
  it("blocks card, boleto, and credit line for Pix; preserves provider balance limitation", () => {
    const methods = buildPreferenceBody(order, opts).payment_methods as {
      excluded_payment_types: { id: string }[];
      installments: number;
    };
    expect(methods.excluded_payment_types.map((p) => p.id)).toEqual([
      "credit_card",
      "debit_card",
      "prepaid_card",
      "ticket",
      "atm",
      "digital_currency",
    ]);
    expect(methods.installments).toBe(1);
  });
  it("blocks Pix and boleto for credit cards and caps installments at 12", () => {
    const methods = buildPreferenceBody({ ...order, pagamento: "card" }, opts)
      .payment_methods as {
      excluded_payment_types: { id: string }[];
      excluded_payment_methods: { id: string }[];
      installments: number;
    };
    expect(methods.excluded_payment_types.map((p) => p.id)).toEqual([
      "bank_transfer",
      "debit_card",
      "prepaid_card",
      "ticket",
      "atm",
      "digital_currency",
    ]);
    expect(methods.excluded_payment_methods).toEqual([{ id: "pix" }]);
    expect(methods.installments).toBe(12);
  });
  it("omits a zero shipping charge", () => {
    expect(
      buildPreferenceBody({ ...order, freteCents: 0, totalCents: 22980 }, opts)
        .items,
    ).toHaveLength(2);
  });
  it("rejects a total mismatch", () =>
    expect(() =>
      buildPreferenceBody({ ...order, totalCents: 24971 }, opts),
    ).toThrow("must match totalCents"));
  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid money %s",
    (value) =>
      expect(() =>
        buildPreferenceBody({ ...order, freteCents: value }, opts),
      ).toThrow(),
  );
  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid quantity %s",
    (quantidade) =>
      expect(() =>
        buildPreferenceBody(
          { ...order, itens: [{ ...order.itens[0]!, quantidade }] },
          opts,
        ),
      ).toThrow(),
  );
  it("checks multiplication in integer arithmetic", () => {
    expect(() =>
      buildPreferenceBody(
        {
          ...order,
          totalCents: Number.MAX_SAFE_INTEGER,
          itens: [
            {
              ...order.itens[0]!,
              precoCents: Number.MAX_SAFE_INTEGER,
              quantidade: 2,
            },
          ],
        },
        opts,
      ),
    ).toThrow("must match totalCents");
  });
  it("rejects empty items and invalid dates or URLs", () => {
    expect(() => buildPreferenceBody({ ...order, itens: [] }, opts)).toThrow();
    expect(() =>
      buildPreferenceBody(order, { ...opts, expiresAt: new Date("invalid") }),
    ).toThrow();
    expect(() =>
      buildPreferenceBody(order, { ...opts, webhookUrl: "javascript:bad" }),
    ).toThrow();
  });
  it("escapes the order number as a path segment", () => {
    expect(
      buildPreferenceBody({ ...order, numero: "BA/123?x" }, opts).back_urls,
    ).toMatchObject({
      success: "https://buscaagora.example/pedido/BA%2F123%3Fx/obrigado",
    });
  });
  it("does not mutate input and is deterministic", () => {
    const before = structuredClone(order);
    expect(buildPreferenceBody(order, opts)).toEqual(
      buildPreferenceBody(order, opts),
    );
    expect(order).toEqual(before);
    expect(
      buildPreferenceBody(
        { ...order, cliente: { ...order.cliente, nome: "Exemplo" } },
        opts,
      ).payer,
    ).not.toHaveProperty("surname");
  });
});
