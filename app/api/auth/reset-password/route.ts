import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { toDomainUser } from "@/lib/auth/map-user";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

const ResetSchema = z.object({
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid reset payload." }, { status: 400 });
  }

  const { supabase, applySupabaseCookies } = await createRouteHandlerSupabaseClient();
  const { data, error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error || !data.user) {
    return NextResponse.json(
      {
        message:
          "Reset session is invalid or expired. Request a fresh reset link and open it on this device.",
      },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ user: toDomainUser(data.user) });
  response.cookies.set(SESSION_COOKIE_NAME, data.user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
    path: "/",
  });
  return applySupabaseCookies(response);
}
