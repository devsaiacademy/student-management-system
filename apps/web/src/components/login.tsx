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
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState("");
  const role = searchParams.get("role");
  const sendMagicLink = useMutation({
  mutationFn: async () =>
    trpcClient.auth.sendMagicLink.mutate({
      email,
      redirectTo: `${window.location.origin}/auth/callback`,
    }),
});

async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
  
  event.preventDefault()
  setError("");

  switch (role) {
    case "parent": {
      const isStudentEmail = await trpcClient.auth.isStudentEmail.query({
        email,
      });
      if (!isStudentEmail) {
        setError("You're email is not registered, contact admin for access.");
        return;
      }
      break;
    }
    default: {
      if (!email.includes("@otomatiks.in")) {
        setError("You are not allowed to login with this email, use your otomatiks.in email.");
        return;
      }
      break;
    }
  }

  try {
    await sendMagicLink.mutateAsync();
    setMagicLinkSent(true);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to send magic link.";
    setError(message);
  }
}

  return (
    <div className="flex min-h-screen flex-col">
      <div className="w-full shrink-0 px-3 pt-4 sm:px-4 sm:pt-5 md:px-6 md:pt-6 lg:px-8 lg:pt-8">
        <div className="mx-auto flex justify-center w-full max-w-7xl">
          <SiteLogo variant="center" className="mb-6 h-8 sm:h-10 md:h-12" priority />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-3 pb-8">
        <div className="flex w-full max-w-md flex-col justify-center">
          {magicLinkSent ? (
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-foreground">Check your email</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                We sent a magic link to <span className="font-semibold text-foreground">{email}</span>. Click the link in your email to sign in.
              </p>
              <Button
                className="mt-8 w-full py-3 text-base font-semibold"
                size="lg"
                type="button"
                variant="white"
                onClick={() => setMagicLinkSent(false)}
              >
                Back to login
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold text-foreground">Log in</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Use your account to continue.
              </p>

              {error && (
                <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              )}

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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
