import { NextResponse } from "next/server";
import { getVehicleBySlug } from "@/lib/server/vehicles-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const vehicle = await getVehicleBySlug(slug);
    if (!vehicle) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(vehicle);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load vehicle.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
