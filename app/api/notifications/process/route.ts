import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { dispatchNotificationJob } from "@/lib/server/notification-provider";

function isAuthorized(request: Request): boolean {
  const secret = process.env.NOTIFICATION_CRON_SECRET?.trim();
  if (!secret) return true;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Outbox worker endpoint.
 * Intended for scheduled invocation from Vercel Cron or another queue runner.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("notification_outbox")
    .select("id, booking_reference, channel, template, recipient, payload, attempt_count")
    .eq("status", "pending")
    .lte("scheduled_for", nowIso)
    .limit(25);
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });

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
      await supabase.from("notification_logs").insert({
        outbox_id: job.id,
        booking_reference: job.booking_reference,
        channel: job.channel,
        status: "failed",
        provider_response: {},
        error_message:
          sendError instanceof Error ? sendError.message : "Unknown notification error",
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

  return NextResponse.json({ processed: (data ?? []).length });
}
