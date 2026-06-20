import { NextResponse } from "next/server";
import { handleBookingRate } from "@/lib/server/booking-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      vehicleId: string;
      rateType: "best-price" | "flexible";
      mileage: "capped-200km" | "unlimited";
      pickup: string;
      return: string;
    };
    const result = await handleBookingRate(body);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "Vehicle not found") {
      return NextResponse.json({ message: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Rate lookup failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
