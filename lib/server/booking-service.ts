import type {
  AvailabilityRequest,
  Booking,
  BookingDraft,
  BookingState,
  LookupBookingRequest,
  QuoteRequest,
  QuoteResponse,
  SubmitBookingRequest,
  SubmitBookingResponse,
} from "@/types/domain";
import { parseWizardVehicleId } from "@/lib/booking/wizard-vehicle-id";
import { validatePromoCodeFromRow } from "@/lib/booking/promo";
import { toBookingFromLookup } from "@/lib/booking/lookup-adapter";
import { findPromoCode } from "@/lib/supabase/promo-codes-repository";
import {
  computePrice,
  perDayRate,
  isWithinOnlineBookingWindow,
  rentalDays,
} from "@/lib/booking/pricing";
import { getPublicVehicles } from "@/lib/server/public-content";
import {
  listAddOnsFromDb,
  listProtectionTiersFromDb,
} from "@/lib/supabase/catalog-repository";
import { listVehicleWizardMap } from "@/lib/supabase/admin-repository";
import { addUserBooking } from "@/lib/supabase/user-bookings-repository";
import {
  createBookingRequest,
  fromBookingDraft,
  getAvailability,
  getBookingByReferenceEmail,
  getBookingStatusByToken,
  getVehicleAvailability,
  toInternalAvailableVehicles,
  toInternalBooking,
  VehicleUnavailableError,
} from "@/lib/api/wheels-public";
import { toBackendDateTime } from "@/lib/api/wheels-public/datetime";
import { dispatchWizardSync } from "@/lib/server/wizard-sync";
import { appendBookingState } from "@/lib/server/payment-events";
import { enqueueNotification } from "@/lib/server/notifications";

export { VehicleUnavailableError };

function assertOnlineBookingWindow(pickupISO: string, returnISO: string) {
  if (!isWithinOnlineBookingWindow(pickupISO, returnISO)) {
    throw new Error(
      "Online booking is limited to 3 months. Please use our long-term enquiry form for longer rentals.",
    );
  }
}

async function syncCashBookingToWizard(
  booking: Booking,
  wizardBookingId: number | undefined,
  paidAmount: number,
) {
  try {
    await dispatchWizardSync(booking.ref, {
      lifecycleState: "confirmed",
      paymentStatus: "paid",
      paidAmount,
      paymentMethod: "website_payment",
      paymentDate: new Date().toISOString().slice(0, 10),
      wizardBookingId,
      message: "Cash booking confirmed at checkout.",
    });
    await appendBookingState(booking.ref, "confirmed", {
      paymentStatus: "paid",
      source: "cash_submit",
    });
  } catch {
    // Sync failures are logged in wizard-sync; booking still stands locally.
  }
}

async function getCatalog() {
  const [addOns, tiers, vehicles] = await Promise.all([
    listAddOnsFromDb(),
    listProtectionTiersFromDb(),
    getPublicVehicles(),
  ]);
  return { addOns, tiers, vehicles };
}

export async function handleBookingAvailability(body: AvailabilityRequest) {
  assertOnlineBookingWindow(body.pickup.datetime, body.return.datetime);
  const response = await getAvailability({
    startDateTime: toBackendDateTime(body.pickup.datetime),
    endDateTime: toBackendDateTime(body.return.datetime),
    includeBooked: false,
  });
  const items = toInternalAvailableVehicles(response.data.vehicles);
  const days =
    response.data.vehicles[0]?.pricing.days ??
    rentalDays(body.pickup.datetime, body.return.datetime);
  return { items, rentalDays: days };
}

export async function handleBookingRate(body: {
  vehicleId: string;
  rateType: "best-price" | "flexible";
  mileage: "capped-200km" | "unlimited";
  pickup: string;
  return: string;
}) {
  const { vehicles } = await getCatalog();
  const vehicle = vehicles.find((v) => v.id === body.vehicleId);
  if (!vehicle) throw new Error("Vehicle not found");
  const days = rentalDays(body.pickup, body.return);
  const perDay = perDayRate(vehicle, body.rateType, body.mileage);
  return { perDayCents: perDay, totalCents: perDay * days, rentalDays: days };
}

async function resolvePromoDiscountPercent(promoCode?: string): Promise<number> {
  if (!promoCode?.trim()) return 0;
  const row = await findPromoCode(promoCode);
  const result = validatePromoCodeFromRow(promoCode, row);
  if (!result) return 0;
  if (!result.valid) throw new Error(result.reason);
  return result.discountPercent;
}

export async function handleBookingQuote(body: QuoteRequest): Promise<QuoteResponse> {
  assertOnlineBookingWindow(body.draft.pickup.datetime, body.draft.return.datetime);
  const { addOns, tiers, vehicles } = await getCatalog();
  const vehicle = body.draft.vehicle
    ? vehicles.find((v) => v.id === body.draft.vehicle?.vehicleId)
    : undefined;
  const days = rentalDays(body.draft.pickup.datetime, body.draft.return.datetime);
  const promoDiscountPercent = await resolvePromoDiscountPercent(body.draft.promoCode);
  const price = computePrice({ draft: body.draft, vehicle, addOns, tiers, promoDiscountPercent });
  return { rentalDays: days, price, changedSinceLastQuote: false };
}

async function resolveWizardVehicleId(frontendVehicleId: string): Promise<number | null> {
  const fromPrefix = parseWizardVehicleId(frontendVehicleId);
  if (fromPrefix != null) return fromPrefix;

  const map = await listVehicleWizardMap();
  const row = map.find((item) => item.frontend_vehicle_id === frontendVehicleId);
  return row?.wizard_vehicle_id ?? null;
}

export async function handleBookingSubmit(
  body: SubmitBookingRequest,
  options?: { userId?: string },
): Promise<SubmitBookingResponse> {
  const draft: BookingDraft = body.draft;
  if (!draft.vehicle || !draft.driver || !draft.paymentMethod) {
    throw new Error("Incomplete booking");
  }
  assertOnlineBookingWindow(draft.pickup.datetime, draft.return.datetime);

  const { addOns, tiers, vehicles } = await getCatalog();
  const vehicle = vehicles.find((v) => v.id === draft.vehicle?.vehicleId);
  if (!vehicle) throw new Error("Vehicle gone");

  let numericId = await resolveWizardVehicleId(draft.vehicle.vehicleId);
  if (numericId == null) {
    await handleBookingAvailability({
      pickup: draft.pickup,
      return: draft.return,
    });
    numericId = await resolveWizardVehicleId(draft.vehicle.vehicleId);
  }
  if (numericId == null) {
    throw new Error(`No wizard mapping for vehicle ${draft.vehicle.vehicleId}`);
  }

  const price = computePrice({
    draft,
    vehicle,
    addOns,
    tiers,
    promoDiscountPercent: await resolvePromoDiscountPercent(draft.promoCode),
  });
  const payload = fromBookingDraft(draft, {
    resolveVehicleId: () => numericId,
    addOns,
    protectionTiers: tiers,
    rateTotalCents: price.totalCents,
    promoDiscountCents: price.discountCents,
  });

  const startBackend = payload.start_date_time;
  const endBackend = payload.end_date_time;

  const vehicleAvail = await getVehicleAvailability(numericId, {
    startDateTime: startBackend,
    endDateTime: endBackend,
  });
  if (!vehicleAvail.data.is_available) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[booking-submit] pre-check failed", {
        vehicle_id: numericId,
        start_date_time: startBackend,
        end_date_time: endBackend,
        pickup_address: payload.pickup_address,
        drop_off_address: payload.drop_off_address,
        unavailable_reason: vehicleAvail.data.unavailable_reason,
      });
    }
    throw new VehicleUnavailableError("pre-submit-availability-check", {
      message: "Vehicle is not available for this period.",
      unavailable_reason: vehicleAvail.data.unavailable_reason,
    });
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[booking-submit] pre-check passed", {
      vehicle_id: numericId,
      start_date_time: startBackend,
      end_date_time: endBackend,
      pickup_address: payload.pickup_address,
      drop_off_address: payload.drop_off_address,
    });
  }

  const response = await createBookingRequest(payload);
  const booking = toInternalBooking(response.data, {
    draft,
    vehicle,
    price,
    publicToken: response.data.public_token,
  });

  if (options?.userId) {
    await addUserBooking({
      userId: options.userId,
      bookingReference: booking.ref,
      publicToken: response.data.public_token,
      wizardBookingId: response.data.booking_id,
    });
  }
  if (draft.paymentMethod === "cash") {
    await syncCashBookingToWizard(
      booking,
      response.data.booking_id,
      Math.round(booking.price.totalCents / 100),
    );
  }
  return { booking };
}

export async function handleBookingLookup(body: LookupBookingRequest): Promise<Booking> {
  const response = await getBookingByReferenceEmail(body.ref, body.email);
  return toBookingFromLookup(response.data);
}

export async function handleBookingStatusByToken(publicToken: string) {
  const response = await getBookingStatusByToken(publicToken);
  return response.data;
}

export class BookingNotCancellableError extends Error {
  constructor(public readonly state: BookingState) {
    super(`Booking in state "${state}" cannot be cancelled.`);
    this.name = "BookingNotCancellableError";
  }
}

export class CancelRequestSyncError extends Error {
  constructor(cause: unknown) {
    super("Failed to deliver cancellation request to the Wizard.");
    this.name = "CancelRequestSyncError";
    this.cause = cause;
  }
}

/**
 * Customer cancellation REQUEST — never cancels the booking directly.
 * Per the Wizard system-boundary agreement, a customer request must not
 * change the Wizard booking or trigger refund state; we notify the Wizard
 * via a `cancel_request` sync and their team approves internally.
 */
export async function handleBookingCancelRequest(body: {
  ref: string;
  email: string;
}): Promise<{ requested: true }> {
  // Ref + email must both match — same generic-404 rule as the lookup.
  const booking = await handleBookingLookup({ ref: body.ref, email: body.email });

  if (booking.state === "cancelled" || booking.state === "completed" || booking.state === "expired") {
    throw new BookingNotCancellableError(booking.state);
  }

  try {
    await dispatchWizardSync(body.ref, {
      lifecycleState: "cancel_requested",
      message: "Customer requested cancellation via website.",
    });
  } catch (err) {
    throw new CancelRequestSyncError(err);
  }

  // Website-side records are best-effort: the Wizard sync above is the
  // operational source of truth; a Supabase hiccup must not fail the request.
  await appendBookingState(body.ref, "cancel_requested", {
    source: "customer",
    email: body.email,
  }).catch(() => undefined);
  await enqueueNotification({
    bookingReference: body.ref,
    channel: "email",
    template: "booking_cancel_requested",
    recipient: body.email,
    payload: {
      ref: body.ref,
      pickupDatetime: booking.pickup.datetime,
      vehicle: `${booking.vehicleSnapshot.make} ${booking.vehicleSnapshot.model}`,
    },
  }).catch(() => undefined);

  return { requested: true };
}

export class ChangeRequestSyncError extends Error {
  constructor(cause: unknown) {
    super("Failed to deliver the change request to the Wizard.");
    this.name = "ChangeRequestSyncError";
    this.cause = cause;
  }
}

/**
 * Customer modification REQUEST — mirrors handleBookingCancelRequest. Never
 * mutates the booking directly; the Wizard team reviews and confirms by
 * WhatsApp/email per the account UI copy.
 */
export async function handleBookingChangeRequest(body: {
  ref: string;
  email: string;
  requestedPickupDatetime: string;
  note?: string;
}): Promise<{ requested: true }> {
  const booking = await handleBookingLookup({ ref: body.ref, email: body.email });

  if (booking.state === "cancelled" || booking.state === "completed" || booking.state === "expired") {
    throw new BookingNotCancellableError(booking.state);
  }

  try {
    await dispatchWizardSync(body.ref, {
      lifecycleState: "change_requested",
      message: `Customer requested a booking change via website. Requested pickup: ${body.requestedPickupDatetime}.${body.note ? ` Note: ${body.note}` : ""}`,
    });
  } catch (err) {
    throw new ChangeRequestSyncError(err);
  }

  await appendBookingState(body.ref, "change_requested", {
    source: "customer",
    email: body.email,
    requestedPickupDatetime: body.requestedPickupDatetime,
    note: body.note,
  }).catch(() => undefined);
  await enqueueNotification({
    bookingReference: body.ref,
    channel: "email",
    template: "booking_change_requested",
    recipient: body.email,
    payload: {
      ref: body.ref,
      currentPickupDatetime: booking.pickup.datetime,
      requestedPickupDatetime: body.requestedPickupDatetime,
      vehicle: `${booking.vehicleSnapshot.make} ${booking.vehicleSnapshot.model}`,
    },
  }).catch(() => undefined);

  return { requested: true };
}

/**
 * Estimated refund preview. Ref+email gated like the lookup (P0.3) — this
 * quotes an estimate only; the authoritative refund is decided by the
 * Wizard team after a cancel request is reviewed.
 */
export async function handleBookingCancelPreview(body: {
  ref: string;
  email: string;
}): Promise<{ refundCents: number }> {
  const booking = await handleBookingLookup({ ref: body.ref, email: body.email });
  return { refundCents: booking.price.totalCents };
}
