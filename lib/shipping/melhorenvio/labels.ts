import "server-only";

import { z } from "zod";

import { env, requireEnv } from "@/lib/env";

import { BASE_URL } from "./client";
import {
  meErrorMessage,
  parseCartResponse,
  parseCheckoutResponse,
  parseGenerateResponse,
  parsePrintResponse,
  parseTrackingResponse,
} from "./label-schemas";

// Melhor Envio label flow (docs.melhorenvio.com.br):
//   POST /api/v2/me/cart               put the shipment in the cart
//   POST /api/v2/me/shipment/checkout  pay it with the wallet balance
//   POST /api/v2/me/shipment/generate  generate the label
//   POST /api/v2/me/shipment/print     link to the printable label
//   POST /api/v2/me/shipment/tracking  status and tracking code
//   GET  /api/v2/me/orders/{id}        one label's current status

const TIMEOUT_MS = 20_000;

export class MelhorEnvioError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "MelhorEnvioError";
  }
}

export function createLabelClient(fetchImpl: typeof fetch = fetch) {
  const base = BASE_URL[env.MELHORENVIO_ENV];

  async function call(
    method: "GET" | "POST",
    path: string,
    body?: unknown,
  ): Promise<unknown> {
    const token = requireEnv("MELHORENVIO_TOKEN");
    const res = await fetchImpl(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": "Busca Agora (contato@buscaagora.com.br)",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    const json: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      throw new MelhorEnvioError(
        meErrorMessage(res.status, json),
        res.status,
        json,
      );
    }
    return json;
  }

  return {
    async addToCart(request: object) {
      return parseCartResponse(await call("POST", "/api/v2/me/cart", request));
    },

    /** Current status of one label ("pending" = in the cart, not paid). */
    async status(id: string): Promise<string> {
      const json = await call(
        "GET",
        `/api/v2/me/orders/${encodeURIComponent(id)}`,
      );
      return z.object({ status: z.string() }).parse(json).status;
    },

    /** Pays with the wallet. A label already paid is not an error. */
    async checkout(id: string): Promise<void> {
      try {
        const json = await call("POST", "/api/v2/me/shipment/checkout", {
          orders: [id],
        });
        parseCheckoutResponse(json, id);
      } catch (e) {
        if (
          e instanceof MelhorEnvioError &&
          e.status === 422 &&
          /já foram pagas/i.test(JSON.stringify(e.body))
        ) {
          return;
        }
        throw e;
      }
    },

    async generate(id: string): Promise<void> {
      const r = parseGenerateResponse(
        await call("POST", "/api/v2/me/shipment/generate", { orders: [id] }),
        id,
      );
      if (!r.ok) {
        throw new Error(
          `Melhor Envio não gerou a etiqueta: ${r.mensagem ?? "sem detalhe"}`,
        );
      }
    },

    async printUrl(id: string): Promise<string> {
      return parsePrintResponse(
        await call("POST", "/api/v2/me/shipment/print", {
          mode: "public",
          orders: [id],
        }),
      ).url;
    },

    async track(ids: string[]) {
      return parseTrackingResponse(
        await call("POST", "/api/v2/me/shipment/tracking", { orders: ids }),
      );
    },

    /** Downloads the label PDF from the public print link. */
    async downloadPdf(url: string): Promise<Uint8Array> {
      const res = await fetchImpl(url, {
        headers: { "User-Agent": "Busca Agora (contato@buscaagora.com.br)" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          `Não foi possível baixar a etiqueta (HTTP ${res.status})`,
        );
      }
      return new Uint8Array(await res.arrayBuffer());
    },
  };
}

export type LabelClient = ReturnType<typeof createLabelClient>;
