import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

// /rastreio proves "number + e-mail" once, then shows the order under a
// signed, short-lived token: the e-mail never goes into the URL.
const TTL_SECONDS = 60 * 60;

function sign(payload: string): string {
  return createHmac("sha256", env.SUPABASE_SERVICE_ROLE_KEY)
    .update(`rastreio:${payload}`)
    .digest("base64url");
}

export function trackingToken(numero: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + TTL_SECONDS;
  return `${exp}.${sign(`${numero}:${exp}`)}`;
}

export function verifyTrackingToken(
  numero: string,
  token: string | undefined,
  now = Date.now(),
): boolean {
  const [expText, sig] = (token ?? "").split(".");
  const exp = Number(expText);
  if (!sig || !Number.isInteger(exp) || exp < Math.floor(now / 1000)) {
    return false;
  }
  const want = Buffer.from(sign(`${numero}:${exp}`));
  const got = Buffer.from(sig);
  return got.length === want.length && timingSafeEqual(got, want);
}
