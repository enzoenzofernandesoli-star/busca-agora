import { timingSafeEqual } from "node:crypto";

import { env } from "@/lib/env";
import { runDueJobs } from "@/lib/jobs/run";

// Called every minute by Supabase pg_cron (POST) and once a day by Vercel
// Cron (GET), both with "Authorization: Bearer <CRON_SECRET>".
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const summary = await runDueJobs();
  return Response.json({ ok: true, ...summary });
}

export const GET = handle;
export const POST = handle;
