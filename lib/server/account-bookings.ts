import { WheelsThrottledError } from "@/lib/api/wheels-public";
import { LOOKUP_PLACEHOLDER_IMAGE, toBookingFromLookup } from "@/lib/booking/lookup-adapter";
import {
  bookingFromStoredRow,
  hasStoredBookingDetails,
} from "@/lib/booking/stored-booking";
import {
  frontendVehicleIdFromWizard,
  parseWizardVehicleId,
} from "@/lib/booking/wizard-vehicle-id";
import {
  handleBookingLookup,
  handleBookingStatusByToken,
  hydrateLookupVehicle,
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

export type AccountBookingResolution = {
  booking: Booking;
  throttled: boolean;
};

export type ResolveAccountBookingOptions = {
  allowTokenFallback?: boolean;
  skipLiveLookup?: boolean;
};

function wizardIdFromRow(row: UserBookingRow): number | null {
  if (row.wizardVehicleId != null && row.wizardVehicleId > 0) return row.wizardVehicleId;
  return parseWizardVehicleId(row.frontendVehicleId ?? "");
}

/** Local Booking from `user_bookings` columns when Wizard lookup is unavailable. */
export async function bookingFromLinkedRow(
  row: UserBookingRow,
  authEmail: string,
): Promise<Booking> {
  const booking = bookingFromStoredRow(row, authEmail);
  if (booking.vehicleSnapshot.images.length === 0) {
    booking.vehicleSnapshot.images = [{ ...LOOKUP_PLACEHOLDER_IMAGE }];
  }
  if (hasStoredBookingDetails(row)) return booking;
  const wizardId = wizardIdFromRow(row);
  if (wizardId == null) return booking;
  return hydrateLookupVehicle(booking, wizardId);
}

/** Hydrate a linked user_bookings row into a Booking for the account UI. */
export async function resolveAccountBooking(
  row: UserBookingRow,
  authEmail: string,
  options: ResolveAccountBookingOptions = {},
): Promise<AccountBookingResolution> {
  const allowTokenFallback = options.allowTokenFallback ?? true;
  const stored = hasStoredBookingDetails(row);

  if (options.skipLiveLookup) {
    return { booking: await bookingFromLinkedRow(row, authEmail), throttled: false };
  }

  if (stored && !row.publicToken) {
    return { booking: await bookingFromLinkedRow(row, authEmail), throttled: false };
  }

  const local = stored ? await bookingFromLinkedRow(row, authEmail) : null;

  for (const email of uniqueEmails(row.customerEmail, authEmail)) {
    try {
      const live = await handleBookingLookup({ ref: row.bookingReference, email });
      return {
        booking: local
          ? { ...local, state: live.state, publicToken: live.publicToken ?? local.publicToken }
          : live,
        throttled: false,
      };
    } catch (err) {
      if (err instanceof WheelsThrottledError) {
        return { booking: await bookingFromLinkedRow(row, authEmail), throttled: true };
      }
      if (process.env.NODE_ENV !== "production") {
        console.warn("[account-bookings] lookup failed", {
          ref: row.bookingReference,
          email,
          err,
        });
      }
    }
  }

  if (allowTokenFallback && row.publicToken) {
    try {
      const status = await handleBookingStatusByToken(row.publicToken);
      if (status.customer) {
        const booking = toBookingFromLookup({
          reference: status.reference,
          status: status.status,
          start_date_time: status.start_date_time,
          end_date_time: status.end_date_time,
          customer: status.customer,
          vehicle: status.vehicle,
          amount: status.amount,
        });
        return {
          booking: local
            ? { ...local, state: booking.state, publicToken: local.publicToken ?? row.publicToken ?? undefined }
            : await hydrateLookupVehicle(booking, status.vehicle.id),
          throttled: false,
        };
      }
    } catch (err) {
      if (err instanceof WheelsThrottledError) {
        return { booking: await bookingFromLinkedRow(row, authEmail), throttled: true };
      }
      if (process.env.NODE_ENV !== "production") {
        console.warn("[account-bookings] status-by-token failed", {
          ref: row.bookingReference,
          err,
        });
      }
    }
  }

  return { booking: await bookingFromLinkedRow(row, authEmail), throttled: false };
}
