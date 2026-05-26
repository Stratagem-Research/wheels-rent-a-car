import type { BookingDraft, BookingPriceBreakdown } from "@/types/domain";
import {
  computePrice as sharedComputePrice,
  generateBookingRef as sharedGenerateBookingRef,
  perDayRate,
  rentalDays,
} from "@/lib/booking/pricing";
import { ADD_ONS, PROTECTION_TIERS } from "./fixtures/catalog";
import { VEHICLES } from "./fixtures/vehicles";

/**
 * MSW pricing wrappers — bind the shared engine to the mock fixtures so the
 * handlers can call `computePrice(draft)` without re-passing catalog data.
 */
export { perDayRate, rentalDays };

export function computePrice(draft: BookingDraft): BookingPriceBreakdown {
  const vehicle = draft.vehicle
    ? VEHICLES.find((v) => v.id === draft.vehicle?.vehicleId)
    : undefined;
  return sharedComputePrice({
    draft,
    vehicle,
    addOns: ADD_ONS,
    tiers: PROTECTION_TIERS,
  });
}

export const generateBookingRef = sharedGenerateBookingRef;
