import "server-only";

import { createRequireEnv, parseServerEnv } from "@/lib/env-schema";

/**
 * Server environment, validated once when this module is first loaded
 * (instrumentation.ts imports it at boot). Required: the 3 NEXT_PUBLIC_* and
 * SUPABASE_SERVICE_ROLE_KEY. Integration keys are optional here and must be
 * read with requireEnv() at the point of use.
 */
export const env = parseServerEnv(process.env);

export const requireEnv = createRequireEnv(env);
