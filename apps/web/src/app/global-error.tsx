"use client";

import { captureException } from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

// Catches errors thrown by the root layout itself, which app/error.tsx
// cannot handle, and reports them to Sentry.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        {/* App Router doesn't expose status codes for errors, so render the
        generic Next.js error page. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
