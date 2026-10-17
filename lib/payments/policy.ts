/**
 * Where the fake Mercado Pago (and the fixed shipping quotes) may run:
 * `next dev`, the test runner, or a Vercel preview. Anything else counts as
 * production, including `next start` outside Vercel without VERCEL_ENV.
 * Pure, so the boot check (lib/env-schema.ts) and every use share it.
 */
export function fakeIntegrationsAllowed(
  e: { NODE_ENV?: string; VERCEL_ENV?: string } = process.env,
): boolean {
  if (e.VERCEL_ENV === "production") return false;
  if (e.VERCEL_ENV === "preview") return true;
  return e.NODE_ENV === "development" || e.NODE_ENV === "test";
}
