import { NextResponse } from "next/server";
import { requireAccountUser } from "@/lib/server/account-auth";
import {
  getMockBookingsForEmail,
  handleBookingLookup,
} from "@/lib/server/booking-service";
import { listUserBookings } from "@/lib/supabase/user-bookings-repository";

export async function GET() {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;

  try {
    const email = auth.user.email ?? "";
    const rows = await listUserBookings(auth.supabase, auth.user.id);
    const bookings = await Promise.all(
      rows.map(async (row) => {
        try {
          return await handleBookingLookup({ ref: row.bookingReference, email });
        } catch {
          return null;
        }
      }),
    );

    let items = bookings.filter((b): b is NonNullable<typeof b> => Boolean(b));

    if (items.length === 0 && email) {
      items = getMockBookingsForEmail(email);
    }

    return NextResponse.json({ items, total: items.length });
  } catch {
    return NextResponse.json({ message: "Failed to load bookings." }, { status: 500 });
  }
}
