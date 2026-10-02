import { NextResponse } from "next/server";
import { z } from "zod";
import { handleBookingCancelPreview } from "@/lib/server/booking-service";
import { guardBookingLookup, isLookupMiss } from "@/lib/server/booking-lookup-guard";

const CancelPreviewSchema = z.object({
  ref: z.string().min(1),
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CancelPreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid cancel preview payload." }, { status: 400 });
  }
  const guard = guardBookingLookup(request, parsed.data);
  if (guard.blocked) return guard.blocked;

  try {
    const result = await handleBookingCancelPreview(parsed.data);
    guard.succeed();
    return NextResponse.json(result);
  } catch (error) {
    if (isLookupMiss(error)) guard.fail();
    return NextResponse.json({ message: "Booking not found." }, { status: 404 });
  }
}
