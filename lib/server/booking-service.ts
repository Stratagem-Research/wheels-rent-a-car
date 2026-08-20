import { randomInt } from "node:crypto";
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
  Vehicle,
} from "@/types/domain";
import {
  frontendVehicleIdFromWizard,
  isManualVehicleId,
  parseWizardVehicleId,
} from "@/lib/booking/wizard-vehicle-id";
import { bookingFromStoredRow, storedBookingFromDomain } from "@/lib/booking/stored-booking";
import { buildBookingEmailPayload } from "@/lib/server/booking-confirmation";
import { validatePromoCodeFromRow } from "@/lib/booking/promo";
import {
  applyWebsiteVehicleToLookup,
  LOOKUP_PLACEHOLDER_IMAGE,
  toBookingFromLookup,
} from "@/lib/booking/lookup-adapter";
import { findPromoCode } from "@/lib/supabase/promo-codes-repository";
import {
  computePrice,
  perDayRate,
  isWithinOnlineBookingWindow,
  rentalDays,
} from "@/lib/booking/pricing";
import { getPublicVehicles } from "@/lib/server/public-content";
import { vehicleDisplayName } from "@/lib/vehicles/display-name";
import { modelGroupKey } from "@/lib/vehicles/group-by-model";
import {
  listAddOnsFromDb,
  listProtectionTiersFromDb,
} from "@/lib/supabase/catalog-repository";
import { listVehicleWizardMap } from "@/lib/supabase/admin-repository";
import {
  addUserBooking,
  claimGuestBookingsForUser,
  getIndexedGuestBooking,
  indexGuestBooking,
} from "@/lib/supabase/user-bookings-repository";
import {
  addVehicleBookingHold,
  isVehicleHeld,
  listHeldFrontendVehicleIds,
} from "@/lib/supabase/vehicle-booking-holds-repository";
import {
  catalogVehicleToAvailable,
  createBookingRequest,
  fromBookingDraft,
  getAvailability,
  getBookingByReferenceEmail,
  getBookingStatusByToken,
  getVehicleAvailability,
  synthesizeBookingRef,
  toInternalAvailableVehicles,
  toInternalBooking,
  VehicleUnavailableError,
} from "@/lib/api/wheels-public";
import { toBackendDateTime } from "@/lib/api/wheels-public/datetime";
import { dispatchWizardSync } from "@/lib/server/wizard-sync";
import { appendBookingState } from "@/lib/server/payment-events";
import { enqueueNotification } from "@/lib/server/notifications";
import { assertPaymentMethodSelectable } from "@/lib/server/payment-methods";
import { getVehicleBySlug, getVehicleById } from "@/lib/server/vehicles-service";

export { VehicleUnavailableError };

function httpStatus(err: unknown): number | null {
  if (typeof err !== "object" || err == null || !("status" in err)) return null;
  const status = Number((err as { status: unknown }).status);
  return Number.isFinite(status) ? status : null;
}

function candidateWizardIds(
  preferredFrontendId: string,
  vehicle: Vehicle | undefined,
  catalog: Vehicle[],
): number[] {
  const ids: number[] = [];
  const seen = new Set<number>();
  const add = (id: number | null) => {
    if (id == null || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };
  add(parseWizardVehicleId(preferredFrontendId));
  if (!vehicle) return ids;
  const key = modelGroupKey(vehicle.make, vehicle.model, vehicle.id);
  for (const item of catalog) {
    if (isManualVehicleId(item.id)) continue;
    if (modelGroupKey(item.make, item.model, item.id) !== key) continue;
    add(parseWizardVehicleId(item.id));
  }
  return ids;
}

function candidateManualIds(preferredFrontendId: string, catalog: Vehicle[]): string[] {
  const preferred = catalog.find((item) => item.id === preferredFrontendId);
  const ids: string[] = [];
  const seen = new Set<string>();
  const add = (id: string) => {
    if (!id || seen.has(id) || !isManualVehicleId(id)) return;
    seen.add(id);
    ids.push(id);
  };
  add(preferredFrontendId);
  if (!preferred) return ids;
  const key = modelGroupKey(preferred.make, preferred.model, preferred.id);
  for (const item of catalog) {
    if (modelGroupKey(item.make, item.model, item.id) !== key) continue;
    add(item.id);
  }
  return ids;
}

async function resolveVehicleForDraft(
  draft: BookingDraft,
  vehicles: Vehicle[],
): Promise<Vehicle | undefined> {
  const selection = draft.vehicle;
  if (!selection) return undefined;
  const byId = vehicles.find((v) => v.id === selection.vehicleId);
  if (byId) return byId;
  const numeric = parseWizardVehicleId(selection.vehicleId);
  if (numeric != null) {
    const prefixed = frontendVehicleIdFromWizard(numeric);
    const byWizardId = vehicles.find(
      (v) => v.id === prefixed || parseWizardVehicleId(v.id) === numeric,
    );
    if (byWizardId) return byWizardId;
  }
  if (selection.vehicleSlug) {
    const bySlug = await getVehicleBySlug(selection.vehicleSlug);
    if (bySlug) return bySlug;
  }
  return (await getVehicleById(selection.vehicleId)) ?? undefined;
}

function assertOnlineBookingWindow(pickupISO: string, returnISO: string) {
  if (!isWithinOnlineBookingWindow(pickupISO, returnISO)) {
    throw new Error(
      "Online booking is limited to 3 months. Please use our long-term enquiry form for longer rentals.",
    );
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
  const availablePublic = response.data.vehicles.filter((v) => v.is_available);
  const heldIds = await listHeldFrontendVehicleIds({
    from: body.pickup.datetime,
    to: body.return.datetime,
  });
  const items = toInternalAvailableVehicles(availablePublic).filter(
    (item) => !heldIds.has(item.vehicle.id),
  );
  const days =
    availablePublic[0]?.pricing.days ??
    rentalDays(body.pickup.datetime, body.return.datetime);
  const knownIds = new Set(items.map((item) => item.vehicle.id));
  const catalog = await getPublicVehicles();
  for (const vehicle of catalog) {
    if (!isManualVehicleId(vehicle.id) || heldIds.has(vehicle.id) || knownIds.has(vehicle.id)) {
      continue;
    }
    items.push(catalogVehicleToAvailable(vehicle, days));
  }
  return { items, rentalDays: days };
}

export type VerifyVehicleAvailabilityResult =
  | { available: true }
  | { available: false; reason: string | null };

/** Fresh Wizard check for the selected vehicle + window (checkout + funnel). */
export async function handleVerifyVehicleAvailability(body: {
  vehicleId: string;
  pickup: BookingDraft["pickup"];
  return: BookingDraft["return"];
}): Promise<VerifyVehicleAvailabilityResult> {
  assertOnlineBookingWindow(body.pickup.datetime, body.return.datetime);
  if (isManualVehicleId(body.vehicleId)) {
    const vehicles = await getPublicVehicles();
    const ids = candidateManualIds(body.vehicleId, vehicles);
    if (!ids.some((id) => vehicles.some((item) => item.id === id))) {
      return { available: false, reason: "unknown_vehicle" };
    }
    const startBackend = toBackendDateTime(body.pickup.datetime);
    const endBackend = toBackendDateTime(body.return.datetime);
    for (const id of ids) {
      if (await isVehicleHeld(id, startBackend, endBackend)) continue;
      return { available: true };
    }
    return { available: false, reason: "booked" };
  }
  const vehicles = await getPublicVehicles();
  const vehicle =
    vehicles.find((item) => item.id === body.vehicleId) ??
    (() => {
      const numeric = parseWizardVehicleId(body.vehicleId);
      if (numeric == null) return undefined;
      const prefixed = frontendVehicleIdFromWizard(numeric);
      return vehicles.find((item) => item.id === prefixed || parseWizardVehicleId(item.id) === numeric);
    })();
  const ids = candidateWizardIds(body.vehicleId, vehicle, vehicles);
  if (ids.length === 0) {
    return { available: false, reason: "unknown_vehicle" };
  }
  const startBackend = toBackendDateTime(body.pickup.datetime);
  const endBackend = toBackendDateTime(body.return.datetime);
  let lastReason: string | null = "unknown_vehicle";
  for (const id of ids) {
    const gate = await resolveSubmitAvailability(id, startBackend, endBackend);
    if (gate.ok) return { available: true };
    lastReason = gate.unavailable_reason;
  }
  return { available: false, reason: lastReason };
}

/** Pre-submit availability gate — website holds first, then Wizard `/availability/{id}`. */
async function resolveSubmitAvailability(
  numericId: number,
  startBackend: string,
  endBackend: string,
): Promise<{ ok: true } | { ok: false; unavailable_reason: string | null }> {
  if (await isVehicleHeld(frontendVehicleIdFromWizard(numericId), startBackend, endBackend)) {
    return { ok: false, unavailable_reason: "booked" };
  }
  try {
    const single = await getVehicleAvailability(numericId, {
      startDateTime: startBackend,
      endDateTime: endBackend,
    });
    if (single.data.is_available) return { ok: true };
    return { ok: false, unavailable_reason: single.data.unavailable_reason ?? null };
  } catch (err) {
    if (err instanceof VehicleUnavailableError) {
      const body = err.body as { unavailable_reason?: string } | null;
      return { ok: false, unavailable_reason: body?.unavailable_reason ?? "booked" };
    }
    const status = httpStatus(err);
    if (status === 400 || status === 404) {
      return { ok: false, unavailable_reason: "unknown_vehicle" };
    }
    throw err;
  }
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
    ? await resolveVehicleForDraft(body.draft, vehicles)
    : undefined;
  const days = rentalDays(body.draft.pickup.datetime, body.draft.return.datetime);
  const promoDiscountPercent = await resolvePromoDiscountPercent(body.draft.promoCode);
  const price = computePrice({ draft: body.draft, vehicle, addOns, tiers, promoDiscountPercent });
  return { rentalDays: days, price, changedSinceLastQuote: false };
}

async function resolveWizardVehicleId(frontendVehicleId: string): Promise<number | null> {
  const fromPrefix = parseWizardVehicleId(frontendVehicleId);
  if (fromPrefix != null) return fromPrefix;
  if (isManualVehicleId(frontendVehicleId)) return null;

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
  assertPaymentMethodSelectable(draft.paymentMethod);
  assertOnlineBookingWindow(draft.pickup.datetime, draft.return.datetime);

  const { addOns, tiers, vehicles } = await getCatalog();
  const vehicle = await resolveVehicleForDraft(draft, vehicles);
  if (!vehicle) throw new Error("Vehicle gone");

  const startBackend = toBackendDateTime(draft.pickup.datetime);
  const endBackend = toBackendDateTime(draft.return.datetime);
  const price = computePrice({
    draft,
    vehicle,
    addOns,
    tiers,
    promoDiscountPercent: await resolvePromoDiscountPercent(draft.promoCode),
  });

  if (isManualVehicleId(draft.vehicle.vehicleId)) {
    let frontendVehicleId: string | null = null;
    for (const id of candidateManualIds(draft.vehicle.vehicleId, vehicles)) {
      if (!(await isVehicleHeld(id, startBackend, endBackend))) {
        frontendVehicleId = id;
        break;
      }
    }
    if (!frontendVehicleId) {
      throw new VehicleUnavailableError("pre-submit-availability-check", {
        message: "Vehicle is not available for this period.",
        unavailable_reason: "booked",
      });
    }

    const ref = synthesizeBookingRef(randomInt(1, 1_679_616), new Date());
    const booking = toInternalBooking(
      {
        id: 1,
        booking_id: 1,
        reference: ref,
        status: "pending",
        payment_status: "unpaid",
        amount: price.totalCents / 100,
        paid_amount: 0,
        due_amount: price.totalCents / 100,
        start_date_time: startBackend,
        end_date_time: endBackend,
        vehicle: { id: 1, name: vehicleDisplayName(vehicle), license_plate: null },
        customer: {
          name: `${draft.driver.firstName} ${draft.driver.lastName}`,
          email: draft.driver.email,
          phone_number: draft.driver.phone,
        },
      },
      { draft, vehicle, price },
    );

    await persistBookingRecords({
      booking,
      draft,
      vehicle,
      frontendVehicleId,
      userId: options?.userId,
    });
    return { booking };
  }

  const candidateIds = candidateWizardIds(draft.vehicle.vehicleId, vehicle, vehicles);
  if (candidateIds.length === 0) {
    throw new Error(`No wizard mapping for vehicle ${draft.vehicle.vehicleId}`);
  }

  let numericId: number | null = null;
  let lastUnavailable: string | null = null;
  let availabilityUnknownId: number | null = null;
  for (const id of candidateIds) {
    const gate = await resolveSubmitAvailability(id, startBackend, endBackend);
    if (gate.ok) {
      numericId = id;
      break;
    }
    if (gate.unavailable_reason === "unknown_vehicle") {
      availabilityUnknownId ??= id;
      continue;
    }
    lastUnavailable = gate.unavailable_reason;
  }
  // Public /availability/{id} can 400 for cars added by Wizard id in admin
  // even when /booking-request accepts that same id.
  if (numericId == null && availabilityUnknownId != null) {
    numericId = availabilityUnknownId;
  }
  if (numericId == null) {
    throw new VehicleUnavailableError("pre-submit-availability-check", {
      message: "Vehicle is not available for this period.",
      unavailable_reason: lastUnavailable,
    });
  }

  const frontendVehicleId = frontendVehicleIdFromWizard(numericId);

  const payload = fromBookingDraft(draft, {
    resolveVehicleId: () => numericId,
    addOns,
    protectionTiers: tiers,
    rateTotalCents: price.totalCents,
    promoDiscountCents: price.discountCents,
  });

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

  if (process.env.NODE_ENV !== "production") {
    console.info("[booking-submit] wizard created", {
      reference: response.data.reference,
      booking_id: response.data.booking_id,
      public_token: response.data.public_token,
      vehicle_id: numericId,
      start_date_time: startBackend,
      end_date_time: endBackend,
    });
  }

  const booking = toInternalBooking(response.data, {
    draft,
    vehicle,
    price,
    publicToken: response.data.public_token,
  });

  await persistBookingRecords({
    booking,
    draft,
    vehicle,
    frontendVehicleId,
    wizardVehicleId: numericId,
    publicToken: response.data.public_token,
    wizardBookingId: response.data.booking_id,
    userId: options?.userId,
  });
  return { booking };
}

async function persistBookingRecords(input: {
  booking: Booking;
  draft: BookingDraft;
  vehicle: Vehicle;
  frontendVehicleId: string;
  wizardVehicleId?: number | null;
  publicToken?: string | null;
  wizardBookingId?: number | null;
  userId?: string;
}): Promise<void> {
  const { booking, draft, vehicle, frontendVehicleId } = input;
  try {
    await addVehicleBookingHold({
      bookingReference: booking.ref,
      wizardVehicleId: input.wizardVehicleId,
      frontendVehicleId,
      pickupAt: draft.pickup.datetime,
      returnAt: draft.return.datetime,
    });
  } catch (err) {
    console.error("[booking-submit] vehicle hold failed (non-fatal)", err);
  }

  const rentalWindow = {
    pickupAt: draft.pickup.datetime,
    returnAt: draft.return.datetime,
    frontendVehicleId,
    wizardVehicleId: input.wizardVehicleId ?? null,
    ...storedBookingFromDomain(booking),
  };

  if (input.userId) {
    try {
      await addUserBooking({
        userId: input.userId,
        bookingReference: booking.ref,
        publicToken: input.publicToken,
        wizardBookingId: input.wizardBookingId,
        customerEmail: draft.driver!.email,
        ...rentalWindow,
      });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[booking-submit] user_bookings link failed (non-fatal)", err);
      }
    }
  }

  try {
    await indexGuestBooking({
      email: draft.driver!.email,
      bookingReference: booking.ref,
      publicToken: input.publicToken,
      wizardBookingId: input.wizardBookingId,
      ...rentalWindow,
    });
  } catch (err) {
    console.error("[guest-booking-index] failed", err);
  }
  const richPayload = await buildBookingEmailPayload(booking).catch((err) => {
    console.error("[booking-submit] rich email payload failed (non-fatal)", err);
    return null;
  });
  await enqueueNotification({
    bookingReference: booking.ref,
    channel: "email",
    template: "booking_request_received",
    recipient: draft.driver!.email,
    payload: {
      ref: booking.ref,
      vehicle: vehicleDisplayName(vehicle),
      pickupDatetime: draft.pickup.datetime,
      returnDatetime: draft.return.datetime,
      state: booking.state,
      paymentMethod: draft.paymentMethod,
      ...richPayload,
    },
  }).catch(() => undefined);
}

function isWebsiteOnlyIndexedBooking(row: {
  frontendVehicleId: string | null;
  wizardVehicleId: number | null;
  publicToken: string | null;
}): boolean {
  return (
    isManualVehicleId(row.frontendVehicleId ?? "") ||
    (row.wizardVehicleId == null && !row.publicToken)
  );
}

export async function handleBookingLookup(body: LookupBookingRequest): Promise<Booking> {
  const local = await getIndexedGuestBooking(body.ref, body.email).catch(() => null);
  if (local && isWebsiteOnlyIndexedBooking(local)) {
    const booking = bookingFromStoredRow(local, body.email);
    if (booking.vehicleSnapshot.images.length === 0) {
      booking.vehicleSnapshot.images = [{ ...LOOKUP_PLACEHOLDER_IMAGE }];
    }
    return booking;
  }

  const response = await getBookingByReferenceEmail(body.ref, body.email);
  return hydrateLookupVehicle(toBookingFromLookup(response.data), response.data.vehicle.id);
}

/** Prefer website catalog (`wiz-{id}`) over fixture fallback for lookup UIs. */
export async function hydrateLookupVehicle(
  booking: Booking,
  wizardVehicleId: number,
): Promise<Booking> {
  try {
    const { vehicles } = await getCatalog();
    return applyWebsiteVehicleToLookup(booking, wizardVehicleId, vehicles);
  } catch {
    return booking;
  }
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
  requestedReturnDatetime: string;
  note?: string;
}): Promise<{ requested: true }> {
  const booking = await handleBookingLookup({ ref: body.ref, email: body.email });

  if (booking.state === "cancelled" || booking.state === "completed" || booking.state === "expired") {
    throw new BookingNotCancellableError(booking.state);
  }

  try {
    await dispatchWizardSync(body.ref, {
      lifecycleState: "change_requested",
      message: `Customer requested a booking change via website. Requested pickup: ${body.requestedPickupDatetime}; requested return: ${body.requestedReturnDatetime}.${body.note ? ` Note: ${body.note}` : ""}`,
    });
  } catch (err) {
    throw new ChangeRequestSyncError(err);
  }

  await appendBookingState(body.ref, "change_requested", {
    source: "customer",
    email: body.email,
    requestedPickupDatetime: body.requestedPickupDatetime,
    requestedReturnDatetime: body.requestedReturnDatetime,
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
      currentReturnDatetime: booking.return.datetime,
      requestedPickupDatetime: body.requestedPickupDatetime,
      requestedReturnDatetime: body.requestedReturnDatetime,
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
