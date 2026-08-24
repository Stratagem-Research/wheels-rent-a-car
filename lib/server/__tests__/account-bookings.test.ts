import { describe, expect, it, vi, beforeEach } from "vitest";
import { WheelsThrottledError } from "@/lib/api/wheels-public";
import { emptyStoredBookingFields } from "@/lib/booking/stored-booking";
import type { UserBookingRow } from "@/lib/supabase/user-bookings-repository";
import type { Booking } from "@/types/domain";

const mockLookup = vi.fn();
const mockStatusByToken = vi.fn();

vi.mock("@/lib/server/booking-service", () => ({
  handleBookingLookup: (...args: unknown[]) => mockLookup(...args),
  handleBookingStatusByToken: (...args: unknown[]) => mockStatusByToken(...args),
  hydrateLookupVehicle: async (booking: Booking) => booking,
}));

import { bookingFromLinkedRow, resolveAccountBooking } from "../account-bookings";

function row(overrides: Partial<UserBookingRow> = {}): UserBookingRow {
  return {
    ...emptyStoredBookingFields(),
    bookingReference: "WRC-260818-F8Z4",
    publicToken: "tok",
    customerEmail: "a@example.com",
    createdAt: "2026-08-18T10:00:00.000Z",
    pickupAt: "2026-08-20T10:00:00.000Z",
    returnAt: "2026-08-22T10:00:00.000Z",
    frontendVehicleId: "wiz-131",
    wizardVehicleId: 131,
    totalCents: 45000,
    ...overrides,
  };
}

const liveBooking = { ref: "WRC-260818-F8Z4", state: "confirmed" } as Booking;

beforeEach(() => {
  mockLookup.mockReset();
  mockStatusByToken.mockReset();
});

describe("bookingFromLinkedRow", () => {
  it("keeps local dates and vehicle id when Wizard is unavailable", async () => {
    const booking = await bookingFromLinkedRow(row(), "auth@example.com");
    expect(booking.ref).toBe("WRC-260818-F8Z4");
    expect(booking.state).toBe("pending");
    expect(booking.pickup.datetime).toBe("2026-08-20T10:00:00.000Z");
    expect(booking.return.datetime).toBe("2026-08-22T10:00:00.000Z");
    expect(booking.vehicle.vehicleId).toBe("wiz-131");
  });

  it("uses stored columns for price, extras, and vehicle", async () => {
    const booking = await bookingFromLinkedRow(
      row({
        publicToken: null,
        frontendVehicleId: "manual-1",
        vehicleMake: "NISSAN",
        vehicleModel: "MICRA",
        extras: [{ addOnId: "gps", qty: 1 }],
        driverFirstName: "Ada",
        baseRateCents: 40000,
        extrasCents: 5000,
        totalCents: 45000,
        paymentMethod: "cash",
      }),
      "auth@example.com",
    );
    expect(booking.vehicleSnapshot.make).toBe("NISSAN");
    expect(booking.extras).toEqual([{ addOnId: "gps", qty: 1 }]);
    expect(booking.price.totalCents).toBe(45000);
    expect(booking.driver.firstName).toBe("Ada");
  });

  it("uses the cached total instead of $0 when Wizard is unavailable", async () => {
    const booking = await bookingFromLinkedRow(row({ totalCents: 78500 }), "auth@example.com");
    expect(booking.price.totalCents).toBe(78500);
  });

  it("falls back to $0 only when no total was ever cached", async () => {
    const booking = await bookingFromLinkedRow(row({ totalCents: null }), "auth@example.com");
    expect(booking.price.totalCents).toBe(0);
  });
});

describe("resolveAccountBooking", () => {
  it("returns the live lookup when Wizard succeeds", async () => {
    mockLookup.mockResolvedValue(liveBooking);
    const result = await resolveAccountBooking(row(), "auth@example.com", {
      allowTokenFallback: false,
    });
    expect(result.throttled).toBe(false);
    expect(result.booking).toBe(liveBooking);
    expect(mockStatusByToken).not.toHaveBeenCalled();
  });

  it("does not call status-by-token on the list path", async () => {
    mockLookup.mockRejectedValue(new Error("not found"));
    const result = await resolveAccountBooking(row(), "auth@example.com", {
      allowTokenFallback: false,
    });
    expect(mockStatusByToken).not.toHaveBeenCalled();
    expect(result.booking.ref).toBe("WRC-260818-F8Z4");
    expect(result.throttled).toBe(false);
  });

  it("returns a local stub and throttled when Wizard returns 429", async () => {
    mockLookup.mockRejectedValue(
      new WheelsThrottledError("https://wizard/lookup", { message: "Too Many Attempts." }, 55),
    );
    const result = await resolveAccountBooking(row(), "auth@example.com", {
      allowTokenFallback: false,
    });
    expect(result.throttled).toBe(true);
    expect(result.booking.ref).toBe("WRC-260818-F8Z4");
    expect(result.booking.state).toBe("pending");
    expect(mockStatusByToken).not.toHaveBeenCalled();
  });

  it("skips Wizard entirely when skipLiveLookup is set", async () => {
    const result = await resolveAccountBooking(row(), "auth@example.com", {
      skipLiveLookup: true,
    });
    expect(mockLookup).not.toHaveBeenCalled();
    expect(mockStatusByToken).not.toHaveBeenCalled();
    expect(result.booking.ref).toBe("WRC-260818-F8Z4");
  });

  it("skips Wizard for website-only cars and uses stored columns", async () => {
    mockLookup.mockResolvedValue(liveBooking);
    const result = await resolveAccountBooking(
      row({
        publicToken: null,
        frontendVehicleId: "manual-1",
        wizardVehicleId: null,
        vehicleMake: "NISSAN",
        vehicleModel: "MICRA",
        paymentMethod: "cash",
        baseRateCents: 40000,
        totalCents: 40000,
        state: "cancelled",
      }),
      "auth@example.com",
    );
    expect(mockLookup).not.toHaveBeenCalled();
    expect(result.booking.state).toBe("cancelled");
    expect(result.booking.price.totalCents).toBe(40000);
    expect(result.booking.return.datetime).toBe("2026-08-22T10:00:00.000Z");
  });

  it("does not let a Wizard pending status override a local cancellation", async () => {
    mockLookup.mockResolvedValue({ ...liveBooking, state: "pending" } as Booking);
    const result = await resolveAccountBooking(
      row({
        vehicleMake: "BMW",
        paymentMethod: "cash",
        baseRateCents: 45000,
        state: "cancelled",
      }),
      "auth@example.com",
      { allowTokenFallback: false },
    );
    expect(result.booking.state).toBe("cancelled");
    expect(result.booking.price.totalCents).toBe(45000);
  });
});
