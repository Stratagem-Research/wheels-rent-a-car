import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildBookingConfirmationPayload,
  enqueueBookingConfirmationOnce,
  isApprovalStatus,
  isInventoryReleaseStatus,
} from "@/lib/server/booking-confirmation";
import { appendBookingState } from "@/lib/server/payment-events";
import { deleteVehicleBookingHold } from "@/lib/supabase/vehicle-booking-holds-repository";
import { findIndexedBookingByReference } from "@/lib/supabase/user-bookings-repository";

const BodySchema = z.object({
  booking_reference: z.string().min(1),
  status: z.string().min(1),
  customer_email: z.string().email(),
  vehicle: z.string().optional(),
});

function getExpectedBearer(): string | null {
  const token =
    process.env.WHEELS_INTERNAL_API_TOKEN?.trim() ||
    process.env.WIZARD_API_TOKEN?.trim() ||
    "";
  if (!token || token.startsWith("replace-with")) return null;
  return token;
}

function authorize(request: Request): boolean {
  const expected = getExpectedBearer();
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return Boolean(match && match[1] === expected);
}

/**
 * Inbound Wizard → website status webhook.
 * Approval: enqueue confirmation email once.
 * Cancel/reject: drop the inventory hold so the car counts as available again.
 */
export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid payload.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { booking_reference, status, customer_email, vehicle } = parsed.data;

  if (isInventoryReleaseStatus(status)) {
    try {
      await deleteVehicleBookingHold(booking_reference);
      await appendBookingState(booking_reference, "cancelled", {
        source: "wizard",
        status,
      }).catch(() => undefined);
      return NextResponse.json({
        ok: true,
        confirmationEnqueued: false,
        holdReleased: true,
        reason: "hold_released",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to release hold.";
      return NextResponse.json({ message }, { status: 500 });
    }
  }

  if (!isApprovalStatus(status)) {
    return NextResponse.json({
      ok: true,
      confirmationEnqueued: false,
      holdReleased: false,
      reason: "status_not_approval",
    });
  }

  try {
    // Best-effort: pull the stored booking (dates, extras, protection tier,
    // price, driver, location) so the confirmation email is fully populated,
    // not just a bare reference + vehicle name. Falls back to the minimal
    // payload if the row isn't indexed yet for some reason — the email
    // still sends, just without the rich details.
    const row = await findIndexedBookingByReference(booking_reference).catch(() => null);
    const richPayload = row
      ? await buildBookingConfirmationPayload(row, customer_email).catch(() => null)
      : null;

    const result = await enqueueBookingConfirmationOnce({
      bookingReference: booking_reference,
      recipient: customer_email,
      vehicle,
      payload: { state: status, ...richPayload },
    });
    return NextResponse.json({
      ok: true,
      confirmationEnqueued: result.enqueued,
      holdReleased: false,
      reason: result.enqueued ? "enqueued" : "already_sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to enqueue confirmation.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
