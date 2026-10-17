import { z } from "zod";

/**
 * Where a visitor came from (first-party cookie "ba_origem", 30 days):
 * utm_source, utm_medium, utm_campaign and ref (creator/influencer code).
 * A new visit carrying any of them replaces the previous origin. The
 * cookie is written in the browser (static pages stay cached) and always
 * re-validated on the server before it touches an order.
 */
export const ORIGIN_COOKIE = "ba_origem";
export const ORIGIN_MAX_AGE = 30 * 24 * 60 * 60;

const value = z
  .string()
  .trim()
  .max(100)
  .regex(/^[\p{L}\p{N} _.\-:@+/]*$/u)
  .transform((v) => (v === "" ? null : v.toLowerCase()));

export const originSchema = z.object({
  utm_source: value.nullable().default(null),
  utm_medium: value.nullable().default(null),
  utm_campaign: value.nullable().default(null),
  ref: value.nullable().default(null),
});

export type Origin = z.infer<typeof originSchema>;

const KEYS = ["utm_source", "utm_medium", "utm_campaign", "ref"] as const;

/** Origin carried by a landing URL, or null when it has none. */
export function originFromSearch(search: string): Origin | null {
  const params = new URLSearchParams(search);
  if (!KEYS.some((k) => params.get(k))) return null;
  const parsed = originSchema.safeParse(
    Object.fromEntries(KEYS.map((k) => [k, params.get(k) ?? ""])),
  );
  return parsed.success && KEYS.some((k) => parsed.data[k])
    ? parsed.data
    : null;
}

/** The cookie's value, validated; null when absent or tampered with. */
export function parseOriginCookie(raw: string | undefined): Origin | null {
  if (!raw) return null;
  try {
    const parsed = originSchema.safeParse(JSON.parse(decodeURIComponent(raw)));
    return parsed.success && KEYS.some((k) => parsed.data[k])
      ? parsed.data
      : null;
  } catch {
    return null;
  }
}
