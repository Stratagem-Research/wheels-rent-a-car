import { NextResponse } from "next/server";
import { listCorporateTiersFromDb, replaceCorporateTiersInDb } from "@/lib/supabase/cms-repository";
import type { CorporateTier } from "@/types/domain";

export async function GET() {
  try {
    const items = await listCorporateTiersFromDb();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load corporate tiers.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { items?: CorporateTier[] };
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ message: "Expected { items: CorporateTier[] }." }, { status: 400 });
    }
    await replaceCorporateTiersInDb(body.items);
    return NextResponse.json({ ok: true, count: body.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save corporate tiers.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
