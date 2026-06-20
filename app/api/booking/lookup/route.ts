import { NextResponse } from "next/server";
import type { LookupBookingRequest } from "@/types/domain";
import { handleBookingLookup } from "@/lib/server/booking-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LookupBookingRequest;
    const booking = await handleBookingLookup(body);
    return NextResponse.json(booking);
  } catch {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}
