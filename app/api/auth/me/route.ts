import { NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { toDomainUser } from "@/lib/auth/map-user";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function GET() {
  const { supabase, applySupabaseCookies } = await createRouteHandlerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    // Drop the gate cookie so proxy.ts stops treating this browser as signed-in
    // (client clearSession cannot erase the httpOnly copy set at login).
    const response = NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/",
    });
    return applySupabaseCookies(response);
  }
  return applySupabaseCookies(NextResponse.json({ user: toDomainUser(data.user) }));
}
