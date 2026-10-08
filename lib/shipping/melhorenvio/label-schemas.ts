import { z } from "zod";

const identifier = z.string().trim().min(1);
const nullableText = z.string().nullable().optional();
export const cartResponseSchema = z
  .object({ id: identifier, protocol: nullableText, status: identifier })
  .passthrough();
export const checkoutResponseSchema = z
  .object({
    purchase: z
      .object({
        id: identifier,
        status: identifier,
        orders: z.array(z.object({ id: identifier }).passthrough()),
      })
      .passthrough(),
  })
  .passthrough();
// The real answer (sandbox, 08/10/2026) also carries a top-level
// "generate_key" string next to the per-label objects, and says
// "Envio encaminhado para geração": generation is asynchronous.
export const generateResponseSchema = z.record(
  z.string(),
  z.union([
    z.object({ status: z.boolean(), message: nullableText }).passthrough(),
    z.string(),
  ]),
);
export const printResponseSchema = z
  .object({
    url: z.url().refine((value) => new URL(value).protocol === "https:"),
  })
  .passthrough();
export const trackingResponseSchema = z.record(
  z.string(),
  z
    .object({
      status: identifier,
      tracking: nullableText,
      melhorenvio_tracking: nullableText,
      posted_at: nullableText,
      delivered_at: nullableText,
      canceled_at: nullableText,
    })
    .passthrough(),
);
function parse<T>(schema: z.ZodType<T>, json: unknown, message: string): T {
  const result = schema.safeParse(json);
  if (!result.success) throw new Error(message);
  return result.data;
}
export function parseCartResponse(json: unknown) {
  const r = parse(
    cartResponseSchema,
    json,
    "Resposta de carrinho inválida do Melhor Envio",
  );
  return { cartId: r.id, protocolo: r.protocol ?? null, status: r.status };
}
export function parseCheckoutResponse(json: unknown, cartId: string) {
  const r = parse(
    checkoutResponseSchema,
    json,
    "Resposta de compra inválida do Melhor Envio",
  );
  if (!r.purchase.orders.some((order) => order.id === cartId))
    throw new Error("Compra não incluiu a etiqueta");
  return { compraId: r.purchase.id, status: r.purchase.status };
}
export function parseGenerateResponse(json: unknown, id: string) {
  const r = parse(
    generateResponseSchema,
    json,
    "Resposta de geração inválida do Melhor Envio",
  )[id];
  if (!r || typeof r === "string")
    throw new Error("Geração não incluiu a etiqueta");
  return {
    ok: r.status,
    mensagem: r.message
      ? r.status
        ? "Etiqueta gerada"
        : meErrorMessage(422, { message: r.message })
      : null,
  };
}
export function parsePrintResponse(json: unknown) {
  const r = parse(
    printResponseSchema,
    json,
    "Link da etiqueta inválido do Melhor Envio",
  );
  return { url: r.url };
}
export type TrackingResult = {
  status: string;
  rastreio: string | null;
  postadoEm: string | null;
  entregueEm: string | null;
  canceladoEm: string | null;
};
export function parseTrackingResponse(
  json: unknown,
): Record<string, TrackingResult> {
  const r = parse(
    trackingResponseSchema,
    json,
    "Resposta de rastreio inválida do Melhor Envio",
  );
  return Object.fromEntries(
    Object.entries(r).map(([id, t]) => [
      id,
      {
        status: t.status,
        rastreio: t.tracking || t.melhorenvio_tracking || null,
        postadoEm: t.posted_at ?? null,
        entregueEm: t.delivered_at ?? null,
        canceladoEm: t.canceled_at ?? null,
      },
    ]),
  );
}
export function trackingToOrderStatus(
  t: TrackingResult,
): "shipped" | "delivered" | "canceled" | null {
  if (t.status === "delivered" || t.entregueEm) return "delivered";
  if (t.status === "canceled" || t.canceladoEm) return "canceled";
  if (t.status === "posted" || t.postadoEm) return "shipped";
  return null;
}
export function meErrorMessage(status: number, json: unknown): string {
  // Inspect only to select known messages; never echo remote payload or PII.
  let text = "";
  function visit(value: unknown, depth: number) {
    if (depth > 4 || text.length > 8000) return;
    if (typeof value === "string") text += " " + value.slice(0, 1000);
    else if (Array.isArray(value))
      value.slice(0, 20).forEach((v) => visit(v, depth + 1));
    else if (value && typeof value === "object")
      Object.values(value)
        .slice(0, 20)
        .forEach((v) => visit(v, depth + 1));
  }
  if (status >= 400 && status < 500) visit(json, 0);
  if (status === 401 || status === 403)
    return "Token do Melhor Envio sem permissão";
  if (/saldo.*insuficiente|insufficient.*balance/i.test(text))
    return "Saldo insuficiente na carteira do Melhor Envio";
  if (/cep.*inválido|postal.?code.*invalid/i.test(text))
    return "CEP inválido para a etiqueta";
  return `Melhor Envio recusou (HTTP ${status})`;
}
