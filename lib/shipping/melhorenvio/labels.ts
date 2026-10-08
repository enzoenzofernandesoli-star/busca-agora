import "server-only";

import { z } from "zod";

import { env, requireEnv } from "@/lib/env";

import { BASE_URL } from "./client";
import {
  meErrorMessage,
  parseCartResponse,
  parseCheckoutResponse,
  parseGenerateResponse,
  parseTrackingResponse,
} from "./label-schemas";

// Melhor Envio label flow (docs.melhorenvio.com.br), checked against the
// sandbox on 08/10/2026:
//   POST /api/v2/me/cart               put the shipment in the cart
//   POST /api/v2/me/shipment/checkout  pay it with the wallet balance
//   POST /api/v2/me/shipment/generate  ask for the label (ASYNCHRONOUS:
//                                      "Envio encaminhado para geração")
//   GET  /api/v2/me/imprimir/pdf/{id}  ["<signed S3 link to the PDF>"],
//                                      404/422 E-PRT-0011 while generating
//   POST /api/v2/me/shipment/tracking  status and tracking code (also the
//                                      status source: GET /me/orders needs
//                                      an extra token scope)
// The /shipment/print link is an HTML page, not a PDF: not used.

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

export class LabelNotReadyError extends Error {
  constructor() {
    super("Etiqueta ainda em geração no Melhor Envio; a fila tenta de novo");
    this.name = "LabelNotReadyError";
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
      const info = parseTrackingResponse(
        await call("POST", "/api/v2/me/shipment/tracking", { orders: [id] }),
      );
      const t = info[id];
      if (!t) throw new Error("Melhor Envio não encontrou a etiqueta");
      return t.status;
    },

    /**
     * Pays with the wallet. A label already paid is not an error. The
     * documented example answers with an empty purchase.orders, so the
     * label's own status (released) is what proves the purchase.
     */
    async checkout(id: string): Promise<void> {
      try {
        const json = await call("POST", "/api/v2/me/shipment/checkout", {
          orders: [id],
        });
        try {
          parseCheckoutResponse(json, id);
        } catch {
          const now = await this.status(id);
          if (now !== "released" && now !== "generated" && now !== "posted") {
            throw new Error(
              `Compra da etiqueta não confirmada (status ${now})`,
            );
          }
        }
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

    async track(ids: string[]) {
      return parseTrackingResponse(
        await call("POST", "/api/v2/me/shipment/tracking", { orders: ids }),
      );
    },

    /**
     * The label PDF. Throws LabelNotReadyError while Melhor Envio is still
     * generating it (about a minute): the queue retries later.
     */
    async labelPdf(id: string): Promise<Uint8Array> {
      let links: unknown;
      try {
        links = await call(
          "GET",
          `/api/v2/me/imprimir/pdf/${encodeURIComponent(id)}`,
        );
      } catch (e) {
        if (
          e instanceof MelhorEnvioError &&
          (e.status === 404 ||
            (e.status === 422 && /E-PRT-0011/.test(JSON.stringify(e.body))))
        ) {
          throw new LabelNotReadyError();
        }
        throw e;
      }
      const url = z.array(z.url()).min(1).parse(links)[0]!;
      if (new URL(url).protocol !== "https:") {
        throw new Error("Link da etiqueta inválido");
      }
      const res = await fetchImpl(url, {
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
