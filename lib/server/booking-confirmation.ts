import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { enqueueNotification } from "@/lib/server/notifications";

const APPROVAL_STATUSES = new Set(["approved", "confirmed"]);

export function isApprovalStatus(status: string): boolean {
  return APPROVAL_STATUSES.has(status.trim().toLowerCase());
}

/**
 * Enqueue formal booking_confirmation once per booking reference (idempotent).
 * Returns whether a new outbox row was created.
 */
export async function enqueueBookingConfirmationOnce(input: {
  bookingReference: string;
  recipient: string;
  vehicle?: string;
  payload?: Record<string, unknown>;
}): Promise<{ enqueued: boolean }> {
  const ref = input.bookingReference.trim();
  const recipient = input.recipient.trim();
  if (!ref || !recipient) {
    throw new Error("booking_reference and customer_email are required.");
  }

  const supabase = getSupabaseAdminClient();
  const { data: existing, error: lookupError } = await supabase
    .from("notification_outbox")
    .select("id")
    .eq("booking_reference", ref)
    .eq("template", "booking_confirmation")
    .limit(1)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return { enqueued: false };

  await enqueueNotification({
    bookingReference: ref,
    channel: "email",
    template: "booking_confirmation",
    recipient,
    payload: {
      ref,
      vehicle: input.vehicle ?? "",
      ...input.payload,
    },
  });

  return { enqueued: true };
}
