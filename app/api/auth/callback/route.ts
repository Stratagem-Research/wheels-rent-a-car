import { NextResponse, type NextRequest } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { getSiteUrl } from "@/lib/server/env";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

/**
 * Supabase auth callback.
 *
 * Lands here after email-based flows (password recovery, email confirmation,
 * magic links, OAuth). Exchanges the one-time `code` for a session using the
 * PKCE verifier cookie that was set when the flow started, mirrors the
 * `wheels.session` cookie the proxy reads for /account gating, then forwards
 * the user to the `next` destination.
 *
 * Only same-origin relative paths are accepted for `next` to prevent open
 * redirects.
 */
function safeNext(raw: string | null): string {
  if (!raw) return "/account";
  // Must be a root-relative path (no protocol-relative "//" or absolute URLs).
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/account";
  return raw;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  const errorDescription = url.searchParams.get("error_description");
  const origin = getSiteUrl();

  if (errorDescription) {
    const dest = new URL(next, origin);
    dest.searchParams.set("error", "auth_callback");
    return NextResponse.redirect(dest);
  }

  if (!code) {
    const dest = new URL(next, origin);
    dest.searchParams.set("error", "missing_code");
    return NextResponse.redirect(dest);
  }

  const { supabase, applySupabaseCookies } = await createRouteHandlerSupabaseClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session || !data.user) {
    const dest = new URL(next, origin);
    dest.searchParams.set("error", "exchange_failed");
    return NextResponse.redirect(dest);
  }

  const response = NextResponse.redirect(new URL(next, origin));
  response.cookies.set(SESSION_COOKIE_NAME, data.user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
    path: "/",
  });
  return applySupabaseCookies(response);
}
