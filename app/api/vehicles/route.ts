import { NextResponse } from "next/server";
import { listVehiclesFromQuery } from "@/lib/server/vehicles-service";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const result = await listVehiclesFromQuery(url.searchParams);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load vehicles.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
