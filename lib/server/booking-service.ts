import type {
  AvailabilityRequest,
  AvailableVehicle,
  Booking,
  BookingDraft,
  BookingState,
  LookupBookingRequest,
  QuoteRequest,
  QuoteResponse,
  Rate,
  SubmitBookingRequest,
  SubmitBookingResponse,
} from "@/types/domain";
import { parseWizardVehicleId } from "@/lib/booking/wizard-vehicle-id";
import { validatePromoCodeFromRow } from "@/lib/booking/promo";
import { toBookingFromLookup } from "@/lib/booking/lookup-adapter";
import { findPromoCode } from "@/lib/supabase/promo-codes-repository";
import {
  computePrice,
  generateBookingRef,
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
  toInternalAvailableVehicles,
  toInternalBooking,
  VehicleUnavailableError,
} from "@/lib/api/wheels-public";
import { toBackendDateTime } from "@/lib/api/wheels-public/datetime";
import { realBookingApiEnabled } from "@/lib/api/wheels-public/live-handlers";
import { dispatchWizardSync } from "@/lib/server/wizard-sync";
import { appendBookingState } from "@/lib/server/payment-events";
import { enqueueNotification } from "@/lib/server/notifications";

export { VehicleUnavailableError };

const mockBookings = new Map<string, Booking>();

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
  if (!realBookingApiEnabled()) return;
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


function buildRatesFor(vehicleId: string, vehicles: Awaited<ReturnType<typeof getPublicVehicles>>): Rate[] {
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  if (!vehicle) return [];
  return (["best-price", "flexible"] as const).flatMap((type) =>
    (["capped-200km", "unlimited"] as const).map((mileage) => {
      const perDay = perDayRate(vehicle, type, mileage);
      return {
        type,
        mileage,
        perDayCents: perDay,
        totalCents: perDay * 5,
        nonRefundable: type === "best-price",
      } satisfies Rate;
    }),
  );
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
  if (realBookingApiEnabled()) {
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

  const { vehicles } = await getCatalog();
  const days = rentalDays(body.pickup.datetime, body.return.datetime);
  const items: AvailableVehicle[] = vehicles.map((vehicle) => ({
    vehicle,
    rates: buildRatesFor(vehicle.id, vehicles).map((r) => ({
      ...r,
      totalCents: r.perDayCents * days,
    })),
  }));
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

  if (realBookingApiEnabled()) {
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
    const response = await createBookingRequest(payload);
    const booking = toInternalBooking(response.data, {
      draft,
      vehicle,
      price,
      publicToken: response.data.public_token,
    });

    mockBookings.set(booking.ref, booking);
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

  const ref = generateBookingRef();
  const state =
    draft.paymentMethod === "card" || draft.paymentMethod === "cash" ? "confirmed" : "pending";
  const price = computePrice({
    draft,
    vehicle,
    addOns,
    tiers,
    promoDiscountPercent: await resolvePromoDiscountPercent(draft.promoCode),
  });

  const booking: Booking = {
    ref,
    state,
    createdAt: new Date().toISOString(),
    pickup: draft.pickup,
    return: draft.return,
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
    flightNumber: draft.flightNumber,
    paymentMethod: draft.paymentMethod,
    marketingConsent: draft.marketingConsent,
    whatsappOptIn: draft.whatsappOptIn,
    promoCode: draft.promoCode,
    price,
    currency: "USD",
  };

  mockBookings.set(ref, booking);
  if (options?.userId) {
    await addUserBooking({ userId: options.userId, bookingReference: ref });
  }
  return { booking };
}

export async function handleBookingLookup(body: LookupBookingRequest): Promise<Booking> {
  if (realBookingApiEnabled()) {
    const response = await getBookingByReferenceEmail(body.ref, body.email);
    return toBookingFromLookup(response.data);
  }

  const fromMock = mockBookings.get(body.ref);
  if (fromMock && fromMock.driver.email.toLowerCase() === body.email.toLowerCase()) {
    return fromMock;
  }

  if (!fromMock || fromMock.driver.email.toLowerCase() !== body.email.toLowerCase()) {
    throw new Error("Not found");
  }
  return fromMock;
}

export async function handleBookingStatusByToken(publicToken: string) {
  if (!realBookingApiEnabled()) {
    throw new Error("Status polling requires real booking API.");
  }
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

  if (realBookingApiEnabled()) {
    try {
      await dispatchWizardSync(body.ref, {
        lifecycleState: "cancel_requested",
        message: "Customer requested cancellation via website.",
      });
    } catch (err) {
      throw new CancelRequestSyncError(err);
    }
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

export async function handleBookingCancelPreview(body: { ref: string }) {
  const booking = mockBookings.get(body.ref);
  if (!booking) return { refundCents: 0 };
  return { refundCents: booking.price.totalCents };
}

/** Dev-only: expose mock bookings for account list when user has no user_bookings rows. */
export function getMockBookingsForEmail(email: string): Booking[] {
  return Array.from(mockBookings.values()).filter(
    (b) => b.driver.email.toLowerCase() === email.toLowerCase(),
  );
}
