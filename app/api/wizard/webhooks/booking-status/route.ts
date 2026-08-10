import { NextResponse } from "next/server";
import { z } from "zod";
import {
  enqueueBookingConfirmationOnce,
  isApprovalStatus,
} from "@/lib/server/booking-confirmation";

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
 * On first approved/confirmed status, enqueues customer booking_confirmation email.
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

  if (!isApprovalStatus(status)) {
    return NextResponse.json({
      ok: true,
      confirmationEnqueued: false,
      reason: "status_not_approval",
    });
  }

  try {
    const result = await enqueueBookingConfirmationOnce({
      bookingReference: booking_reference,
      recipient: customer_email,
      vehicle,
      payload: { state: status },
    });
    return NextResponse.json({
      ok: true,
      confirmationEnqueued: result.enqueued,
      reason: result.enqueued ? "enqueued" : "already_sent",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to enqueue confirmation.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
