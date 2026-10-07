// Shared by next.config.ts (images.remotePatterns) and its unit test.
// Product photos come only from Supabase Storage public buckets.
export function supabaseStoragePatterns(supabaseUrl: string | undefined) {
  if (!supabaseUrl) return [];
  const url = new URL(supabaseUrl);
  return [
    {
      // https in production; http only for the local Supabase (127.0.0.1).
      protocol:
        url.protocol === "http:" ? ("http" as const) : ("https" as const),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: "/storage/v1/object/public/**",
    },
  ];
}

/**
 * True only for the local Supabase of `npx supabase start`. next/image
 * refuses local IPs unless `dangerouslyAllowLocalIP` is on, so it is turned
 * on for that case and never for a real project.
 */
export function isLocalSupabase(supabaseUrl: string | undefined): boolean {
  if (!supabaseUrl) return false;
  const host = new URL(supabaseUrl).hostname;
  return host === "127.0.0.1" || host === "localhost";
}
