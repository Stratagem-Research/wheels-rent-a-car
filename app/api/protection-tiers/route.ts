import { NextResponse } from "next/server";
import { listProtectionTiersFromDb } from "@/lib/supabase/catalog-repository";

export async function GET() {
  try {
    const items = await listProtectionTiersFromDb();
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load protection tiers.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
