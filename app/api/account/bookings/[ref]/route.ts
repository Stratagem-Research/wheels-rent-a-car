import { NextResponse } from "next/server";
import { requireAccountUser } from "@/lib/server/account-auth";
import { handleBookingLookup } from "@/lib/server/booking-service";
import { userOwnsBooking } from "@/lib/supabase/user-bookings-repository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ ref: string }> },
) {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;

  try {
    const { ref } = await context.params;
    const owns = await userOwnsBooking(auth.supabase, auth.user.id, ref);
    const email = auth.user.email ?? "";
    if (!owns && !email) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    const booking = await handleBookingLookup({ ref, email });
    if (!owns && booking.driver.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }
    return NextResponse.json(booking);
  } catch {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
}
