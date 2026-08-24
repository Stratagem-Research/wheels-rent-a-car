import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";

/**
 * POST /api/account/change-password — verifies the caller's current
 * password by re-authenticating with it, then rotates to the new one.
 * Supabase's `updateUser` has no "confirm current password" check of its
 * own, so that verification has to happen here first.
 */
const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid password payload." }, { status: 400 });
  }

  const { supabase, applySupabaseCookies } = await createRouteHandlerSupabaseClient();
  const { data: current, error: getError } = await supabase.auth.getUser();
  if (getError || !current.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: current.user.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) {
    return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    return NextResponse.json(
      { message: error.message || "Failed to update password." },
      { status: 500 },
    );
  }

  return applySupabaseCookies(NextResponse.json({ ok: true }));
}
