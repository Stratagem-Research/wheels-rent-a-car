import { NextResponse } from "next/server";
import type { BookingDraft } from "@/types/domain";
import { handleVerifyVehicleAvailability } from "@/lib/server/booking-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      vehicleId: string;
      pickup: BookingDraft["pickup"];
      return: BookingDraft["return"];
    };
    if (!body.vehicleId?.trim() || !body.pickup?.datetime || !body.return?.datetime) {
      return NextResponse.json({ message: "vehicleId, pickup, and return are required." }, { status: 400 });
    }
    const result = await handleVerifyVehicleAvailability(body);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.message.includes("3 months")) {
      return NextResponse.json({ message: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Availability check failed.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
