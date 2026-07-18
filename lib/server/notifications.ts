import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface EnqueueNotificationInput {
  bookingReference?: string;
  channel: "email" | "whatsapp";
  template: string;
  recipient: string;
  payload?: Record<string, unknown>;
  /** ISO timestamp; defaults to now (immediate dispatch). */
  scheduledFor?: string;
}

/**
 * Queue a customer-facing notification for the outbox worker
 * (`POST /api/notifications/process`). Customer email/WhatsApp messages are
 * website-owned per the Wizard system-boundary agreement — the Wizard only
 * handles internal ops notifications.
 */
export async function enqueueNotification(input: EnqueueNotificationInput): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("notification_outbox").insert({
    booking_reference: input.bookingReference ?? null,
    channel: input.channel,
    template: input.template,
    recipient: input.recipient,
    payload: input.payload ?? {},
    scheduled_for: input.scheduledFor ?? new Date().toISOString(),
  });
  if (error) throw error;
}
