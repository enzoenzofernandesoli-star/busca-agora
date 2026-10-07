import "server-only";

import { createHmac } from "node:crypto";

import { headers } from "next/headers";

import { createAdminClient } from "@/lib/db/admin";
import { env } from "@/lib/env";

// Limits on top of Supabase Auth's own (plan, phase 3).
const LIMITS = {
  // Per e-mail: protects one account from password guessing.
  "login:email": { max: 5, janelaSegundos: 15 * 60 },
  // Per IP: one machine trying many accounts.
  "login:ip": { max: 20, janelaSegundos: 15 * 60 },
  "cadastro:ip": { max: 5, janelaSegundos: 60 * 60 },
  "recuperar:ip": { max: 5, janelaSegundos: 60 * 60 },
  "recuperar:email": { max: 3, janelaSegundos: 60 * 60 },
  // Shipping quotes call a paid third-party API.
  "frete:ip": { max: 40, janelaSegundos: 5 * 60 },
} as const;

export type RateLimitKind = keyof typeof LIMITS;

/** HMAC so the table never holds an IP or e-mail in clear text. */
function hashKey(kind: string, value: string): string {
  return createHmac("sha256", env.SUPABASE_SERVICE_ROLE_KEY)
    .update(`${kind}:${value.trim().toLowerCase()}`)
    .digest("hex");
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  // Vercel sets x-forwarded-for; the first entry is the client.
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "desconhecido"
  );
}

/**
 * Counts one attempt for each key and returns false when any is over its
 * limit. Fails closed: if the database cannot be reached, the attempt is
 * refused rather than let through unlimited.
 */
export async function allowAttempt(
  checks: { kind: RateLimitKind; value: string }[],
): Promise<boolean> {
  // `next dev` on this machine (the e2e suite logs in dozens of times from
  // 127.0.0.1). Never in a build: NODE_ENV is "production" there, and the
  // database tests cover the limits themselves.
  if (process.env.NODE_ENV === "development" && (await isLoopback())) {
    return true;
  }
  const admin = createAdminClient();
  const results = await Promise.all(
    checks.map(({ kind, value }) =>
      admin.rpc("hit_rate_limit", {
        p_chave: hashKey(kind, value),
        p_max: LIMITS[kind].max,
        p_janela_segundos: LIMITS[kind].janelaSegundos,
      }),
    ),
  );
  return results.every((r) => !r.error && r.data === true);
}

async function isLoopback(): Promise<boolean> {
  const ip = await clientIp();
  return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
}
