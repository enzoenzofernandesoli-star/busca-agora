import { announceNavigationStart } from "./lib/navigation-events";
import { sentryBaseOptions } from "./sentry.shared";

type SentryModule = typeof import("@sentry/nextjs");

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Loaded after the page is interactive and only when a DSN exists: the SDK
// is the largest script of the store and must not delay the first paint.
let sentry: SentryModule | undefined;
if (dsn) {
  void import("@sentry/nextjs").then((mod) => {
    mod.init({ ...sentryBaseOptions, dsn });
    sentry = mod;
  });
}

// Every App Router navigation: the progress bar starts at the click.
export function onRouterTransitionStart(
  ...args: Parameters<SentryModule["captureRouterTransitionStart"]>
) {
  announceNavigationStart(args[0]);
  sentry?.captureRouterTransitionStart(...args);
}
