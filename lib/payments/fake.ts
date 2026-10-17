import "server-only";

import { createAdminClient } from "@/lib/db/admin";
import { publicEnv } from "@/lib/env-public";

import type { PaymentProvider } from "./types";

/**
 * Fake Mercado Pago for development and e2e tests (never in production, see
 * lib/payments/index.ts). The "payment page" is /dev/pagamento-teste; it
 * sends a signed webhook to our real endpoint, so the whole path (signature,
 * webhook_logs, fetching the payment, record_payment) runs as in production.
 * Payment ids look like "fake-<status>-<order id>-<nonce>"; the amount is
 * the order's total unless the id says "fake-wrongamount-...".
 */
// Refunds asked in this process (development only).
const refunded = new Set<string>();

export const FAKE_WEBHOOK_SECRET = "fake-webhook-secret-dev-only";

export const fakeProvider: PaymentProvider = {
  name: "fake",

  async createCheckout(order) {
    const url = new URL("/dev/pagamento-teste", publicEnv.NEXT_PUBLIC_SITE_URL);
    url.searchParams.set("pedido", order.numero);
    url.searchParams.set("ref", order.id);
    url.searchParams.set("metodo", order.pagamento);
    return {
      preferenceId: `fake-pref-${order.id}`,
      url: url.pathname + url.search,
    };
  },

  async getPayment(paymentId) {
    const match =
      /^fake-(approved|pending|rejected|wrongamount|refunded)-([0-9a-f-]{36})-\w+$/.exec(
        paymentId,
      );
    if (!match) throw new Error(`fake payment: unknown id ${paymentId}`);
    const [, kind, orderId] = match;
    const { data, error } = await createAdminClient()
      .from("orders")
      .select("total_cents, payment_method")
      .eq("id", orderId!)
      .single();
    if (error) throw new Error(`fake payment: ${error.message}`);
    return {
      id: paymentId,
      status: refunded.has(paymentId)
        ? "refunded"
        : kind === "wrongamount"
          ? "approved"
          : kind!,
      externalReference: orderId!,
      valorCents:
        kind === "wrongamount" ? data.total_cents - 1 : data.total_cents,
      moeda: "BRL",
      metodo: data.payment_method,
      parcelas: 1,
      raw: { fake: true, kind },
    };
  },

  async refund(paymentId) {
    refunded.add(paymentId);
  },

  webhookSecret() {
    return FAKE_WEBHOOK_SECRET;
  },
};
