// Shared by next.config.ts (images.remotePatterns) and its unit test.
// Product photos come only from Supabase Storage public buckets.
export function supabaseStoragePatterns(supabaseUrl: string | undefined) {
  if (!supabaseUrl) return [];
  return [
    {
      protocol: "https" as const,
      hostname: new URL(supabaseUrl).hostname,
      pathname: "/storage/v1/object/public/**",
    },
  ];
}
