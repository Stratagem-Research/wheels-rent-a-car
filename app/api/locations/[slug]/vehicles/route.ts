import { NextResponse } from "next/server";
import { getLocationVehicles } from "@/lib/server/vehicles-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const items = await getLocationVehicles(slug);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load vehicles.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
