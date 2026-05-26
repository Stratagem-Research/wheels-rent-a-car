/**
 * Glue that makes the existing `/api/booking/availability` and
 * `/api/booking/submit` handlers in `lib/api/mocks/handlers.ts` delegate to
 * the live Wheels public API when `NEXT_PUBLIC_USE_REAL_BOOKING_API === "true"`.
 *
 * The shape returned by these functions matches what the MSW mock returned
 * before — so the rest of the codebase (booking funnel, confirmation page,
 * account screens) doesn't know or care that the data came from a different
 * source. That isolation is the whole point of the bridge.
 */

import type {
  AvailableVehicle,
  Booking,
  BookingDraft,
  SubmitBookingResponse,
} from "@/types/domain";
import { ADD_ONS, PROTECTION_TIERS } from "@/lib/api/mocks/fixtures/catalog";
import { VEHICLES } from "@/lib/api/mocks/fixtures/vehicles";
import { computePrice } from "@/lib/booking/pricing";
import {
  createBookingRequest,
  getBookingByReferenceEmail,
  getBookingStatusByToken,
  fromBackendDateAndTime,
  fromBookingDraft,
  getAvailability,
  toInternalAvailableVehicles,
  toInternalBooking,
  writeRefMap,
  VehicleUnavailableError,
} from ".";
import { toBackendDateTime } from "./datetime";

/**
 * Read-only flag check. Centralized so the handler doesn't peek at
 * `process.env` directly (easier to mock in tests, easier to grep).
 */
export function realBookingApiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_REAL_BOOKING_API === "true";
}

/**
 * Re-export VehicleUnavailableError so handler code can `instanceof`-check
 * it without pulling from the deep import path.
 */
export { VehicleUnavailableError };

// ── Vehicle id resolver ─────────────────────────────────────────────────
//
// The funnel's BookingDraft carries the frontend's opaque string id (e.g.
// "veh-yaris"). The backend wants a numeric primary key. We persist the
// {frontendId → backendId} mapping on the most recent availability response
// so the submit step can look it up without a second network call.

const VEHICLE_ID_MAP_KEY = "wheels.wheelsPublic.vehicleIdMap";

function readVehicleIdMap(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(VEHICLE_ID_MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, number>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeVehicleIdMap(map: Record<string, number>): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(VEHICLE_ID_MAP_KEY, JSON.stringify(map));
  } catch {
    /* swallow */
  }
}

function rememberMapping(frontendId: string, backendId: number): void {
  const current = readVehicleIdMap();
  current[frontendId] = backendId;
  writeVehicleIdMap(current);
}

function resolveBackendVehicleId(frontendId: string): number | null {
  const map = readVehicleIdMap();
  return map[frontendId] ?? null;
}

// ── Availability ────────────────────────────────────────────────────────

export interface LiveAvailabilityArgs {
  pickupIso: string;
  returnIso: string;
}

export interface LiveAvailabilityResult {
  items: AvailableVehicle[];
  rentalDays: number;
}

export async function liveAvailability({
  pickupIso,
  returnIso,
}: LiveAvailabilityArgs): Promise<LiveAvailabilityResult> {
  const response = await getAvailability({
    startDateTime: toBackendDateTime(pickupIso),
    endDateTime: toBackendDateTime(returnIso),
    includeBooked: false,
  });

  const items = toInternalAvailableVehicles(response.data.vehicles);

  // Persist the mapping so the next booking-request submit can look up the
  // backend numeric id from the funnel's frontend slug/id.
  const map = readVehicleIdMap();
  for (let i = 0; i < items.length; i++) {
    const internal = items[i];
    const backend = response.data.vehicles[i];
    if (internal && backend) {
      map[internal.vehicle.id] = backend.id;
    }
  }
  writeVehicleIdMap(map);

  const days = response.data.vehicles[0]?.pricing.days ?? rentalDaysFromIso(pickupIso, returnIso);
  return { items, rentalDays: days };
}

function rentalDaysFromIso(pickupIso: string, returnIso: string): number {
  const ms = Math.max(0, new Date(returnIso).getTime() - new Date(pickupIso).getTime());
  return Math.max(1, Math.round(ms / 86_400_000));
}

// ── Booking submit ──────────────────────────────────────────────────────

export interface LiveSubmitArgs {
  draft: BookingDraft;
  /** Inject for deterministic tests. */
  clock?: () => Date;
}

/**
 * Submit a booking-request and adapt the response into the SubmitBooking-
 * response shape the MSW handler expects. Persists booking reference mapping
 * so browser flows can recover from transient outages.
 *
 * @throws VehicleUnavailableError on 409.
 */
export async function liveSubmitBooking({
  draft,
  clock = () => new Date(),
}: LiveSubmitArgs): Promise<SubmitBookingResponse> {
  if (!draft.vehicle) throw new Error("draft.vehicle is required to submit");

  // Make sure we have a backend id for this vehicle. If not, fall back to a
  // single-vehicle availability call to learn it. (Edge case: user resumed
  // from a stale sessionStorage draft after we cleared the id map.)
  let numericId = resolveBackendVehicleId(draft.vehicle.vehicleId);
  if (numericId == null) {
    await liveAvailability({
      pickupIso: draft.pickup.datetime,
      returnIso: draft.return.datetime,
    });
    numericId = resolveBackendVehicleId(draft.vehicle.vehicleId);
  }

  const payload = fromBookingDraft(draft, {
    resolveVehicleId: () => numericId,
    addOns: ADD_ONS,
    protectionTiers: PROTECTION_TIERS,
  });

  const response = await createBookingRequest(payload);

  const vehicle = VEHICLES.find((v) => v.id === draft.vehicle?.vehicleId);
  if (!vehicle) {
    throw new Error(`No catalog fixture for vehicle id ${draft.vehicle.vehicleId}`);
  }
  const price = computePrice({ draft, vehicle, addOns: ADD_ONS, tiers: PROTECTION_TIERS });

  const booking: Booking = toInternalBooking(response.data, {
    draft,
    vehicle,
    price,
    clock,
  });

  // Remember this mapping for the funnel's next call, and persist the
  // ref-map entry so the manage-booking lookup screen can find it.
  rememberMapping(vehicle.id, response.data.vehicle.id);
  if (typeof window !== "undefined") {
    writeRefMap(window.localStorage, {
      ref: booking.ref,
      numericId: response.data.id,
      bookingId: response.data.booking_id,
      email: booking.driver.email,
      createdAt: booking.createdAt,
      publicToken: response.data.public_token,
    });
  }

  return { booking };
}

export interface LiveLookupBookingArgs {
  reference: string;
  email: string;
}

export async function liveLookupBooking({
  reference,
  email,
}: LiveLookupBookingArgs): Promise<{ reference: string; email: string; data: Awaited<ReturnType<typeof getBookingByReferenceEmail>>["data"] }> {
  const response = await getBookingByReferenceEmail(reference, email);
  return { reference, email, data: response.data };
}

export async function liveBookingStatusByToken(publicToken: string) {
  const response = await getBookingStatusByToken(publicToken);
  return response.data;
}

/** Convenience for tests — re-export the date utility so callers don't need a second import. */
export { fromBackendDateAndTime };
