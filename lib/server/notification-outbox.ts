import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { dispatchNotificationJob } from "@/lib/server/notification-provider";

/**
 * Drain pending rows from `notification_outbox`.
 * Used by the cron worker and immediate post-enqueue dispatch so local/dev
 * does not wait 5 minutes for Vercel Cron.
 */
export async function processPendingNotifications(options?: {
  limit?: number;
}): Promise<{ processed: number }> {
  const supabase = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const limit = options?.limit ?? 25;
  const { data, error } = await supabase
    .from("notification_outbox")
    .select("id, booking_reference, channel, template, recipient, payload, attempt_count")
    .eq("status", "pending")
    .lte("scheduled_for", nowIso)
    .limit(limit);
  if (error) throw error;

  for (const job of data ?? []) {
    try {
      const result = await dispatchNotificationJob({
        channel: job.channel,
        template: job.template,
        recipient: job.recipient,
        payload: job.payload,
      });

      if (result.provider === "skipped" && job.channel === "whatsapp") {
        await dispatchNotificationJob({
          channel: "email",
          template: job.template,
          recipient: job.recipient,
          payload: job.payload,
        });
      }

      await supabase.from("notification_logs").insert({
        outbox_id: job.id,
        booking_reference: job.booking_reference,
        channel: job.channel,
        status: "sent",
        provider_response: {
          template: job.template,
          recipient: job.recipient,
          payload: job.payload,
          dispatch: result,
        },
      });
      await supabase
        .from("notification_outbox")
        .update({
          status: "sent",
          attempt_count: (job.attempt_count ?? 0) + 1,
          processed_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    } catch (sendError) {
      const message =
        sendError instanceof Error ? sendError.message : "Unknown notification error";
      console.error("[notification-outbox] send failed", {
        id: job.id,
        template: job.template,
        recipient: job.recipient,
        error: message,
      });
      await supabase.from("notification_logs").insert({
        outbox_id: job.id,
        booking_reference: job.booking_reference,
        channel: job.channel,
        status: "failed",
        provider_response: {},
        error_message: message,
      });
      await supabase
        .from("notification_outbox")
        .update({
          status: "pending",
          attempt_count: (job.attempt_count ?? 0) + 1,
        })
        .eq("id", job.id);
    }
  }

  return { processed: (data ?? []).length };
}
