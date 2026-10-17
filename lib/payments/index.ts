import "server-only";

import { env } from "@/lib/env";

import { fakeProvider } from "./fake";
import { fakeIntegrationsAllowed } from "./policy";
import { mercadoPagoProvider } from "./mercadopago/client";
import type { PaymentProvider } from "./types";

export type { CheckoutRequest, PaymentInfo, PaymentProvider } from "./types";

/**
 * The payment provider for this deployment. The fake one only exists in
 * development, tests and Vercel previews with PAYMENTS_FAKE=true (see
 * policy.ts); anywhere else the variable is refused.
 */
export function getPaymentProvider(): PaymentProvider {
  if (env.PAYMENTS_FAKE) {
    if (!fakeIntegrationsAllowed()) {
      throw new Error(
        "PAYMENTS_FAKE=true não é permitido em produção: remova a variável na Vercel.",
      );
    }
    return fakeProvider;
  }
  return mercadoPagoProvider;
}
