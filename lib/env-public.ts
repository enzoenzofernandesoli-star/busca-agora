import { parsePublicEnv } from "@/lib/env-schema";

// Literal process.env.NEXT_PUBLIC_* references so Next.js inlines them in the
// browser bundle. Safe to import from client code: only public values here.
export const publicEnv = parsePublicEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
