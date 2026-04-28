"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { FourBallOrbit } from "@/components/four-ball-orbit";
import { trpcClient } from "@/utils/trpc";

export function WelcomeRedirector() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await trpcClient.auth.resolveLogin.query();
        if (cancelled) {
          return;
        }
        if (!result.user) {
          router.replace("/login?role=parent");
          return;
        }
        if (result.isAdmin) {
          router.replace("/admin/all-students?t=1");
          return;
        }
        if (result.student.length > 0) {
          router.replace(`/student/${result.student[0]?.id}?t=1`);
          return;
        }
        router.replace("/login?role=parent");
      } catch {
        if (!cancelled) {
          router.replace("/login?role=parent");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-3 py-8">
      <div className="flex flex-col items-center gap-6 text-muted-foreground">
        <FourBallOrbit />
        <p className="text-sm">Verifying your account…</p>
      </div>
    </div>
  );
}
