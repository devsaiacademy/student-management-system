"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { GooeyToaster } from "goey-toast";
import { Suspense } from "react";

import { WelcomeToast } from "@/components/welcome-toast";
import { queryClient } from "@/utils/trpc";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Suspense fallback={null}>
        <WelcomeToast />
      </Suspense>
      <GooeyToaster position="top-center" theme="dark" />
    </QueryClientProvider>
  );
}
