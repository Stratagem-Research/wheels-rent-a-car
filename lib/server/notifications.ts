import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { processPendingNotifications } from "@/lib/server/notification-outbox";

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
 *
 * After insert, drains due pending rows immediately so mail is not stuck
 * waiting for the 5-minute Vercel cron (which never runs in local `pnpm dev`).
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

  // Best-effort immediate deliver; cron retries any row left pending.
  await processPendingNotifications({ limit: 25 }).catch((err) => {
    console.error("[notifications] immediate outbox drain failed", err);
  });
}
