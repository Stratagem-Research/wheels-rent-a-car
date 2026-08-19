import { NextResponse } from "next/server";
import { resolveAccountBooking } from "@/lib/server/account-bookings";
import { requireAccountUser } from "@/lib/server/account-auth";
import { handleBookingLookup } from "@/lib/server/booking-service";
import { getUserBookingRow, userOwnsBooking } from "@/lib/supabase/user-bookings-repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ ref: string }> },
) {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;

  try {
    const { ref } = await context.params;
    const authEmail = auth.user.email ?? "";
    const row = await getUserBookingRow(auth.supabase, auth.user.id, ref);

    if (row) {
      const { booking } = await resolveAccountBooking(row, authEmail);
      if (booking) return NextResponse.json(booking);
    }

    const owns = await userOwnsBooking(auth.supabase, auth.user.id, ref);
    if (!owns && !authEmail) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const booking = await handleBookingLookup({ ref, email: authEmail });
    if (!owns && booking.driver.email.toLowerCase() !== authEmail.toLowerCase()) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(booking);
  } catch {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}
