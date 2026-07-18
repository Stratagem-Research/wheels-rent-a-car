import { NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { toDomainUser } from "@/lib/auth/map-user";

export async function GET() {
  const { supabase, applySupabaseCookies } = await createRouteHandlerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return applySupabaseCookies(NextResponse.json({ message: "Unauthorized" }, { status: 401 }));
  }
  return applySupabaseCookies(NextResponse.json({ user: toDomainUser(data.user) }));
}
