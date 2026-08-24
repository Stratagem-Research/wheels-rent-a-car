/**
 * Bridge between the Wheels public API shape (snake_case, dollars, Beirut
 * wall-clock datetimes, numeric ids) and the frontend's internal contract
 * (`types/domain.ts` — camelCase, integer cents, ISO-8601 UTC, opaque string
 * ids, `WRC-YYMMDD-XXXX` refs).
 *
 * Everything in this file is pure: no React, no DOM, no `Date.now()` unless
 * injected via `clock`.
 */

import type {
  AddOn,
  AvailableVehicle,
  Booking,
  BookingDraft,
  BookingPriceBreakdown,
  BookingRef,
  ProtectionTier,
  Rate,
  Vehicle,
} from "@/types/domain";
import { extraQtyLabel, addOnUnitPriceLabel } from "@/lib/booking/addons";
import { resolveWizardAddressForBooking } from "@/lib/booking/wizard-address-id";
import { fromBackendDateAndTime, fromBackendDateTime, toBackendDateTime } from "./datetime";
import type { BookingData, BookingRequestPayload, PublicVehicle } from "./schemas";
import { enrichVehicle, type EnrichVehicleOptions } from "./vehicle-enrichment";

const RATE_TYPES = ["best-price", "flexible"] as const;
const MILEAGE_PLANS = ["capped-200km", "unlimited"] as const;
const FLEXIBLE_MULTIPLIER = 1.15;

function optionalYmd(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
const UNLIMITED_MULTIPLIER = 1.1;

// ── Availability ──────────────────────────────────────────────────────────

/**
 * Convert the public `/availability` vehicle list into the
 * `AvailableVehicle[]` shape consumed by the booking funnel. The backend
 * exposes ONE pricing option per vehicle (currently always "standard"); we
 * synthesize the 2×2 matrix of rate types × mileage plans the UI expects by
 * applying the same multipliers the local pricing engine uses. The "best-
 * price / capped" row remains the backend's authoritative number; the
 * other three rows are decoration until the backend exposes real variants
 * (tracked in the gap doc).
 */
export function toInternalAvailableVehicles(
  publicVehicles: PublicVehicle[],
  enrichmentOptions?: EnrichVehicleOptions,
): AvailableVehicle[] {
  return publicVehicles.map((pv) => {
    const vehicle = enrichVehicle(pv, enrichmentOptions);
    const baseDailyCents = Math.round(pv.pricing.daily_price * 100);
    const days = Math.max(1, Math.trunc(pv.pricing.days));
    const rates = buildRateMatrix(baseDailyCents, days);

    return {
      vehicle: {
        ...vehicle,
        dailyRateFromCents: baseDailyCents,
      },
      rates,
    } satisfies AvailableVehicle;
  });
}

export function catalogVehicleToAvailable(vehicle: Vehicle, days: number): AvailableVehicle {
  const safeDays = Math.max(1, Math.trunc(days));
  return {
    vehicle,
    rates: buildRateMatrix(vehicle.dailyRateFromCents, safeDays),
  };
}

function buildRateMatrix(baseDailyCents: number, days: number): Rate[] {
  const out: Rate[] = [];
  for (const type of RATE_TYPES) {
    for (const mileage of MILEAGE_PLANS) {
      let cents = baseDailyCents;
      if (type === "flexible") cents = Math.round(cents * FLEXIBLE_MULTIPLIER);
      if (mileage === "unlimited") cents = Math.round(cents * UNLIMITED_MULTIPLIER);
      out.push({
        type,
        mileage,
        perDayCents: cents,
        totalCents: cents * days,
        nonRefundable: type === "best-price",
      });
    }
  }
  return out;
}

// ── Booking submit (frontend → backend) ──────────────────────────────────

export interface FromBookingDraftOptions {
  /**
   * Resolve the numeric backend vehicle id for the draft's selected
   * vehicle. Required — the frontend draft only carries the opaque string
   * vehicle id; the backend wants a numeric primary key.
   */
  resolveVehicleId: (vehicleSlugOrId: string) => number | null;
  /** Catalog used to render the human-readable notes summary. */
  addOns?: AddOn[];
  protectionTiers?: ProtectionTier[];
  /** Override the country code used when sending phone — defaults to "LB". */
  defaultCountry?: string;
  /** Total rental price in cents for selected_rate_price. */
  rateTotalCents?: number;
  /** Website-validated promo discount in cents for Wizard payload. */
  promoDiscountCents?: number;
}

export class MissingBackendVehicleIdError extends Error {
  constructor(public readonly slugOrId: string) {
    super(`No backend vehicle id known for ${slugOrId}`);
    this.name = "MissingBackendVehicleIdError";
  }
}

export class IncompleteBookingDraftError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IncompleteBookingDraftError";
  }
}

/**
 * Build the `POST /booking-request` payload from a complete `BookingDraft`.
 * Throws if required fields are missing or the vehicle id can't be resolved.
 */
export function fromBookingDraft(
  draft: BookingDraft,
  options: FromBookingDraftOptions,
): BookingRequestPayload {
  const { resolveVehicleId, addOns = [], protectionTiers = [] } = options;

  if (!draft.vehicle) throw new IncompleteBookingDraftError("draft.vehicle is required");
  if (!draft.driver) throw new IncompleteBookingDraftError("draft.driver is required");
  if (!draft.paymentMethod) {
    throw new IncompleteBookingDraftError("draft.paymentMethod is required");
  }

  const numericId = resolveVehicleId(draft.vehicle.vehicleId);
  if (numericId == null) {
    throw new MissingBackendVehicleIdError(draft.vehicle.vehicleId);
  }

  const notes = serializeAddonsAndProtectionAsNotes({
    draft,
    addOns,
    tiers: protectionTiers,
  });

  return {
    vehicle_id: numericId,
    start_date_time: toBackendDateTime(draft.pickup.datetime),
    end_date_time: toBackendDateTime(draft.return.datetime),
    pickup_address: resolveWizardAddressForBooking(draft.pickup),
    drop_off_address: resolveWizardAddressForBooking(draft.return),
    payment_method: mapPaymentMethod(draft.paymentMethod),
    payment_status:
      draft.paymentMethod === "card" ||
      draft.paymentMethod === "whish-online" ||
      draft.paymentMethod === "neo"
        ? "online_pending"
        : "unpaid",
    customer: {
      first_name: draft.driver.firstName,
      last_name: draft.driver.lastName,
      email: draft.driver.email || undefined,
      phone_number: draft.driver.phone,
      birth_date: draft.driver.dob,
      license_number: draft.driver.licenceNumber || undefined,
      license_country: draft.driver.country || options.defaultCountry || "LB",
      issue_date: optionalYmd(draft.driver.licenceIssue),
      expiration_date: optionalYmd(draft.driver.licenceExpiry),
    },
    notes,
    ...buildRateSelectionFields(draft, options.rateTotalCents),
    whatsapp_opt_in: draft.whatsappOptIn ?? true,
    email_opt_in: draft.marketingConsent ?? false,
    customer_language: "en",
    notification_channel: draft.whatsappOptIn !== false ? "whatsapp" : "email",
    ...(draft.promoCode && options.promoDiscountCents != null && options.promoDiscountCents > 0
      ? {
          promo_code: draft.promoCode,
          discount_amount: Math.round(options.promoDiscountCents / 100),
        }
      : {}),
  };
}

function buildRateSelectionFields(
  draft: BookingDraft,
  rateTotalCents?: number,
): Pick<
  BookingRequestPayload,
  | "rate_type"
  | "mileage_plan"
  | "selected_rate_label"
  | "selected_rate_price"
  | "selected_mileage_limit"
> {
  const rate = draft.vehicle?.rate;
  if (!rate) return {};

  const rateType = rate.type === "best-price" ? "best_price" : "flexible";
  const mileagePlan = rate.mileage === "unlimited" ? "unlimited" : "200km_per_day";
  const rateLabel = rate.type === "best-price" ? "Best Price" : "Flexible";
  const mileageLabel = rate.mileage === "unlimited" ? "Unlimited" : "200 km/day";

  const price =
    typeof rateTotalCents === "number" && Number.isFinite(rateTotalCents)
      ? Math.round(rateTotalCents / 100)
      : undefined;

  return {
    rate_type: rateType,
    mileage_plan: mileagePlan,
    selected_rate_label: `${rateLabel} · ${mileageLabel}`,
    ...(price != null ? { selected_rate_price: price } : {}),
    selected_mileage_limit: mileageLabel,
  };
}

function mapPaymentMethod(method: BookingDraft["paymentMethod"]): string {
  switch (method) {
    case "card":
    case "whish-online":
    case "neo":
      return "online_payment";
    case "cash":
      return "cash_on_pickup";
    case "transfer":
      return "bank_transfer";
    case "omt":
      return "omt";
    default:
      return "cash_on_pickup";
  }
}

export interface SerializeNotesInputs {
  draft: BookingDraft;
  addOns: AddOn[];
  tiers: ProtectionTier[];
  /** Optional preamble (e.g. caller-supplied notes from the checkout form). */
  freeformNotes?: string;
}

/**
 * Render a single multi-line `notes` string capturing rate/protection/add-on
 * selections in a form ops can read at a glance. Stable ordering — useful
 * for snapshot tests.
 */
export function serializeAddonsAndProtectionAsNotes({
  draft,
  addOns,
  tiers,
  freeformNotes,
}: SerializeNotesInputs): string {
  const lines: string[] = [];
  if (freeformNotes?.trim()) lines.push(freeformNotes.trim());

  if (draft.vehicle?.rate) {
    const rateLabel = draft.vehicle.rate.type === "best-price" ? "Best Price" : "Flexible";
    const mileageLabel =
      draft.vehicle.rate.mileage === "unlimited" ? "Unlimited mileage" : "200 km/day";
    lines.push(`Rate: ${rateLabel} · ${mileageLabel}`);
  }

  if (draft.protectionTierId) {
    const tier = tiers.find((t) => t.id === draft.protectionTierId);
    if (tier) {
      const perDay = tier.perDayCents > 0 ? ` (+$${(tier.perDayCents / 100).toFixed(0)}/day)` : "";
      lines.push(`Protection: ${tier.name}${perDay}`);
    }
  }

  if (draft.extras.length > 0) {
    const addonLines = draft.extras
      .map((e) => {
        const addOn = addOns.find((a) => a.id === e.addOnId);
        if (!addOn) return null;
        const qty = Math.max(1, e.qty);
        return `${extraQtyLabel(addOn, qty)}${addOn.name} (${addOnUnitPriceLabel(addOn)})`;
      })
      .filter((line): line is string => line != null);
    if (addonLines.length > 0) lines.push(`Add-ons: ${addonLines.join(", ")}`);
  }

  if (draft.flightNumber) lines.push(`Flight: ${draft.flightNumber}`);

  if (draft.paymentMethod === "omt") {
    lines.push(
      "Payment: OMT — customer will pay in person using this booking's own reference as the transaction code; match by reference for reconciliation.",
    );
  }

  if (draft.promoCode) lines.push(`Promo code: ${draft.promoCode}`);

  if (draft.whatsappOptIn) lines.push("Customer opted into WhatsApp updates.");

  return lines.join("\n");
}

// ── Booking submit (backend response → internal) ─────────────────────────

const BOOKING_REF_RE = /^WRC-\d{6}-[A-Z0-9]{4}$/;

/**
 * Synthesize a `WRC-YYMMDD-XXXX` booking ref from the backend's numeric
 * `data.id`. Stable for a given id + date, so reloading the confirmation
 * page produces the same ref. The base-36 + reverse + padding scheme makes
 * even small ids feel non-sequential.
 */
export function synthesizeBookingRef(numericId: number, date: Date = new Date()): BookingRef {
  const yy = String(date.getUTCFullYear()).slice(-2);
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const suffix = Math.abs(Math.trunc(numericId))
    .toString(36)
    .toUpperCase()
    .padStart(4, "0")
    .slice(-4);
  const ref = `WRC-${yy}${mm}${dd}-${suffix}`;
  if (!BOOKING_REF_RE.test(ref)) {
    throw new Error(`synthesized ref failed validation: ${ref}`);
  }
  return ref;
}

export interface ToInternalBookingOptions {
  draft: BookingDraft;
  vehicle: Vehicle;
  price: BookingPriceBreakdown;
  /**
   * Optional public status token returned by the backend.
   * Kept outside `Booking` for now because domain type has no token field.
   */
  publicToken?: string;
  /** Defaults to `new Date()` — inject for deterministic ref synthesis. */
  clock?: () => Date;
}

/**
 * Build an internal `Booking` from the backend's success response. We trust
 * the backend's authoritative fields (amount, vehicle id, dates) and pull
 * the rest (rate, extras, protection, driver details) from the draft.
 *
 * Backend quirk handled: `end_time` is normalized server-side to "14:00:00"
 * regardless of what we requested. Surfaced verbatim in the response.
 */
export function toInternalBooking(data: BookingData, options: ToInternalBookingOptions): Booking {
  const { draft, vehicle, price } = options;
  const clock = options.clock ?? (() => new Date());

  if (!draft.vehicle || !draft.driver || !draft.paymentMethod) {
    throw new IncompleteBookingDraftError(
      "draft.vehicle, draft.driver, draft.paymentMethod must all be set",
    );
  }

  const pickupIso = data.start_date_time
    ? fromBackendDateTime(data.start_date_time)
    : data.start_date && data.start_time
      ? fromBackendDateAndTime(data.start_date, data.start_time)
      : draft.pickup.datetime;
  const returnIso = data.end_date_time
    ? fromBackendDateTime(data.end_date_time)
    : data.end_date && data.end_time
      ? fromBackendDateAndTime(data.end_date, data.end_time)
      : draft.return.datetime;

  const ref = data.reference ?? synthesizeBookingRef(data.id, clock());

  // Adam Aug 9: cash/offline stay pending until Wizard approval.
  // Online card methods still map to confirmed when the PSP path completes.
  const state =
    data.status === "confirmed" || data.status === "approved"
      ? "confirmed"
      : data.status === "cancelled" || data.status === "canceled"
        ? "cancelled"
        : draft.paymentMethod === "card" ||
            draft.paymentMethod === "whish-online" ||
            draft.paymentMethod === "neo"
          ? "confirmed"
          : "pending";

  const totalCents = Math.round(data.amount * 100);

  return {
    ref,
    state,
    createdAt: clock().toISOString(),
    pickup: { ...draft.pickup, datetime: pickupIso },
    return: { ...draft.return, datetime: returnIso },
    vehicle: draft.vehicle,
    vehicleSnapshot: {
      id: vehicle.id,
      slug: vehicle.slug,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      category: vehicle.category,
      images: vehicle.images,
    },
    extras: draft.extras,
    protectionTierId: draft.protectionTierId ?? "pt-basic",
    driver: draft.driver,
    ...(draft.additionalDriver ? { additionalDriver: draft.additionalDriver } : {}),
    flightNumber: draft.flightNumber,
    paymentMethod: draft.paymentMethod,
    marketingConsent: draft.marketingConsent,
    whatsappOptIn: draft.whatsappOptIn,
    promoCode: draft.promoCode,
    price: { ...price, totalCents },
    currency: "USD",
    ...(options.publicToken ? { publicToken: options.publicToken } : {}),
  };
}
