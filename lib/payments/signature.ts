import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Mercado Pago webhook signature (official docs, "Validar origem da
 * notificação"): x-signature = "ts=<ts>,v1=<hex>", where v1 is
 * HMAC-SHA256(secret, "id:<data.id>;request-id:<x-request-id>;ts:<ts>;").
 * data.id comes from the query string and is lowercased; parts missing from
 * the notification are left out of the manifest.
 */
export function signatureManifest(parts: {
  dataId: string | null;
  requestId: string | null;
  ts: string;
}): string {
  let manifest = "";
  if (parts.dataId) manifest += `id:${parts.dataId.toLowerCase()};`;
  if (parts.requestId) manifest += `request-id:${parts.requestId};`;
  manifest += `ts:${parts.ts};`;
  return manifest;
}

export function parseSignatureHeader(
  header: string | null,
): { ts: string; v1: string } | null {
  if (!header) return null;
  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of header.split(",")) {
    const [key, ...rest] = part.split("=");
    const value = rest.join("=").trim();
    if (key?.trim() === "ts") ts = value;
    if (key?.trim() === "v1") v1 = value;
  }
  return ts && v1 && /^\d+$/.test(ts) && /^[0-9a-f]{64}$/i.test(v1)
    ? { ts, v1: v1.toLowerCase() }
    : null;
}

export function signWebhook(secret: string, manifest: string): string {
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

/** ts may come in seconds or milliseconds; both are accepted. */
function tsToMs(ts: string): number {
  const n = Number(ts);
  return n > 1e12 ? n : n * 1000;
}

export function verifyWebhookSignature(opts: {
  header: string | null;
  requestId: string | null;
  dataId: string | null;
  secret: string;
  now?: Date;
  /**
   * Older notifications are refused. Generous by default (3 days): Mercado
   * Pago retries for a long time, and a replay is harmless anyway because
   * the payment is always fetched again from their API.
   */
  toleranceMs?: number;
}): boolean {
  if (!opts.secret) return false;
  const parsed = parseSignatureHeader(opts.header);
  if (!parsed) return false;
  const now = (opts.now ?? new Date()).getTime();
  const age = Math.abs(now - tsToMs(parsed.ts));
  if (age > (opts.toleranceMs ?? 3 * 24 * 60 * 60 * 1000)) return false;
  const expected = signWebhook(
    opts.secret,
    signatureManifest({
      dataId: opts.dataId,
      requestId: opts.requestId,
      ts: parsed.ts,
    }),
  );
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(parsed.v1, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
