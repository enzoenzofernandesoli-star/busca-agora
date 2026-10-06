import * as Sentry from "@sentry/nextjs";

import { sentryBaseOptions } from "./sentry.shared";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// No DSN: Sentry stays off, without errors or warnings.
if (dsn) {
  Sentry.init({
    ...sentryBaseOptions,
    dsn,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
