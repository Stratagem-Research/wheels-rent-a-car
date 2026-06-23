import { NextResponse } from "next/server";
import { listCarWashPackagesFromDb } from "@/lib/supabase/catalog-repository";

export async function GET() {
  try {
    const items = await listCarWashPackagesFromDb(true);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load car wash packages.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
