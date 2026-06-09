import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { getPublicEnv } from "@/lib/server/env";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

/**
 * Supabase client for Route Handlers that mutate auth state.
 *
 * `cookies().set()` alone does not always attach Supabase session cookies to
 * the Route Handler response in Next.js App Router. Collect cookies from
 * `setAll` and call `applySupabaseCookies(response)` before returning.
 */
export async function createRouteHandlerSupabaseClient(): Promise<{
  supabase: SupabaseClient;
  applySupabaseCookies: (response: NextResponse) => NextResponse;
}> {
  const cookieStore = await cookies();
  const env = getPublicEnv();
  const pending = new Map<string, CookieToSet>();

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const cookie of cookiesToSet) {
            pending.set(cookie.name, cookie);
            try {
              cookieStore.set(cookie.name, cookie.value, cookie.options);
            } catch {
              // Route handlers may reject cookie writes in some Next.js versions.
            }
          }
        },
      },
    },
  );

  function applySupabaseCookies(response: NextResponse): NextResponse {
    for (const { name, value, options } of pending.values()) {
      response.cookies.set(name, value, options);
    }
    return response;
  }

  return { supabase, applySupabaseCookies };
}
