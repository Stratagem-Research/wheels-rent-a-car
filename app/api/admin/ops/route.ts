import { NextResponse } from "next/server";
import {
  listBookingStateTimeline,
  listNotificationLogs,
  listNotificationOutbox,
  listPaymentEvents,
} from "@/lib/supabase/admin-repository";
import { requireAdminSession } from "@/lib/server/admin-api";

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const [paymentEvents, bookingTimeline, notificationOutbox, notificationLogs] = await Promise.all([
      listPaymentEvents(),
      listBookingStateTimeline(),
      listNotificationOutbox(),
      listNotificationLogs(),
    ]);
    return NextResponse.json({
      paymentEvents,
      bookingTimeline,
      notificationOutbox,
      notificationLogs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load ops data.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
