"use client";

import { captureException } from "@sentry/nextjs";
import { Button } from "@student-management-system/ui/components/button";
import { useEffect } from "react";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // biome-ignore lint/suspicious/noConsole: surface runtime errors in dev
    console.error(error);
    captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <p className="text-sm font-medium uppercase tracking-wider text-destructive">
        Something went wrong
      </p>
      <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
        Unexpected error
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          Try again
        </Button>
        <Button variant="outline">
          <a href="/">Go home</a>
        </Button>
      </div>
    </main>
  );
}
