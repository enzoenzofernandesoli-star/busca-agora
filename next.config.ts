import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

import { isLocalSupabase, supabaseStoragePatterns } from "./lib/images";

// Security headers on every response (security audit of 24/10). The CSP
// only carries directives that cannot break Next's inline scripts or the
// redirects to Google and Mercado Pago: no framing by other sites, no
// <base> hijack, no plugins.
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  // Do not announce the framework.
  poweredByHeader: false,
  // The service worker must never be cached by the browser or the CDN, or a
  // fixed version would stay installed on phones.
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: supabaseStoragePatterns(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    // Local development only (Supabase on 127.0.0.1); off for real projects.
    dangerouslyAllowLocalIP: isLocalSupabase(
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
