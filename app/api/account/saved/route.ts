import { NextResponse } from "next/server";
import { requireAccountUser } from "@/lib/server/account-auth";
import { listSavedVehicles } from "@/lib/supabase/saved-vehicles-repository";

export async function GET() {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;

  try {
    const items = await listSavedVehicles(auth.supabase, auth.user.id);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ message: "Failed to load saved vehicles." }, { status: 500 });
  }
}
