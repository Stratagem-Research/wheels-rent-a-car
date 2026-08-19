import { WheelsThrottledError } from "@/lib/api/wheels-public";
import { LOOKUP_PLACEHOLDER_IMAGE, toBookingFromLookup } from "@/lib/booking/lookup-adapter";
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
  /** True when Wizard itself is rate-limiting us right now — the caller should
   *  stop issuing further live lookups this request rather than piling on
   *  more 429s, and the client can tell live status apart from a local stub. */
  throttled: boolean;
};

export type ResolveAccountBookingOptions = {
  /** List pages should skip token fallback (second Wizard call per row). */
  allowTokenFallback?: boolean;
  /** After a 429, remaining rows should not hit Wizard again this request. */
  skipLiveLookup?: boolean;
};

function wizardIdFromRow(row: UserBookingRow): number | null {
  if (row.wizardVehicleId != null && row.wizardVehicleId > 0) return row.wizardVehicleId;
  return parseWizardVehicleId(row.frontendVehicleId ?? "");
}

/** Local Booking from `user_bookings` when Wizard lookup is unavailable. */
export async function bookingFromLinkedRow(
  row: UserBookingRow,
  authEmail: string,
): Promise<Booking> {
  const wizardId = wizardIdFromRow(row);
  const vehicleId =
    row.frontendVehicleId ??
    (wizardId != null ? frontendVehicleIdFromWizard(wizardId) : row.bookingReference);
  const pickup = row.pickupAt ?? row.createdAt;
  const returnAt = row.returnAt ?? row.pickupAt ?? row.createdAt;
  const booking: Booking = {
    ref: row.bookingReference,
    state: "pending",
    createdAt: row.createdAt,
    pickup: {
      type: "branch",
      datetime: pickup,
      locationId: "br-hazmieh",
    },
    return: {
      datetime: returnAt,
      locationId: "br-hazmieh",
    },
    vehicle: {
      vehicleId,
      rate: { type: "best-price", mileage: "capped-200km" },
    },
    vehicleSnapshot: {
      id: vehicleId,
      slug: vehicleId,
      make: "Vehicle",
      model: "",
      year: new Date().getFullYear(),
      category: "economy",
      images: [{ ...LOOKUP_PLACEHOLDER_IMAGE }],
    },
    extras: [],
    protectionTierId: "pt-basic",
    driver: {
      firstName: "",
      lastName: "",
      email: row.customerEmail ?? authEmail,
      phone: "",
      dob: "",
      licenceNumber: "",
      licenceIssue: "",
      licenceExpiry: "",
      country: "LB",
    },
    paymentMethod: "cash",
    marketingConsent: false,
    whatsappOptIn: false,
    price: {
      baseRateCents: 0,
      extrasCents: 0,
      protectionCents: 0,
      taxesCents: 0,
      feesCents: 0,
      discountCents: 0,
      totalCents: 0,
      depositCents: 0,
    },
    currency: "USD",
    publicToken: row.publicToken ?? undefined,
  };
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

  if (options.skipLiveLookup) {
    return { booking: await bookingFromLinkedRow(row, authEmail), throttled: false };
  }

  for (const email of uniqueEmails(row.customerEmail, authEmail)) {
    try {
      return { booking: await handleBookingLookup({ ref: row.bookingReference, email }), throttled: false };
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
        return { booking: await hydrateLookupVehicle(booking, status.vehicle.id), throttled: false };
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
