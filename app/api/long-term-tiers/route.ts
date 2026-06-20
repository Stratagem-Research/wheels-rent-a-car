import { NextResponse } from "next/server";
import { listLongTermTiersFromDb } from "@/lib/supabase/catalog-repository";

export async function GET() {
  try {
    const items = await listLongTermTiersFromDb();
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load long-term tiers.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
