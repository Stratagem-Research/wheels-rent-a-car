import { NextResponse } from "next/server";
import { z } from "zod";
import { storedBookingFromDomain } from "@/lib/booking/stored-booking";
import { requireAccountUser } from "@/lib/server/account-auth";
import { handleBookingLookup } from "@/lib/server/booking-service";
import { addUserBooking } from "@/lib/supabase/user-bookings-repository";
import { BOOKING_REF_PATTERN } from "@/types/domain";

const LinkBodySchema = z.object({
  ref: z.string().regex(BOOKING_REF_PATTERN),
  email: z.string().email().optional(),
});

/** Attach an existing Wizard booking to the signed-in account (e.g. after a 502 dropped the link). */
export async function POST(request: Request) {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;

  try {
    const body = LinkBodySchema.parse(await request.json());
    const lookupEmail = body.email ?? auth.user.email ?? "";
    if (!lookupEmail) {
      return NextResponse.json({ message: "Email is required." }, { status: 400 });
    }

    const booking = await handleBookingLookup({ ref: body.ref, email: lookupEmail });

    await addUserBooking({
      userId: auth.user.id,
      bookingReference: booking.ref,
      publicToken: booking.publicToken,
      customerEmail: booking.driver.email,
      wizardBookingId: null,
      pickupAt: booking.pickup.datetime,
      returnAt: booking.return.datetime,
      frontendVehicleId: booking.vehicle.vehicleId,
      wizardVehicleId: null,
      ...storedBookingFromDomain(booking),
    });

    return NextResponse.json({ linked: true, ref: booking.ref });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid request." }, { status: 400 });
    }
    return NextResponse.json({ message: "Booking not found." }, { status: 404 });
  }
}
