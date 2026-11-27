import type { BrowserOptions } from "@sentry/nextjs";

// Errors only: no tracing, Session Replay, user feedback or logs.
// Student and payment data flows through this app, so keep request bodies,
// cookies, headers, DB query values and stack-frame locals out of events.
// The stack trace, error message, URL and release are enough to debug.
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    databaseQueryData: false,
    stackFrameVariables: false,
  },
} satisfies BrowserOptions;
