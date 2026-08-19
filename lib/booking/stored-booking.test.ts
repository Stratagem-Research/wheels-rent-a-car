import { describe, expect, it } from "vitest";
import {
  bookingFromStoredRow,
  compactStoredBookingToDb,
  emptyStoredBookingFields,
  hasStoredBookingDetails,
  mapStoredBookingFields,
  storedBookingFromDomain,
  storedBookingToDb,
} from "./stored-booking";
import type { Booking } from "@/types/domain";

const booking = {
  ref: "WRC-260819-ABCD",
  state: "pending",
  createdAt: "2026-08-19T10:00:00.000Z",
  pickup: { type: "branch", datetime: "2026-08-20T10:00:00.000Z", locationId: "br-hazmieh" },
  return: { datetime: "2026-08-22T10:00:00.000Z", locationId: "br-hazmieh" },
  vehicle: { vehicleId: "manual-1", rate: { type: "best-price", mileage: "capped-200km" } },
  vehicleSnapshot: {
    id: "manual-1",
    slug: "nissan-micra",
    make: "NISSAN",
    model: "MICRA",
    year: 2018,
    category: "economy",
    images: [{ url: "/a.jpg", alt: "A", width: 10, height: 10 }],
  },
  extras: [{ addOnId: "gps", qty: 1 }],
  protectionTierId: "pt-basic",
  driver: {
    firstName: "Ada",
    lastName: "Lovelace",
    email: "a@example.com",
    phone: "+9617",
    dob: "1990-01-01",
    licenceNumber: "X",
    licenceIssue: "2020-01-01",
    licenceExpiry: "2030-01-01",
    country: "LB",
  },
  paymentMethod: "cash",
  marketingConsent: false,
  whatsappOptIn: false,
  price: {
    baseRateCents: 4000,
    extrasCents: 500,
    protectionCents: 0,
    taxesCents: 0,
    feesCents: 0,
    discountCents: 0,
    totalCents: 4500,
    depositCents: 0,
  },
  currency: "USD",
} satisfies Booking;

describe("stored booking columns", () => {
  it("round-trips domain booking through db columns", () => {
    const fields = storedBookingFromDomain(booking);
    const mapped = mapStoredBookingFields(storedBookingToDb(fields));
    const restored = bookingFromStoredRow(
      {
        ...mapped,
        bookingReference: booking.ref,
        publicToken: null,
        customerEmail: booking.driver.email,
        createdAt: booking.createdAt,
        pickupAt: booking.pickup.datetime,
        returnAt: booking.return.datetime,
        frontendVehicleId: booking.vehicle.vehicleId,
      },
      "auth@example.com",
    );
    expect(restored.vehicleSnapshot.make).toBe("NISSAN");
    expect(restored.extras).toEqual([{ addOnId: "gps", qty: 1 }]);
    expect(restored.price.totalCents).toBe(4500);
    expect(restored.driver.firstName).toBe("Ada");
    expect(restored.paymentMethod).toBe("cash");
  });

  it("omits nulls when writing", () => {
    const db = compactStoredBookingToDb({
      ...emptyStoredBookingFields(),
      vehicleMake: "NISSAN",
      totalCents: 4500,
    });
    expect(db).toEqual({ vehicle_make: "NISSAN", total_cents: 4500 });
  });

  it("detects whether detail columns were filled", () => {
    expect(hasStoredBookingDetails(emptyStoredBookingFields())).toBe(false);
    expect(hasStoredBookingDetails({ ...emptyStoredBookingFields(), vehicleMake: "NISSAN" })).toBe(true);
  });
});
