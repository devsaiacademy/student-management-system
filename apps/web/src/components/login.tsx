"use client";

import { isOtomatiksAdminEmail } from "@student-management-system/api/lib/admin-email";
import { Button } from "@student-management-system/ui/components/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@student-management-system/ui/components/input-otp";
import { useMutation } from "@tanstack/react-query";
import { gooeyToast } from "goey-toast";
import { MoveLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SiteLogo } from "@/components/site-logo";
import { TwinOrbit } from "@/components/twin-orbit";
import { supabaseBrowser } from "@/lib/supabase/client";
import { trpcClient } from "@/utils/trpc";

const RESEND_COOLDOWN_MS = 65_000;
const MAX_ATTEMPTS = 3;
const OTP_LENGTH = 6;

type Stage =
  | { kind: "email" }
  | {
      kind: "verify";
      email: string;
      cooldownEndsAt: number;
      attempts: number;
      locked: boolean;
    };

function toastInvalidEmail(description: string) {
  gooeyToast.error("Invalid email", {
    showTimestamp: false,
    borderColor: "#E0E0E0",
    borderWidth: 1.5,
    description,
    timing: { displayDuration: 5000 },
  });
}

function resendLabel(secondsLeft: number, pending: boolean) {
  if (secondsLeft > 0) {
    return `Resend in ${secondsLeft}s`;
  }
  if (pending) {
    return "Resending...";
  }
  return "Resend code";
}

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role");

  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<Stage>({ kind: "email" });
  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const sendSignInEmail = useMutation({
    mutationFn: (targetEmail: string) =>
      trpcClient.auth.sendSignInEmail.mutate({
        email: targetEmail,
        redirectTo: `${window.location.origin}/auth/callback`,
      }),
  });

  useEffect(() => {
    if (stage.kind !== "verify") {
      setSecondsLeft(0);
      return;
    }
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((stage.cooldownEndsAt - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [stage]);

  useEffect(() => {
    if (stage.kind !== "verify" || stage.locked) {
      return;
    }
    otpInputRef.current?.focus();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        otpInputRef.current?.focus();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [stage]);

  async function preCheckEmail(targetEmail: string): Promise<boolean> {
    if (role === "parent") {
      const matches = await trpcClient.auth.isStudentEmail.query({
        email: targetEmail,
      });
      if (matches.length === 0) {
        toastInvalidEmail(
          "Your email is not registered, contact admin for access."
        );
        return false;
      }
      return true;
    }
    if (role === "teacher") {
      if (!isOtomatiksAdminEmail(targetEmail)) {
        toastInvalidEmail(
          "You are not allowed to login with this email, use your otomatiks.in email."
        );
        return false;
      }
      return true;
    }
    toastInvalidEmail(
      "You are not allowed to login with this email, use your otomatiks.in email."
    );
    return false;
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!(await preCheckEmail(email))) {
      return;
    }
    try {
      await sendSignInEmail.mutateAsync(email);
      setCode("");
      setStage({
        kind: "verify",
        email,
        cooldownEndsAt: Date.now() + RESEND_COOLDOWN_MS,
        attempts: 0,
        locked: false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to send code.";
      gooeyToast.error("Sign-in failed", { description: message });
    }
  }

  async function handleResend() {
    if (stage.kind !== "verify" || secondsLeft > 0) {
      return;
    }
    try {
      await sendSignInEmail.mutateAsync(stage.email);
      setCode("");
      setStage({
        kind: "verify",
        email: stage.email,
        cooldownEndsAt: Date.now() + RESEND_COOLDOWN_MS,
        attempts: 0,
        locked: false,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to resend code.";
      gooeyToast.error("Resend failed", { description: message });
    }
  }

  async function handleVerify(token: string) {
    if (stage.kind !== "verify" || stage.locked || verifying) {
      return;
    }
    setVerifying(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.verifyOtp({
      email: stage.email,
      token,
      type: "email",
    });
    setVerifying(false);

    if (!error) {
      router.push("/welcome");
      return;
    }

    if (error.code === "otp_expired" || error.code === "otp_disabled") {
      gooeyToast.error("Code expired", {
        description: "Request a new code to continue.",
      });
      setStage({
        kind: "verify",
        email: stage.email,
        cooldownEndsAt: stage.cooldownEndsAt,
        attempts: stage.attempts,
        locked: true,
      });
      setCode("");
      return;
    }

    const nextAttempts = stage.attempts + 1;
    const remainingAttempts = MAX_ATTEMPTS - nextAttempts;
    if (remainingAttempts <= 0) {
      gooeyToast.error("Too many attempts", {
        description: "Request a new code to continue.",
      });
      setStage({
        kind: "verify",
        email: stage.email,
        cooldownEndsAt: stage.cooldownEndsAt,
        attempts: nextAttempts,
        locked: true,
      });
      setCode("");
      return;
    }

    gooeyToast.error("Wrong code", {
      description: `That code didn't match. (${remainingAttempts}/${MAX_ATTEMPTS} left)`,
    });
    setStage({
      kind: "verify",
      email: stage.email,
      cooldownEndsAt: stage.cooldownEndsAt,
      attempts: nextAttempts,
      locked: false,
    });
    setCode("");
  }

  function handleUseDifferentEmail() {
    setStage({ kind: "email" });
    setCode("");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-3 py-8">
      <div className="flex w-full max-w-md flex-col items-center justify-center">
        <div className="mx-auto flex w-full justify-center">
          <SiteLogo
            className="mb-6 h-8 sm:h-10 md:h-12"
            priority
            variant="center"
          />
        </div>
        <div className="flex w-full flex-col justify-center">
          {stage.kind === "verify" ? (
            <div className="text-center">
              <h1 className="text-3xl font-extrabold text-foreground">
                Enter your code
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">
                We sent a 6-digit code to{" "}
                <span className="font-semibold text-foreground">
                  {stage.email}
                </span>
                . You can also click the link in the email.
              </p>

              <div className="mt-8 flex justify-center">
                <InputOTP
                  autoFocus
                  disabled={stage.locked || verifying}
                  maxLength={OTP_LENGTH}
                  onChange={(next) => {
                    setCode(next);
                    if (next.length === OTP_LENGTH) {
                      void handleVerify(next);
                    }
                  }}
                  ref={otpInputRef}
                  value={code}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {verifying && (
                <div className="mt-4 flex items-center justify-center gap-3 text-sm text-muted-foreground">
                  <TwinOrbit className="size-1 text-primary" />
                  <span>Verifying…</span>
                </div>
              )}

              <div className="mt-6 flex flex-col items-center gap-3">
                <Button
                  className="h-10 rounded-md px-4 text-sm"
                  disabled={secondsLeft > 0 || sendSignInEmail.isPending}
                  onClick={handleResend}
                  type="button"
                  variant="outline"
                >
                  {resendLabel(secondsLeft, sendSignInEmail.isPending)}
                </Button>
                <button
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:underline"
                  onClick={handleUseDifferentEmail}
                  type="button"
                >
                  <MoveLeft className="size-4" />
                  Use a different email
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-extrabold text-foreground">
                Log in as {role}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Use your account to continue.
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleEmailSubmit}>
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
                  disabled={sendSignInEmail.isPending}
                  size="lg"
                  type="submit"
                  variant="blue"
                >
                  {sendSignInEmail.isPending
                    ? "Sending code..."
                    : "Continue with Email"}
                </Button>
              </form>

              <div className="mt-6 flex justify-center">
                <Link
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4"
                  href="/"
                >
                  <MoveLeft className="size-4" />
                  Back to home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
