import { NextResponse } from "next/server";
import { processPendingNotifications } from "@/lib/server/notification-outbox";

function isAuthorized(request: Request): boolean {
  const secret = process.env.NOTIFICATION_CRON_SECRET?.trim();
  if (!secret) return true;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Outbox worker endpoint.
 * Intended for scheduled invocation from Vercel Cron or another queue runner.
 * Booking submit also drains the queue immediately after enqueue so local
 * environments (no cron) still deliver mail when SMTP is configured.
 */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await processPendingNotifications();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process notifications.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
