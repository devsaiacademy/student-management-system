import { Button } from "@student-management-system/ui/components/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-3xl font-medium text-foreground sm:text-4xl">
        Page not found
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button>
        <Link href="/">Go back home</Link>
      </Button>
    </main>
  );
}
