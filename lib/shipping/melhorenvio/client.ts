import "server-only";

import { requireEnv, env } from "@/lib/env";

import { toQuoteProducts } from "../package";
import { NotImplementedError, type ShippingProvider } from "../provider";
import type { QuoteResult } from "../types";

import { toShippingOptions } from "./schemas";

// Melhor Envio, "Cálculo de fretes por produtos":
// POST {base}/api/v2/me/shipment/calculate
// https://docs.melhorenvio.com.br/reference/calculo-de-fretes-por-produtos
const BASE_URL = {
  sandbox: "https://sandbox.melhorenvio.com.br",
  production: "https://melhorenvio.com.br",
} as const;

const TIMEOUT_MS = 8000;

export function createMelhorEnvio(
  fetchImpl: typeof fetch = fetch,
): ShippingProvider {
  return {
    async quote({ cepOrigem, cepDestino, itens }): Promise<QuoteResult> {
      let token: string;
      try {
        token = requireEnv("MELHORENVIO_TOKEN");
      } catch {
        return { ok: false, motivo: "indisponivel" };
      }

      let response: Response;
      try {
        response = await fetchImpl(
          `${BASE_URL[env.MELHORENVIO_ENV]}/api/v2/me/shipment/calculate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "Content-Type": "application/json",
              // Required by Melhor Envio: app name and a contact e-mail.
              "User-Agent": "Busca Agora (contato@buscaagora.com.br)",
            },
            body: JSON.stringify({
              from: { postal_code: cepOrigem },
              to: { postal_code: cepDestino },
              products: toQuoteProducts(itens),
              options: { receipt: false, own_hand: false },
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
            cache: "no-store",
          },
        );
      } catch {
        return { ok: false, motivo: "indisponivel" };
      }

      // 422: the API refused the data (usually an unknown destination CEP).
      if (response.status === 422) return { ok: false, motivo: "cep_invalido" };
      if (!response.ok) return { ok: false, motivo: "indisponivel" };

      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return { ok: false, motivo: "indisponivel" };
      }
      const opcoes = toShippingOptions(body);
      return opcoes.length > 0
        ? { ok: true, opcoes }
        : { ok: false, motivo: "sem_servico" };
    },
    buyLabel: () => Promise.reject(new NotImplementedError("buyLabel")),
    generateLabel: () =>
      Promise.reject(new NotImplementedError("generateLabel")),
    printLabel: () => Promise.reject(new NotImplementedError("printLabel")),
    track: () => Promise.reject(new NotImplementedError("track")),
  };
}
