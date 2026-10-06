import { createBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/lib/env-public";

/** Supabase client for Client Components (anon key, subject to RLS). */
export function createClient() {
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
