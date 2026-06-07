import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/server/env";

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ForgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid email payload." }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  // The recovery link lands on /auth/callback, which exchanges the code for a
  // session (using the PKCE verifier cookie set by this very request) and then
  // forwards to /reset-password where the user picks a new password.
  const redirectTo = `${getSiteUrl()}/api/auth/callback?next=${encodeURIComponent("/reset-password")}`;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  });

  // Always return 200 to prevent email enumeration. Supabase rate-limit and
  // delivery errors are swallowed deliberately; the UI shows a generic success
  // state regardless. Real errors are still surfaced to logs by Supabase.
  if (error && process.env.NODE_ENV !== "production") {
    console.warn("[forgot-password] resetPasswordForEmail error:", error.message);
  }

  return NextResponse.json({ ok: true });
}
