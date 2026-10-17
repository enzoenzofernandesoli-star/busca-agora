import "server-only";

import { NotImplementedError, type ShippingProvider } from "./provider";

/**
 * Fixed quotes for development and e2e tests without a Melhor Envio token
 * (PAYMENTS_FAKE=true, never in production; see lib/shipping/index.ts).
 */
export const fakeShipping: ShippingProvider = {
  async quote() {
    return {
      ok: true,
      opcoes: [
        {
          servicoId: "1",
          servico: "PAC",
          transportadora: "Correios",
          precoCents: 2345,
          prazoDias: 6,
        },
        {
          servicoId: "2",
          servico: "SEDEX",
          transportadora: "Correios",
          precoCents: 3990,
          prazoDias: 2,
        },
      ],
    };
  },
  async buyLabel(): Promise<never> {
    throw new NotImplementedError("fake buyLabel");
  },
  async generateLabel(): Promise<never> {
    throw new NotImplementedError("fake generateLabel");
  },
  async printLabel(): Promise<never> {
    throw new NotImplementedError("fake printLabel");
  },
  async track(): Promise<never> {
    throw new NotImplementedError("fake track");
  },
};
