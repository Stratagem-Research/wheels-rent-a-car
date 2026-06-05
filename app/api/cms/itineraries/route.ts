import { NextResponse } from "next/server";
import { listItinerariesFromDb, replaceItinerariesInDb } from "@/lib/supabase/cms-repository";
import type { Itinerary } from "@/types/domain";

export async function GET() {
  try {
    const items = await listItinerariesFromDb();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load itineraries.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { items?: Itinerary[] };
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ message: "Expected { items: Itinerary[] }." }, { status: 400 });
    }
    await replaceItinerariesInDb(body.items);
    return NextResponse.json({ ok: true, count: body.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save itineraries.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
