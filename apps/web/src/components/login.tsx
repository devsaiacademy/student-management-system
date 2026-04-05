"use client";

import { Button } from "@student-management-system/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { SiteLogo } from "@/components/site-logo";
import { trpcClient } from "@/utils/trpc";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const sendMagicLink = useMutation({
    mutationFn: async (redirectTo: string) =>
      trpcClient.auth.sendMagicLink.mutate({
        email,
        redirectTo,
      }),
  });

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextPath = searchParams.get("redirect") ?? "/welcome";
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", nextPath);

    try {
      await sendMagicLink.mutateAsync(callbackUrl.toString());
      alert("Magic link sent. Open your email to continue.");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to send magic link.";
      alert(message);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="w-full shrink-0 px-3 pt-4 sm:px-4 sm:pt-5 md:px-6 md:pt-6 lg:px-8 lg:pt-8">
        <div className="mx-auto w-full max-w-7xl">
          <SiteLogo priority />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-3 pb-8">
        <div className="flex w-full max-w-md flex-col justify-center">
          <h1 className="text-3xl font-extrabold text-foreground">Log in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your account to continue.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleLogin}>
            <label className="block text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              className="w-full rounded-lg border border-border px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              required
              type="email"
              value={email}
            />

            <Button
              className="w-full py-3 text-base font-semibold"
              disabled={sendMagicLink.isPending}
              size="lg"
              type="submit"
              variant="blue"
            >
              {sendMagicLink.isPending
                ? "Sending magic link..."
                : "Continue with Email"}
            </Button>

            <div className="relative py-1">
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
              <p className="relative mx-auto w-fit bg-background px-3 text-xs text-muted-foreground uppercase">
                or
              </p>
            </div>

            <Button
              className="w-full py-3 text-base font-semibold"
              size="lg"
              type="button"
              variant="white"
              onClick={() => {
                /* TODO: implement social signin */
              }}
            >
              Continue with Google
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <span className="font-semibold text-primary">Terms</span> and{" "}
            <span className="font-semibold text-primary">Privacy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
