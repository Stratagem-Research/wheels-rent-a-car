import { NextResponse } from "next/server";
import { listTripsFromDb, replaceTripsInDb } from "@/lib/supabase/cms-repository";
import type { Trip } from "@/types/domain";

export async function GET() {
  try {
    const items = await listTripsFromDb();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load trips.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { items?: Trip[] };
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ message: "Expected { items: Trip[] }." }, { status: 400 });
    }
    await replaceTripsInDb(body.items);
    return NextResponse.json({ ok: true, count: body.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save trips.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
