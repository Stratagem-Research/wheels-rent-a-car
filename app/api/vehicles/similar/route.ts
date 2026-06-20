import { NextResponse } from "next/server";
import { getSimilarVehicles } from "@/lib/server/vehicles-service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug") ?? "";
    const items = await getSimilarVehicles(slug);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load similar vehicles.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
