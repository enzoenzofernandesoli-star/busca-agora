import type { NodeOptions } from "@sentry/nextjs";

// Options shared by the server, edge and browser Sentry SDKs.
// Conservative data collection: request bodies, cookies and user info may
// carry CPF, addresses or session tokens, so none of them are sent.
export const sentryBaseOptions = {
  tracesSampleRate: 0.1,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpBodies: [],
  },
} satisfies Pick<NodeOptions, "tracesSampleRate" | "dataCollection">;
