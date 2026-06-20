import { NextResponse } from "next/server";
import { listAddOnsFromDb } from "@/lib/supabase/catalog-repository";

export async function GET() {
  try {
    const items = await listAddOnsFromDb();
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load add-ons.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
