import "server-only";

import { z } from "zod";

import { cepSchema } from "@/lib/br/cep";
import { createAdminClient } from "@/lib/db/admin";

import { shippingProvider } from "./index";
import { cartFingerprint } from "./package";
import type { QuoteResult, ShippingItem } from "./types";

export const quoteRequestBody = z.object({
  cep: z.string(),
  itens: z
    .array(
      z.object({
        variantId: z.uuid(),
        quantidade: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(30),
});

export type QuoteRequestBody = z.infer<typeof quoteRequestBody>;

// Short cache per CEP + items: the same visitor recalculating, or the cart
// page and the product page asking the same thing, cost one API call.
const TTL_MS = 10 * 60 * 1000;
const MAX_ENTRIES = 500;
const cache = new Map<string, { at: number; result: QuoteResult }>();

function fromCache(key: string): QuoteResult | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.result;
}

function toCache(key: string, result: QuoteResult) {
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), result });
}

async function originCep(): Promise<string | null> {
  const { data } = await createAdminClient()
    .from("settings")
    .select("endereco_origem")
    .eq("id", true)
    .maybeSingle();
  const raw =
    data?.endereco_origem &&
    typeof data.endereco_origem === "object" &&
    !Array.isArray(data.endereco_origem)
      ? data.endereco_origem.cep
      : undefined;
  const parsed = cepSchema.safeParse(typeof raw === "string" ? raw : "");
  return parsed.success ? parsed.data : null;
}

/**
 * Quote for a destination CEP. Weight, size and price come from the
 * database (CLAUDE.md rule 2): the browser only says which variants and
 * how many.
 */
export async function quoteShipping(
  body: QuoteRequestBody,
): Promise<QuoteResult> {
  const destino = cepSchema.safeParse(body.cep);
  if (!destino.success) return { ok: false, motivo: "cep_invalido" };

  const key = `${destino.data}#${cartFingerprint(body.itens)}`;
  const cached = fromCache(key);
  if (cached) return cached;

  const origem = await originCep();
  if (!origem) return { ok: false, motivo: "indisponivel" };

  const ids = [...new Set(body.itens.map((i) => i.variantId))];
  const { data: variants, error } = await createAdminClient()
    .from("product_variants")
    .select(
      "id, preco_cents, peso_g, altura_cm, largura_cm, comprimento_cm, products!inner(ativo)",
    )
    .in("id", ids)
    .eq("products.ativo", true);
  if (error) return { ok: false, motivo: "indisponivel" };

  const byId = new Map((variants ?? []).map((v) => [v.id, v]));
  const itens: ShippingItem[] = [];
  for (const item of body.itens) {
    const v = byId.get(item.variantId);
    if (!v) return { ok: false, motivo: "sem_servico" };
    itens.push({
      variantId: v.id,
      quantidade: item.quantidade,
      pesoG: v.peso_g,
      alturaCm: Number(v.altura_cm),
      larguraCm: Number(v.largura_cm),
      comprimentoCm: Number(v.comprimento_cm),
      precoCents: v.preco_cents,
    });
  }

  const result = await shippingProvider().quote({
    cepOrigem: origem,
    cepDestino: destino.data,
    itens,
  });
  // Outages are not cached: the next try may work.
  if (result.ok || result.motivo !== "indisponivel") toCache(key, result);
  return result;
}
