"use client";

import { Button } from "@student-management-system/ui/components/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: wire auth logic (trpc / next-auth / OAuth)
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-primary/80 bg-white/95 p-8 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-center mb-8">
          <Image
            src="/logo.svg"
            width={212}
            height={40}
            alt="Otomatics"
            priority
          />
        </div>

        <h1 className="text-3xl font-extrabold text-foreground text-center">
          Log in
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Use your account to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-medium text-foreground">
            Email address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-lg border border-border px-4 py-3 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
          />

          <Button
            type="submit"
            variant="blue"
            className="w-full py-3 text-base font-semibold"
          >
            Continue with Email
          </Button>

          <div className="relative py-1">
            <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
            <p className="relative mx-auto w-fit bg-white px-3 text-xs uppercase text-muted-foreground">
              or
            </p>
          </div>

          <Button
            type="button"
            variant="white"
            className="w-full py-3 text-base font-semibold"
            onClick={() => {
              /* TODO: implement social signin */
            }}
          >
            Continue with Google
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <span className="text-primary font-semibold">Terms</span> and{" "}
          <span className="text-primary font-semibold">Privacy</span>.
        </p>
      </div>
    </div>
  );
}
