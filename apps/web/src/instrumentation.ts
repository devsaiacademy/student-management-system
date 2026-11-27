import { captureRequestError } from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Reports unhandled errors from Server Components, route handlers and
// middleware (including the Razorpay webhook and the overdue cron).
export const onRequestError = captureRequestError;
