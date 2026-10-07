import type { QuoteResult, ShippingItem } from "./types";

// Our contract with any carrier aggregator (CLAUDE.md rule 9). The store
// only talks to this; swapping Melhor Envio means a new implementation.
// buyLabel/generateLabel/printLabel/track arrive in phase 6.
export interface ShippingProvider {
  quote(input: {
    cepOrigem: string;
    cepDestino: string;
    itens: ShippingItem[];
  }): Promise<QuoteResult>;
  buyLabel(orderId: string): Promise<never>;
  generateLabel(orderId: string): Promise<never>;
  printLabel(orderId: string): Promise<never>;
  track(orderId: string): Promise<never>;
}

export class NotImplementedError extends Error {
  constructor(what: string) {
    super(`${what}: chega na fase 6`);
    this.name = "NotImplementedError";
  }
}
