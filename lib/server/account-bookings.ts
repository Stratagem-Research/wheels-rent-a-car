import { toBookingFromLookup } from "@/lib/booking/lookup-adapter";
import {
  handleBookingLookup,
  handleBookingStatusByToken,
} from "@/lib/server/booking-service";
import type { UserBookingRow } from "@/lib/supabase/user-bookings-repository";
import type { Booking } from "@/types/domain";

function uniqueEmails(...candidates: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const candidate of candidates) {
    const email = candidate?.trim();
    if (!email) continue;
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(email);
  }
  return out;
}

/** Hydrate a linked user_bookings row into a full Booking for the account UI. */
export async function resolveAccountBooking(
  row: UserBookingRow,
  authEmail: string,
): Promise<Booking | null> {
  for (const email of uniqueEmails(row.customerEmail, authEmail)) {
    try {
      return await handleBookingLookup({ ref: row.bookingReference, email });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[account-bookings] lookup failed", {
          ref: row.bookingReference,
          email,
          err,
        });
      }
    }
  }

  if (!row.publicToken) return null;

  try {
    const status = await handleBookingStatusByToken(row.publicToken);
    if (!status.customer) return null;
    return toBookingFromLookup({
      reference: status.reference,
      status: status.status,
      start_date_time: status.start_date_time,
      end_date_time: status.end_date_time,
      customer: status.customer,
      vehicle: status.vehicle,
      amount: status.amount,
    });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[account-bookings] status-by-token failed", {
        ref: row.bookingReference,
        err,
      });
    }
    return null;
  }
}
