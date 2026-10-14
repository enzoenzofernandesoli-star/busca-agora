import { headers } from "next/headers";

import { publicEnv } from "@/lib/env-public";

/**
 * Origin the visitor is actually on, if it is one of ours. Auth links
 * (Google return, confirmation and password e-mails) must come back to the
 * address the visitor used: while the store's domain is not live they use
 * the Vercel address. Anything not on the list falls back to the site URL,
 * so a forged Host header can never send a login elsewhere.
 */
export function pickOrigin(
  host: string | null,
  proto: string | null,
  allowed: string[],
  fallback: string,
): string {
  if (!host) return fallback;
  const scheme = proto === "http" ? "http" : "https";
  const origin = `${scheme}://${host}`.toLowerCase();
  const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  return local || allowed.includes(origin) ? origin : fallback;
}

export function allowedOrigins(): string[] {
  const list = [publicEnv.NEXT_PUBLIC_SITE_URL];
  // Set by Vercel on every deployment (production and previews).
  for (const name of [
    "VERCEL_PROJECT_PRODUCTION_URL",
    "VERCEL_URL",
    "VERCEL_BRANCH_URL",
  ]) {
    const value = process.env[name];
    if (value) list.push(`https://${value}`);
  }
  return list.map((o) => o.replace(/\/$/, "").toLowerCase());
}

export async function requestOrigin(): Promise<string> {
  const h = await headers();
  return pickOrigin(
    h.get("x-forwarded-host") ?? h.get("host"),
    h.get("x-forwarded-proto"),
    allowedOrigins(),
    publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, ""),
  );
}
