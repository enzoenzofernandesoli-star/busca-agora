// Health check, also called every few minutes by Supabase pg_cron to keep the
// server function warm: on the free plan an idle function takes ~1 s to wake
// up, which the visitor feels as a frozen first click.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true });
}
