"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { GooeyToaster } from "goey-toast";

import { queryClient } from "@/utils/trpc";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <GooeyToaster position="top-center" />
    </QueryClientProvider>
  );
}
