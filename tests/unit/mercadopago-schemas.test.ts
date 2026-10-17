import { describe, expect, it } from "vitest";
import {
  paymentResponse,
  preferenceResponse,
  refundResponse,
  toCents,
  webhookBody,
} from "@/lib/payments/mercadopago/schemas";

// Projections of the public examples, with no customer data.
// https://www.mercadopago.com.br/developers/en/reference/online-payments/checkout-pro-preferences/create-preference/post
const preference = {
  id: "202809963-920c288b-4ebb-40be-966f-700250fa5370",
  init_point:
    "https://www.mercadopago.com/mla/checkout/start?pref_id=202809963-920c288b-4ebb-40be-966f-700250fa5370",
  sandbox_init_point:
    "https://sandbox.mercadopago.com/mla/checkout/pay?pref_id=202809963-920c288b-4ebb-40be-966f-700250fa5370",
};
// https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-preferences/get-payment/get
// The reference renders "24.50" as a string; this contract requires a JSON number.
const payment = {
  id: 1,
  status: "approved",
  status_detail: "accredited",
  external_reference: "MP0001",
  transaction_amount: 24.5,
  currency_id: "BRL",
  payment_method_id: "visa",
  payment_type_id: "credit_card",
  installments: 1,
  date_approved: "2017-08-31T11:26:38.000Z",
};

describe("Mercado Pago responses", () => {
  it("accepts the preference example and preserves extra fields", () => {
    expect(preferenceResponse.parse({ ...preference, metadata: {} })).toEqual({
      ...preference,
      metadata: {},
    });
  });
  it("rejects missing or unsafe checkout URLs", () => {
    expect(
      preferenceResponse.safeParse({
        ...preference,
        init_point: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    expect(preferenceResponse.safeParse({ id: "x" }).success).toBe(false);
  });
  it("parses payment, nullable references, and future statuses", () => {
    expect(paymentResponse.parse(payment)).toEqual(payment);
    expect(
      paymentResponse.parse({
        ...payment,
        status: "new_status",
        external_reference: null,
        date_approved: null,
      }).status,
    ).toBe("new_status");
  });
  it.each([
    { currency_id: "USD" },
    { transaction_amount: "24,50" },
    { transaction_amount: "abc" },
    { transaction_amount: -1 },
    { transaction_amount: Infinity },
    { id: Number.MAX_SAFE_INTEGER + 1 },
    { installments: 1.5 },
    { status: "" },
  ])("rejects malformed payment %j", (change) => {
    expect(paymentResponse.safeParse({ ...payment, ...change }).success).toBe(
      false,
    );
  });
  it("accepts the amount as a decimal string, as in one official example", () => {
    expect(
      paymentResponse.parse({ ...payment, transaction_amount: "24.50" })
        .transaction_amount,
    ).toBe(24.5);
  });
  it("requires all consumed payment fields", () => {
    for (const key of Object.keys(payment)) {
      const incomplete: Record<string, unknown> = { ...payment };
      delete incomplete[key];
      expect(paymentResponse.safeParse(incomplete).success, key).toBe(false);
    }
  });
  it("accepts the refund example", () => {
    // https://www.mercadopago.com.br/developers/en/reference/online-payments/checkout-api-payments/create-refund/post
    expect(
      refundResponse.parse({
        id: 1009042015,
        status: "approved",
        amount: 10,
        payment_id: 18552260055,
      }).amount,
    ).toBe(10);
    expect(
      refundResponse.safeParse({ id: 1, status: "approved", amount: -1 })
        .success,
    ).toBe(false);
  });
  it("normalizes notification IDs and accepts type or topic", () => {
    // https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/payment-notifications
    expect(
      webhookBody.parse({
        action: "payment.updated",
        api_version: "v1",
        data: { id: "123456" },
        date_created: "2021-11-01T02:02:02Z",
        id: "123456",
        live_mode: false,
        type: "payment",
        user_id: 724484980,
      }).data.id,
    ).toBe("123456");
    expect(
      webhookBody.parse({ topic: "payment", data: { id: 123456 } }).data.id,
    ).toBe("123456");
  });
  it.each([
    {},
    { type: "payment" },
    { data: { id: "1" } },
    { type: "payment", data: { id: " " } },
    { type: "payment", data: { id: 1.2 } },
  ])("rejects incomplete webhook %j", (body) => {
    expect(webhookBody.safeParse(body).success).toBe(false);
  });
});

describe("toCents", () => {
  it.each([
    [89.9, 8990],
    [0.1 + 0.2, 30],
    [0, 0],
    [0.01, 1],
    [1.005, 101],
    [10.075, 1008],
    [1.0049, 100],
    [0.005, 1],
    [1e-7, 0],
    [1e6, 100000000],
    [999999.99, 99999999],
  ])("converts %s to %s", (reais, cents) => expect(toCents(reais)).toBe(cents));
  it.each([NaN, Infinity, -Infinity, -0.01, 1e20, Number.MAX_VALUE])(
    "rejects unsafe amount %s",
    (value) => expect(() => toCents(value)).toThrow(RangeError),
  );
});
