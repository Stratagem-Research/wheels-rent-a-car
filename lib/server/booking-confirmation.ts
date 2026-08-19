import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { enqueueNotification } from "@/lib/server/notifications";
import { bookingFromStoredRow } from "@/lib/booking/stored-booking";
import { extraQtyLabel } from "@/lib/booking/addons";
import { listAddOnsFromDb, listProtectionTiersFromDb } from "@/lib/supabase/catalog-repository";
import { getPublicBranches } from "@/lib/server/public-content";
import type { UserBookingRow } from "@/lib/supabase/user-bookings-repository";

const APPROVAL_STATUSES = new Set(["approved", "confirmed"]);
const INVENTORY_RELEASE_STATUSES = new Set(["cancelled", "canceled", "rejected"]);

export function isApprovalStatus(status: string): boolean {
  return APPROVAL_STATUSES.has(status.trim().toLowerCase());
}

/** Wizard cancelled/rejected the booking — website hold should come off. */
export function isInventoryReleaseStatus(status: string): boolean {
  return INVENTORY_RELEASE_STATUSES.has(status.trim().toLowerCase());
}

/**
 * Enqueue a customer email once per booking reference + template.
 */
export async function enqueueBookingTemplateOnce(
  template: "booking_confirmation" | "booking_cancelled",
  input: {
    bookingReference: string;
    recipient: string;
    vehicle?: string;
    payload?: Record<string, unknown>;
  },
): Promise<{ enqueued: boolean }> {
  const ref = input.bookingReference.trim();
  const recipient = input.recipient.trim();
  if (!ref || !recipient) {
    throw new Error("booking_reference and customer_email are required.");
  }

  const supabase = getSupabaseAdminClient();
  const { data: existing, error: lookupError } = await supabase
    .from("notification_outbox")
    .select("id")
    .eq("booking_reference", ref)
    .eq("template", template)
    .limit(1)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return { enqueued: false };

  await enqueueNotification({
    bookingReference: ref,
    channel: "email",
    template,
    recipient,
    payload: {
      ref,
      vehicle: input.vehicle ?? "",
      ...input.payload,
    },
  });

  return { enqueued: true };
}

/**
 * Enqueue formal booking_confirmation once per booking reference (idempotent).
 * Returns whether a new outbox row was created.
 */
export async function enqueueBookingConfirmationOnce(input: {
  bookingReference: string;
  recipient: string;
  vehicle?: string;
  payload?: Record<string, unknown>;
}): Promise<{ enqueued: boolean }> {
  return enqueueBookingTemplateOnce("booking_confirmation", input);
}

function splitDatetime(value: string): { date: string; time: string } {
  const [datePart, timePart] = value.split("T");
  return { date: datePart ?? value, time: (timePart ?? "").slice(0, 5) };
}

function formatDateLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  card: "Card",
  cash: "Cash on pickup",
  transfer: "Bank transfer",
  omt: "OMT / Whish / Bob Finance",
  "whish-online": "Whish (online)",
  neo: "Neo",
};

/**
 * Build the full set of human-readable fields the confirmation email needs
 * — dates/times, driver, extras/protection by name (not id), pickup/return
 * location, and the price breakdown — from a stored booking row. Used by
 * both the Wizard approval webhook and the admin manual-confirm flow so the
 * email always has everything, not just a booking reference + vehicle name.
 */
export async function buildBookingConfirmationPayload(
  row: UserBookingRow,
  recipient: string,
): Promise<Record<string, unknown>> {
  const booking = bookingFromStoredRow(row, recipient);
  const [addOns, tiers, branches] = await Promise.all([
    listAddOnsFromDb().catch(() => []),
    listProtectionTiersFromDb().catch(() => []),
    getPublicBranches().catch(() => []),
  ]);

  const pickup = splitDatetime(booking.pickup.datetime);
  const ret = splitDatetime(booking.return.datetime);
  const branchName = (id?: string) => branches.find((b) => b.id === id)?.name;

  const pickupLocation =
    booking.pickup.type === "address-delivery" && booking.pickup.address
      ? `Delivery — ${booking.pickup.address}`
      : (branchName(booking.pickup.locationId) ?? booking.pickup.locationId ?? "");
  const returnLocation =
    booking.return.address && booking.pickup.type === "address-delivery"
      ? `Delivery — ${booking.return.address}`
      : (branchName(booking.return.locationId) ?? booking.return.locationId ?? "");

  const days = rentalDays(booking.pickup.datetime, booking.return.datetime);
  const extrasLines = booking.extras
    .map((extra) => {
      const addOn = addOns.find((a) => a.id === extra.addOnId);
      if (!addOn) return null;
      const unit = addOn.pricing === "per-day" ? addOn.priceCents * days : addOn.priceCents;
      const total = unit * Math.max(1, extra.qty);
      const qtyLabel = extraQtyLabel(addOn, extra.qty);
      const priceLabel = total === 0 ? "Free" : formatUsd(total);
      return `${qtyLabel}${addOn.name} — ${priceLabel}`;
    })
    .filter((line): line is string => Boolean(line));

  const tier = tiers.find((t) => t.id === booking.protectionTierId);

  return {
    ref: booking.ref,
    vehicle: [booking.vehicleSnapshot.make, booking.vehicleSnapshot.model]
      .filter(Boolean)
      .join(" "),
    vehicleYear: booking.vehicleSnapshot.year,
    pickupDate: formatDateLabel(pickup.date),
    pickupTime: pickup.time,
    returnDate: formatDateLabel(ret.date),
    returnTime: ret.time,
    pickupLocation,
    returnLocation,
    driverName: [booking.driver.firstName, booking.driver.lastName].filter(Boolean).join(" "),
    driverEmail: booking.driver.email,
    driverPhone: booking.driver.phone,
    flightNumber: booking.flightNumber ?? "",
    paymentMethod: PAYMENT_METHOD_LABELS[booking.paymentMethod] ?? booking.paymentMethod,
    extrasLines,
    protectionName: tier?.name ?? "",
    protectionPriceLabel: tier
      ? tier.perDayCents === 0
        ? "Included"
        : `${formatUsd(tier.perDayCents)}/day`
      : "",
    priceBaseRate: formatUsd(booking.price.baseRateCents),
    priceExtras: formatUsd(booking.price.extrasCents),
    priceProtection: formatUsd(booking.price.protectionCents),
    priceTaxes: formatUsd(booking.price.taxesCents),
    priceFees: formatUsd(booking.price.feesCents),
    priceDiscount: booking.price.discountCents > 0 ? formatUsd(booking.price.discountCents) : "",
    priceTotal: formatUsd(booking.price.totalCents),
    priceDeposit: formatUsd(booking.price.depositCents),
  };
}
