import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

import { supabaseStoragePatterns } from "./lib/images";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseStoragePatterns(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
  },
  env: {
    // The Sentry DSN is public by design (it only allows sending events), so
    // the browser SDK reuses SENTRY_DSN instead of a second variable.
    // Empty when unset: Sentry then stays off, silently.
    NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN ?? "",
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  telemetry: false,
  // Source map upload needs SENTRY_AUTH_TOKEN/org/project (see docs/v2.md).
  sourcemaps: { disable: true },
});
