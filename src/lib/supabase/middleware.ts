import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every request and enforces route
 * protection:
 *  - /dashboard, /onboarding, /customers, /jobs, /quotes, /invoices, /settings
 *    require a signed-in user (redirect to /login otherwise).
 *  - Signed-in users hitting /login or /signup are sent to /dashboard.
 *
 * Public quote pages (/quote/[public_id]) are intentionally NOT protected -
 * customers view/accept quotes without an account.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const protectedPrefixes = [
    "/dashboard",
    "/onboarding",
    "/customers",
    "/jobs",
    "/quotes",
    "/invoices",
    "/settings",
  ];
  const isProtected = protectedPrefixes.some((p) => path.startsWith(p));
  const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", path);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
