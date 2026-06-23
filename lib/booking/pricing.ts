import { differenceInCalendarDays, parseISO } from "date-fns";
import type {
  AddOn,
  BookingDraft,
  BookingPriceBreakdown,
  Cents,
  MileagePlan,
  ProtectionTier,
  RateType,
  Vehicle,
} from "@/types/domain";

/**
 * Client + server shared pricing engine.
 *
 * Lives here (not in /lib/api/mocks) so:
 *   - The booking flow recomputes the running total locally on every toggle
 *     (instant UI feedback per 04_booking_flow.md step 2: "right panel
 *     updates within 200ms of any toggle").
 *   - The MSW pricing handler re-exports the same functions so mock + client
 *     totals match exactly.
 *
 * When real backend lands: the source-of-truth `/api/booking/quote` will
 * still be authoritative, and the client uses these functions as a
 * preview-only approximation.
 */

const TAX_RATE = 0.11;
const DELIVERY_FEE_CENTS = 1500;
const FLEXIBLE_MULTIPLIER = 1.15;
const UNLIMITED_MULTIPLIER = 1.1;
const DEPOSIT_BY_CATEGORY: Record<string, Cents> = {
  economy: 30_000,
  compact: 35_000,
  sedan: 50_000,
  suv: 75_000,
  "4x4": 75_000,
  "7-seater": 75_000,
  luxury: 150_000,
  convertible: 100_000,
};

export function rentalDays(pickupISO: string, returnISO: string): number {
  try {
    return Math.max(1, differenceInCalendarDays(parseISO(returnISO), parseISO(pickupISO)));
  } catch {
    return 1;
  }
}

export function perDayRate(vehicle: Vehicle, rateType: RateType, mileage: MileagePlan): Cents {
  let cents = vehicle.dailyRateFromCents;
  if (rateType === "flexible") cents = Math.round(cents * FLEXIBLE_MULTIPLIER);
  if (mileage === "unlimited") cents = Math.round(cents * UNLIMITED_MULTIPLIER);
  return cents;
}

export interface ComputePriceInputs {
  draft: BookingDraft;
  vehicle?: Vehicle;
  addOns: AddOn[];
  tiers: ProtectionTier[];
}

export function computePrice({
  draft,
  vehicle,
  addOns,
  tiers,
}: ComputePriceInputs): BookingPriceBreakdown {
  if (!vehicle || !draft.vehicle) return emptyBreakdown();

  const days = rentalDays(draft.pickup.datetime, draft.return.datetime);
  const perDay = perDayRate(vehicle, draft.vehicle.rate.type, draft.vehicle.rate.mileage);
  const baseRateCents = perDay * days;

  const extrasCents = draft.extras.reduce((sum, e) => {
    const ao = addOns.find((a) => a.id === e.addOnId);
    if (!ao) return sum;
    const unit = ao.pricing === "per-day" ? ao.priceCents * days : ao.priceCents;
    return sum + unit * Math.max(1, e.qty);
  }, 0);

  const tier = tiers.find((t) => t.id === draft.protectionTierId);
  const protectionCents = (tier?.perDayCents ?? 0) * days;

  const deliveryCents = draft.pickup.type === "address-delivery" ? DELIVERY_FEE_CENTS : 0;
  const subtotal = baseRateCents + extrasCents + protectionCents + deliveryCents;
  const taxesCents = Math.round(subtotal * TAX_RATE);
  const feesCents = deliveryCents;

  const discountCents = draft.promoCode === "SUMMER15" ? Math.round(subtotal * 0.15) : 0;
  const totalCents = Math.max(0, subtotal + taxesCents - discountCents);
  const depositCents = DEPOSIT_BY_CATEGORY[vehicle.category] ?? 50_000;

  return {
    baseRateCents,
    extrasCents,
    protectionCents,
    taxesCents,
    feesCents,
    discountCents,
    totalCents,
    depositCents,
  };
}

export function emptyBreakdown(): BookingPriceBreakdown {
  return {
    baseRateCents: 0,
    extrasCents: 0,
    protectionCents: 0,
    taxesCents: 0,
    feesCents: 0,
    discountCents: 0,
    totalCents: 0,
    depositCents: 0,
  };
}

// Booking ref helpers now live in lib/booking/ref.ts. Re-exported here so
// existing imports keep working without touching consumers.
export { generateBookingRef } from "./ref";

/** Format cents → $XX or $XX.XX (suppresses .00 for clean displays). */
export function formatUsd(cents: Cents): string {
  const dollars = cents / 100;
  return dollars % 1 === 0 ? `$${dollars.toFixed(0)}` : `$${dollars.toFixed(2)}`;
}

/** Format whole LBP amounts (not cents). */
export function formatLbp(amount: number): string {
  return `${amount.toLocaleString("en-US")} LBP`;
}

export function formatMoney(
  amount: number,
  currency: "USD" | "LBP",
  options?: { isCents?: boolean },
): string {
  if (currency === "LBP") return formatLbp(amount);
  const cents = options?.isCents === false ? Math.round(amount * 100) : amount;
  return formatUsd(cents);
}
