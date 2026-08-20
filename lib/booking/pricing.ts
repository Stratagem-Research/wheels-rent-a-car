import { differenceInCalendarDays, parseISO } from "date-fns";
import { isFrontendLocalDatetime } from "@/lib/api/wheels-public/datetime";
import type {
  AddOn,
  BookingDraft,
  BookingPriceBreakdown,
  Branch,
  Cents,
  DeliveryPricingSettings,
  MileagePlan,
  ProtectionTier,
  RateType,
  Vehicle,
} from "@/types/domain";
import { promoDiscountCents } from "./promo";
import { computeDeliveryFeeCents } from "./delivery-pricing";

/**
 * Client + server shared pricing engine.
 *
 * The booking flow uses this for an instant preview on every toggle (per
 * 04_booking_flow.md step 2); `/api/booking/quote` remains authoritative.
 *
 * Keep this approximation aligned with the backend pricing contract.
 */

const TAX_RATE = 0.11;
/** Adam Q8: online booking max 3 months (~92 days). */
export const MAX_ONLINE_RENTAL_DAYS = 92;
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

export function isWithinOnlineBookingWindow(pickupISO: string, returnISO: string): boolean {
  const days = rentalDays(pickupISO, returnISO);
  return days >= 1 && days <= MAX_ONLINE_RENTAL_DAYS;
}

/** Calendar dates from SearchBar datetimes (`YYYY-MM-DDTHH:mm`, Beirut wall clock). */
function calendarDateFromDraftDatetime(value: string): Date | null {
  if (!isFrontendLocalDatetime(value)) return null;
  const parts = value.slice(0, 10).split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, mo, d] = parts as [number, number, number];
  return new Date(y, mo - 1, d);
}

export function rentalDays(pickupISO: string, returnISO: string): number {
  try {
    const pickupCal = calendarDateFromDraftDatetime(pickupISO);
    const returnCal = calendarDateFromDraftDatetime(returnISO);
    if (pickupCal && returnCal) {
      return Math.max(1, differenceInCalendarDays(returnCal, pickupCal));
    }
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
  /** Website-validated promo discount percent (0–100). */
  promoDiscountPercent?: number;
  /** Used to measure delivery distance from the nearest branch. */
  branches?: Branch[];
  /** Admin-editable delivery-fee formula; falls back to seed defaults. */
  deliveryPricing?: DeliveryPricingSettings;
}

export function computePrice({
  draft,
  vehicle,
  addOns,
  tiers,
  promoDiscountPercent = 0,
  branches = [],
  deliveryPricing,
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

  const deliveryCents =
    draft.pickup.type === "address-delivery"
      ? computeDeliveryFeeCents(draft.pickup, branches, deliveryPricing)
      : 0;
  const subtotal = baseRateCents + extrasCents + protectionCents + deliveryCents;
  const taxesCents = Math.round(subtotal * TAX_RATE);
  const feesCents = deliveryCents;

  const discountCents =
    draft.promoCode && promoDiscountPercent > 0
      ? promoDiscountCents(subtotal, promoDiscountPercent)
      : 0;
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
