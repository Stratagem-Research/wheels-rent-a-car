import { NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST() {
  const { supabase, applySupabaseCookies } = await createRouteHandlerSupabaseClient();
  await supabase.auth.signOut();

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return applySupabaseCookies(response);
}
