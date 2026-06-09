import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { toDomainUser } from "@/lib/auth/map-user";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getSiteUrl } from "@/lib/server/env";

const RegisterSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  mobile: z.string().optional(),
  marketing: z.boolean().default(false),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid registration payload." }, { status: 400 });
  }

  const { supabase, applySupabaseCookies } = await createRouteHandlerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        phone: parsed.data.mobile ?? "",
        marketing_opt_in: parsed.data.marketing,
        whatsapp_opt_in: true,
        country: "LB",
      },
      emailRedirectTo: `${getSiteUrl()}/api/auth/callback?next=${encodeURIComponent("/account")}`,
    },
  });

  if (error || !data.user) {
    return NextResponse.json({ message: error?.message ?? "Registration failed." }, { status: 400 });
  }

  // When email confirmation is enabled, Supabase returns a user but no session.
  // The caller must NOT be treated as signed in until they confirm.
  const requiresEmailConfirmation = !data.session;

  const response = NextResponse.json({
    user: toDomainUser(data.user),
    requiresEmailConfirmation,
  });
  if (data.session) {
    response.cookies.set(SESSION_COOKIE_NAME, data.user.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 14,
      path: "/",
    });
    return applySupabaseCookies(response);
  }
  return response;
}
