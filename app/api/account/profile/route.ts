import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { toDomainUser } from "@/lib/auth/map-user";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

/**
 * PATCH /api/account/profile — updates the logged-in user's own profile
 * fields, stored in Supabase Auth's `user_metadata` (there is no separate
 * profiles table read by this app — see `lib/auth/map-user.ts`). Email is
 * intentionally not editable here: changing it needs Supabase's own
 * confirmation flow, which the Profile page doesn't support yet.
 */
const ProfileUpdateSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  phone: z.string().trim().optional(),
  country: z.string().trim().optional(),
  dob: z.string().trim().optional(),
  marketing: z.boolean().optional(),
  whatsappUpdates: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid profile payload." }, { status: 400 });
  }
  const { firstName, lastName, phone, country, dob, marketing, whatsappUpdates } = parsed.data;

  const { supabase, applySupabaseCookies } = await createRouteHandlerSupabaseClient();
  const { data: current, error: getError } = await supabase.auth.getUser();
  if (getError || !current.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase.auth.updateUser({
    data: {
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      country: country || current.user.user_metadata?.country,
      // dob is set-once in the UI (disabled after first save); only write it
      // when the caller actually sends one, so we never blank an existing value.
      ...(dob ? { dob } : {}),
      marketing_opt_in: marketing ?? current.user.user_metadata?.marketing_opt_in,
      whatsapp_opt_in: whatsappUpdates ?? current.user.user_metadata?.whatsapp_opt_in,
    },
  });
  if (error || !data.user) {
    return NextResponse.json({ message: "Failed to save profile." }, { status: 500 });
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
