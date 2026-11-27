import { captureException } from "@sentry/nextjs";
import type { Context } from "@student-management-system/api/context";
import {
  getSessionUser,
  loadUserProfile,
} from "@student-management-system/api/context";
import { appRouter } from "@student-management-system/api/routers/index";
import { createServerClient } from "@supabase/ssr";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

async function createContext(req: NextRequest): Promise<Context> {
  // Use Next's mutable cookie store so Supabase can write cleared auth
  // cookies back during signOut. Reading the request cookies directly is
  // read-only, which is why logout used to silently fail.
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't mutate cookies — safe to ignore;
            // Route Handlers (like this one) can.
          }
        },
      },
    }
  );

  const user = await getSessionUser(supabase);
  const userProfile = user ? await loadUserProfile(user.id) : null;

  return { supabase, user, userProfile };
}

function handler(req: NextRequest) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    // tRPC turns thrown errors into responses, so Next's onRequestError never
    // sees them. Report only unexpected failures; expected ones such as
    // UNAUTHORIZED or BAD_REQUEST are normal app behaviour, not bugs.
    onError: ({ error, path, type }) => {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        captureException(error.cause ?? error, {
          tags: { trpc_path: path ?? "unknown", trpc_type: type },
        });
      }
    },
  });
}

export { handler as GET, handler as POST };
