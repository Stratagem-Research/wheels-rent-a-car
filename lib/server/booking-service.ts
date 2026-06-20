import type {
  AvailabilityRequest,
  AvailableVehicle,
  Booking,
  BookingDraft,
  LookupBookingRequest,
  QuoteRequest,
  QuoteResponse,
  Rate,
  SubmitBookingRequest,
  SubmitBookingResponse,
} from "@/types/domain";
import { toBookingFromLookup } from "@/lib/booking/lookup-adapter";
import {
  computePrice,
  generateBookingRef,
  perDayRate,
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
  toInternalAvailableVehicles,
  toInternalBooking,
  VehicleUnavailableError,
} from "@/lib/api/wheels-public";
import { toBackendDateTime } from "@/lib/api/wheels-public/datetime";
import { realBookingApiEnabled } from "@/lib/api/wheels-public/live-handlers";

export { VehicleUnavailableError };

const mockBookings = new Map<string, Booking>();

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

export async function handleBookingQuote(body: QuoteRequest): Promise<QuoteResponse> {
  const { addOns, tiers, vehicles } = await getCatalog();
  const vehicle = body.draft.vehicle
    ? vehicles.find((v) => v.id === body.draft.vehicle?.vehicleId)
    : undefined;
  const days = rentalDays(body.draft.pickup.datetime, body.draft.return.datetime);
  const price = computePrice({ draft: body.draft, vehicle, addOns, tiers });
  return { rentalDays: days, price, changedSinceLastQuote: false };
}

async function resolveWizardVehicleId(frontendVehicleId: string): Promise<number | null> {
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

    const payload = fromBookingDraft(draft, {
      resolveVehicleId: () => numericId,
      addOns,
      protectionTiers: tiers,
    });
    const response = await createBookingRequest(payload);
    const price = computePrice({ draft, vehicle, addOns, tiers });
    const booking = toInternalBooking(response.data, { draft, vehicle, price });

    mockBookings.set(booking.ref, booking);
    if (options?.userId) {
      await addUserBooking({
        userId: options.userId,
        bookingReference: booking.ref,
        publicToken: response.data.public_token,
      });
    }
    return { booking };
  }

  const ref = generateBookingRef();
  const state =
    draft.paymentMethod === "card" || draft.paymentMethod === "cash" ? "confirmed" : "pending";
  const price = computePrice({ draft, vehicle, addOns, tiers });

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
  const fromMock = mockBookings.get(body.ref);
  if (fromMock && fromMock.driver.email.toLowerCase() === body.email.toLowerCase()) {
    return fromMock;
  }

  if (realBookingApiEnabled()) {
    const response = await getBookingByReferenceEmail(body.ref, body.email);
    return toBookingFromLookup(response.data);
  }

  if (!fromMock || fromMock.driver.email.toLowerCase() !== body.email.toLowerCase()) {
    throw new Error("Not found");
  }
  return fromMock;
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
