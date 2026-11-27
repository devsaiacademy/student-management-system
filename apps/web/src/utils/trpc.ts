import type { AppRouter } from "@student-management-system/api/routers/index";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";

// Reuse fetched data for 30s before treating it as stale, so navigating
// between admin pages or refocusing the tab doesn't refetch everything.
// Mutations invalidate the queries they affect, so edits still show at once.
const QUERY_STALE_TIME_MS = 30_000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: QUERY_STALE_TIME_MS },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      toast.error(error.message, {
        action: {
          label: "retry",
          onClick: query.invalidate,
        },
      });
    },
  }),
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
