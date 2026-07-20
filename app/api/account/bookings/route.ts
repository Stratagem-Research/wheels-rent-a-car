import { NextResponse } from "next/server";
import { resolveAccountBooking } from "@/lib/server/account-bookings";
import { requireAccountUser } from "@/lib/server/account-auth";
import { listUserBookings } from "@/lib/supabase/user-bookings-repository";

export async function GET() {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;

  try {
    const authEmail = auth.user.email ?? "";
    const rows = await listUserBookings(auth.supabase, auth.user.id);

    if (process.env.NODE_ENV !== "production" && rows.length === 0) {
      console.info("[account-bookings] no user_bookings rows for user", auth.user.id);
    }

    const bookings = await Promise.all(
      rows.map((row) => resolveAccountBooking(row, authEmail)),
    );

    const items = bookings.filter((b): b is NonNullable<typeof b> => Boolean(b));

    if (process.env.NODE_ENV !== "production" && rows.length > items.length) {
      console.warn("[account-bookings] dropped rows after Wizard lookup", {
        linked: rows.length,
        resolved: items.length,
        refs: rows.map((r) => r.bookingReference),
      });
    }

    return NextResponse.json({ items, total: items.length });
  } catch {
    return NextResponse.json({ message: "Failed to load bookings." }, { status: 500 });
  }
}
