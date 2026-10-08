import { authorizedCron } from "@/lib/cron-auth";
import { runDueJobs } from "@/lib/jobs/run";

// Called every minute by Supabase pg_cron (POST) and once a day by Vercel
// Cron (GET), both with "Authorization: Bearer <CRON_SECRET>".
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handle(request: Request) {
  if (!authorizedCron(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const summary = await runDueJobs();
  return Response.json({ ok: true, ...summary });
}

export const GET = handle;
export const POST = handle;
