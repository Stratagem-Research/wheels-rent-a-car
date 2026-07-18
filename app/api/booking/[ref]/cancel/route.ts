import { NextResponse } from "next/server";
import { z } from "zod";
import {
  BookingNotCancellableError,
  CancelRequestSyncError,
  handleBookingCancelRequest,
} from "@/lib/server/booking-service";

const CancelRequestSchema = z.object({
  email: z.string().email(),
});

/**
 * Customer cancellation request. Auth is ref + matching email (verified via
 * the Wizard lookup); any mismatch returns a generic 404. The booking is NOT
 * cancelled here — a `cancel_request` sync is sent to the Wizard for internal
 * review, per the system-boundary agreement.
 */
export async function POST(request: Request, context: { params: Promise<{ ref: string }> }) {
  const { ref } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = CancelRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid cancellation payload." }, { status: 400 });
  }

  try {
    const result = await handleBookingCancelRequest({ ref, email: parsed.data.email });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof BookingNotCancellableError) {
      return NextResponse.json(
        { message: "This booking can no longer be cancelled." },
        { status: 409 },
      );
    }
    if (err instanceof CancelRequestSyncError) {
      return NextResponse.json(
        { message: "Couldn't submit the cancellation request. Please try again." },
        { status: 502 },
      );
    }
    // Lookup mismatch and unknown refs both land here — keep it generic so
    // booking references can't be enumerated.
    return NextResponse.json({ message: "Booking not found." }, { status: 404 });
  }
}
