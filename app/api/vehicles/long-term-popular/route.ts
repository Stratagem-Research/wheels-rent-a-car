import { NextResponse } from "next/server";
import { getLongTermPopularVehicles } from "@/lib/server/vehicles-service";

export async function GET() {
  try {
    const items = await getLongTermPopularVehicles();
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load vehicles.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
