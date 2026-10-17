import "server-only";

import { requireEnv } from "@/lib/env";
import { publicEnv } from "@/lib/env-public";

import { PaymentProviderError, type PaymentProvider } from "../types";
import { buildPreferenceBody } from "./preference-body";
import {
  paymentResponse,
  preferenceResponse,
  refundResponse,
  toCents,
} from "./schemas";

const API = "https://api.mercadopago.com";

async function mp(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
) {
  const { idempotencyKey, ...rest } = init;
  const route = path.split("?")[0];
  let res: Response;
  let text: string;
  try {
    res = await fetch(`${API}${path}`, {
      ...rest,
      headers: {
        Authorization: `Bearer ${requireEnv("MP_ACCESS_TOKEN")}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
        ...rest.headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    text = await res.text();
  } catch (e) {
    // Timeout or connection lost: the request may have been processed.
    throw new PaymentProviderError(
      `mercadopago ${route}: ${e instanceof Error ? e.message : "falha de rede"}`,
      false,
    );
  }
  if (!res.ok) {
    // Status and Mercado Pago's message only: never the token or the body we sent.
    const definitive =
      res.status >= 400 &&
      res.status < 500 &&
      res.status !== 408 &&
      res.status !== 429;
    throw new PaymentProviderError(
      `mercadopago ${route}: HTTP ${res.status} ${text.slice(0, 300)}`,
      definitive,
    );
  }
  try {
    return text ? (JSON.parse(text) as unknown) : null;
  } catch {
    throw new PaymentProviderError(
      `mercadopago ${route}: resposta ilegível`,
      false,
    );
  }
}

function metodoFrom(
  paymentTypeId: string | null | undefined,
): "pix" | "card" | "boleto" {
  if (paymentTypeId === "bank_transfer") return "pix";
  if (paymentTypeId === "ticket") return "boleto";
  return "card";
}

/** Mercado Pago Checkout Pro, REST API called with fetch (no SDK). */
export const mercadoPagoProvider: PaymentProvider = {
  name: "mercadopago",

  async createCheckout(order) {
    const site = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
    const body = buildPreferenceBody(order, {
      siteUrl: site,
      webhookUrl: `${site}/api/webhooks/mercadopago`,
      expiresAt: order.expiresAt,
    });
    const json = await mp("/checkout/preferences", {
      method: "POST",
      body: JSON.stringify(body),
      idempotencyKey: `preference-${order.id}`,
    });
    const pref = preferenceResponse.parse(json);
    const sandbox = requireEnv("MP_ACCESS_TOKEN").startsWith("TEST-");
    const url = sandbox
      ? (pref.sandbox_init_point ?? pref.init_point)
      : pref.init_point;
    return { preferenceId: String(pref.id), url };
  },

  async getPayment(paymentId) {
    if (!/^\d+$/.test(paymentId))
      throw new Error("mercadopago: invalid payment id");
    const p = paymentResponse.parse(await mp(`/v1/payments/${paymentId}`));
    return {
      id: String(p.id),
      status: p.status,
      externalReference: p.external_reference ?? null,
      valorCents: toCents(p.transaction_amount),
      moeda: p.currency_id,
      metodo: metodoFrom(p.payment_type_id),
      parcelas: p.installments ?? 1,
      raw: p,
    };
  },

  async refund(paymentId) {
    if (!/^\d+$/.test(paymentId))
      throw new Error("mercadopago: invalid payment id");
    const json = await mp(`/v1/payments/${paymentId}/refunds`, {
      method: "POST",
      body: "{}",
      idempotencyKey: `refund-${paymentId}`,
    });
    // Accepted (2xx) but unexpected body: the refund may exist, not a refusal.
    if (!refundResponse.safeParse(json).success) {
      throw new PaymentProviderError(
        "mercadopago refund: resposta inesperada",
        false,
      );
    }
  },

  webhookSecret() {
    return requireEnv("MP_WEBHOOK_SECRET");
  },
};
