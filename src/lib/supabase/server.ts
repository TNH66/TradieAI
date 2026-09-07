import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. Reads/writes the auth session via Next.js cookies.
 *
 * NOTE: calling `.set` from a Server Component (rather than a Server Action
 * or Route Handler) will throw - Next.js only allows cookie writes in those
 * contexts. The try/catch below lets that fail silently there, because the
 * middleware (see src/middleware.ts) is what actually keeps the session
 * refreshed on every request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component - safe to ignore, middleware
            // handles session refresh.
          }
        },
      },
    }
  );
}

/**
 * Service-role client for trusted, server-only operations that must bypass
 * RLS (e.g. the public quote page looking up a quote by its public_id across
 * businesses). NEVER import this file from a Client Component and never send
 * this key to the browser.
 */
export function createServiceRoleClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
