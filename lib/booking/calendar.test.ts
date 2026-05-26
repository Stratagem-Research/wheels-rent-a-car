import { describe, expect, it } from "vitest";
import { bookingToIcs } from "./calendar";
import type { Booking } from "@/types/domain";

const baseBooking: Booking = {
  ref: "WRC-260520-9KQ4",
  state: "confirmed",
  createdAt: "2026-05-15T08:00:00.000Z",
  pickup: { type: "airport", locationId: "br-bey", datetime: "2026-05-20T10:00:00.000Z" },
  return: { locationId: "br-bey", datetime: "2026-05-25T10:00:00.000Z" },
  vehicle: { vehicleId: "veh-yaris", rate: { type: "best-price", mileage: "capped-200km" } },
  vehicleSnapshot: {
    id: "veh-yaris",
    slug: "toyota-yaris",
    make: "Toyota",
    model: "Yaris",
    year: 2024,
    category: "economy",
    images: [{ url: "/x.svg", alt: "Yaris", width: 100, height: 75 }],
  },
  extras: [],
  protectionTierId: "pt-basic",
  driver: {
    firstName: "Demo",
    lastName: "User",
    email: "demo@example.com",
    phone: "+96170123456",
    dob: "1990-01-01",
    licenceNumber: "LB12345",
    licenceIssue: "2018-01-01",
    licenceExpiry: "2028-01-01",
    country: "LB",
  },
  paymentMethod: "card",
  marketingConsent: false,
  whatsappOptIn: true,
  price: {
    baseRateCents: 12500,
    extrasCents: 0,
    protectionCents: 0,
    taxesCents: 1375,
    feesCents: 0,
    discountCents: 0,
    totalCents: 13875,
    depositCents: 30000,
  },
  currency: "USD",
};

describe("booking/calendar", () => {
  it("emits valid ICS with VCALENDAR + two VEVENT blocks", () => {
    const ics = bookingToIcs(baseBooking, "Beirut Airport (BEY)", "Beirut Airport (BEY)");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(2);
    expect(ics.match(/END:VEVENT/g)?.length).toBe(2);
    expect(ics).toContain("SUMMARY:Wheels: pickup Toyota Yaris");
    expect(ics).toContain("SUMMARY:Wheels: return Toyota Yaris");
  });

  it("encodes the pickup and return locations", () => {
    const ics = bookingToIcs(baseBooking, "Hamra branch", "Downtown Beirut");
    expect(ics).toContain("LOCATION:Hamra branch");
    expect(ics).toContain("LOCATION:Downtown Beirut");
  });
});
