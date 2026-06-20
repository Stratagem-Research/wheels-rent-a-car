import { NextResponse } from "next/server";
import { getFeaturedVehicles } from "@/lib/server/vehicles-service";

export async function GET() {
  try {
    const items = await getFeaturedVehicles(8);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load featured vehicles.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
