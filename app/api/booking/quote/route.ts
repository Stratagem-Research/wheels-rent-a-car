import { NextResponse } from "next/server";
import type { QuoteRequest } from "@/types/domain";
import { handleBookingQuote } from "@/lib/server/booking-service";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuoteRequest;
    const result = await handleBookingQuote(body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Quote failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
