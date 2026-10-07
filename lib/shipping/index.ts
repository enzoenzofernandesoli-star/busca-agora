import "server-only";

import { createMelhorEnvio } from "./melhorenvio/client";
import type { ShippingProvider } from "./provider";

/** The carrier aggregator in use. One line to swap providers. */
export function shippingProvider(): ShippingProvider {
  return createMelhorEnvio();
}

export type { ShippingProvider } from "./provider";
export type { QuoteResult, ShippingItem, ShippingOption } from "./types";
