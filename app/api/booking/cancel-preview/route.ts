import { NextResponse } from "next/server";
import { handleBookingCancelPreview } from "@/lib/server/booking-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { ref: string };
    const result = await handleBookingCancelPreview(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cancel preview failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
