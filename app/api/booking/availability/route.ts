import { NextResponse } from "next/server";
import type { AvailabilityRequest } from "@/types/domain";
import {
  handleBookingAvailability,
  VehicleUnavailableError,
} from "@/lib/server/booking-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AvailabilityRequest;
    const result = await handleBookingAvailability(body);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof VehicleUnavailableError) {
      return NextResponse.json({ message: err.message }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : "Availability lookup failed.";
    return NextResponse.json({ message }, { status: 502 });
  }
}
