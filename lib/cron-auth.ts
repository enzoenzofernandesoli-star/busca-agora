import "server-only";

import { timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";

/** "Authorization: Bearer <CRON_SECRET>", compared in constant time. */
export function authorizedCron(request: Request): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}
