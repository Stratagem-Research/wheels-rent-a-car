import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/server/env";

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
  const env = getServerEnv();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${env.WEBSITE_URL}/reset-password`,
  });
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
