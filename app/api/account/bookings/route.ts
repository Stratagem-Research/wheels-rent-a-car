import { NextResponse } from "next/server";
import { resolveAccountBooking } from "@/lib/server/account-bookings";
import { requireAccountUser } from "@/lib/server/account-auth";
import { listUserBookings } from "@/lib/supabase/user-bookings-repository";

/**
 * One live Wizard lookup per row, sequentially. A burst of lookup + token
 * calls is what trips Laravel's ThrottleRequests on booking-status/{token}.
 * After a 429 we stop hitting Wizard and show local stubs for remaining rows.
 */
export async function GET() {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;

  try {
    const authEmail = auth.user.email ?? "";
    const rows = await listUserBookings(auth.supabase, auth.user.id);

    if (process.env.NODE_ENV !== "production" && rows.length === 0) {
      console.info("[account-bookings] no user_bookings rows for user", auth.user.id);
    }

    const items = [];
    let throttled = false;

    for (const row of rows) {
      const resolution = await resolveAccountBooking(row, authEmail, {
        allowTokenFallback: false,
        skipLiveLookup: throttled,
      });
      if (resolution.throttled) throttled = true;
      items.push(resolution.booking);
    }

    return NextResponse.json({ items, total: items.length, throttled });
  } catch {
    return NextResponse.json({ message: "Failed to load bookings." }, { status: 500 });
  }
}
