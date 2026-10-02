import { NextResponse } from "next/server";
import { z } from "zod";
import { handleBookingLookup } from "@/lib/server/booking-service";
import { guardBookingLookup, isLookupMiss } from "@/lib/server/booking-lookup-guard";

const LookupSchema = z.object({
  ref: z.string().trim().min(1),
  email: z.string().trim().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = LookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid lookup payload." }, { status: 400 });
  }

  const guard = guardBookingLookup(request, parsed.data);
  if (guard.blocked) return guard.blocked;

  try {
    const booking = await handleBookingLookup(parsed.data);
    guard.succeed();
    return NextResponse.json(booking);
  } catch (error) {
    if (isLookupMiss(error)) guard.fail();
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}
