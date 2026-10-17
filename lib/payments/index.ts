import "server-only";

import { env } from "@/lib/env";

import { fakeProvider } from "./fake";
import { mercadoPagoProvider } from "./mercadopago/client";
import type { PaymentProvider } from "./types";

export type { CheckoutRequest, PaymentInfo, PaymentProvider } from "./types";

/**
 * The payment provider for this deployment. The fake one only exists in
 * development and previews with PAYMENTS_FAKE=true; production always talks
 * to Mercado Pago, whatever the variable says.
 */
export function getPaymentProvider(): PaymentProvider {
  if (env.PAYMENTS_FAKE) {
    if (process.env.VERCEL_ENV === "production") {
      throw new Error(
        "PAYMENTS_FAKE=true não é permitido em produção: remova a variável na Vercel.",
      );
    }
    return fakeProvider;
  }
  return mercadoPagoProvider;
}
