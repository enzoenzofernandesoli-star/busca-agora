import * as Sentry from "@sentry/nextjs";

import { sentryBaseOptions } from "./sentry.shared";

const dsn = process.env.SENTRY_DSN;

// No DSN: Sentry stays off, without errors or warnings.
if (dsn) {
  Sentry.init({
    ...sentryBaseOptions,
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
}
