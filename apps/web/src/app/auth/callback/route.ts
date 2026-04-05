import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = requestUrl.searchParams.get("next") ?? "/welcome";
  const safeNextPath = nextPath.startsWith("/") ? nextPath : "/welcome";
  const response = NextResponse.redirect(
    new URL(safeNextPath, requestUrl.origin)
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers.get("cookie")
            ?.split(/; */)
            .filter(Boolean)
            .map((cookie) => {
              const [name, ...value] = cookie.split("=");
              return {
                name,
                value: value.join("="),
              };
            }) ?? [];
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", requestUrl.origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
    );
  }

  return response;
}
