import "server-only";

import { env } from "@/lib/env";
import { fakeIntegrationsAllowed } from "@/lib/payments/policy";

import { fakeShipping } from "./fake";
import { createMelhorEnvio } from "./melhorenvio/client";
import type { ShippingProvider } from "./provider";

/** The carrier aggregator in use. One line to swap providers. */
export function shippingProvider(): ShippingProvider {
  // Fixed quotes only in development/tests without a token, never in production.
  if (
    env.PAYMENTS_FAKE &&
    !env.MELHORENVIO_TOKEN &&
    fakeIntegrationsAllowed()
  ) {
    return fakeShipping;
  }
  return createMelhorEnvio();
}

export type { ShippingProvider } from "./provider";
export type { QuoteResult, ShippingItem, ShippingOption } from "./types";
