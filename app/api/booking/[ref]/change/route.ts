import { NextResponse } from "next/server";
import { z } from "zod";
import {
  BookingNotCancellableError,
  ChangeRequestSyncError,
  handleBookingChangeRequest,
} from "@/lib/server/booking-service";
import { guardBookingLookup, isLookupMiss } from "@/lib/server/booking-lookup-guard";

const ChangeRequestSchema = z
  .object({
    email: z.string().email(),
    requestedPickupDatetime: z.string().min(1),
    requestedReturnDatetime: z.string().min(1),
    note: z.string().max(500).optional(),
  })
  .refine((data) => data.requestedReturnDatetime > data.requestedPickupDatetime, {
    message: "Return must be after pickup.",
    path: ["requestedReturnDatetime"],
  });

/**
 * Customer modification request. Auth is ref + matching email (verified via
 * the Wizard lookup); any mismatch returns a generic 404. The booking is NOT
 * modified here — a `change_request` sync is sent to the Wizard for internal
 * review, per the system-boundary agreement.
 */
export async function POST(request: Request, context: { params: Promise<{ ref: string }> }) {
  const { ref } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = ChangeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid change request payload." }, { status: 400 });
  }

  const guard = guardBookingLookup(request, { ref, email: parsed.data.email });
  if (guard.blocked) return guard.blocked;

  try {
    const result = await handleBookingChangeRequest({
      ref,
      email: parsed.data.email,
      requestedPickupDatetime: parsed.data.requestedPickupDatetime,
      requestedReturnDatetime: parsed.data.requestedReturnDatetime,
      note: parsed.data.note,
    });
    guard.succeed();
    return NextResponse.json(result);
  } catch (err) {
    // These two only happen after the ref + email matched, so they're not misses.
    if (err instanceof BookingNotCancellableError) {
      guard.succeed();
      return NextResponse.json(
        { message: "This booking can no longer be modified." },
        { status: 409 },
      );
    }
    if (err instanceof ChangeRequestSyncError) {
      guard.succeed();
      return NextResponse.json(
        { message: "Couldn't submit the change request. Please try again." },
        { status: 502 },
      );
    }
    if (isLookupMiss(err)) guard.fail();
    return NextResponse.json({ message: "Booking not found." }, { status: 404 });
  }
}
