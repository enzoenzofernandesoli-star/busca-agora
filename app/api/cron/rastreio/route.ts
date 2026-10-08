import { authorizedCron } from "@/lib/cron-auth";
import { kickJobs } from "@/lib/jobs/run";
import { pollTracking } from "@/lib/shipping/tracking";

// Called every 2 hours by Supabase pg_cron (tracking_tick), with
// "Authorization: Bearer <CRON_SECRET>".
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!authorizedCron(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const resumo = await pollTracking();
  // Status changes enqueue e-mails: send them now.
  if (resumo.mudaram > 0) kickJobs();
  return Response.json({ ok: true, ...resumo });
}
