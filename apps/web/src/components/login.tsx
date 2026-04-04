"use client";

import { Button } from "@student-management-system/ui/components/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SiteLogo } from "@/components/site-logo";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: wire auth logic (trpc / next-auth / OAuth)
    router.push("/");
  };

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

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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
              size="lg"
              type="submit"
              variant="blue"
            >
              Continue with Email
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
