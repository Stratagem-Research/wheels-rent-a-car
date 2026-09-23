import { describe, expect, it } from "vitest";
import {
  applyWebsiteVehicleToLookup,
  displayNameFromLookupVehicle,
  matchFixtureForLookupVehicle,
  toBookingFromLookup,
} from "./lookup-adapter";

const rioLookup = {
  reference: "WRC-260812-N93K",
  status: "pending_approval",
  start_date_time: "2026-08-13 10:00:00",
  end_date_time: "2026-08-16 10:00:00",
  customer: {
    name: "Test Customer",
    email: "guest@example.com",
    phone_number: "+96170123457",
  },
  vehicle: { id: 137, name: "RIO", model: "RIO" },
  amount: 176,
};

describe("lookup-adapter", () => {
  it("maps Wizard RIO to Kia Rio, not Toyota Yaris", () => {
    const booking = toBookingFromLookup(rioLookup);
    expect(booking.vehicleSnapshot.make).toBe("Kia");
    expect(booking.vehicleSnapshot.model).toBe("Rio");
    expect(booking.vehicleSnapshot.slug).toBe("kia-rio");
    expect(booking.vehicle.vehicleId).toBe("wiz-137");
  });

  it("uses Wizard name when no fixture matches, never VEHICLES[0]", () => {
    const booking = toBookingFromLookup({
      ...rioLookup,
      vehicle: { id: 999, name: "Mystery Van", model: "Mystery Van" },
    });
    expect(booking.vehicleSnapshot.make).toBe("Mystery Van");
    expect(booking.vehicleSnapshot.model).toBe("");
    expect(booking.vehicleSnapshot.make).not.toBe("Toyota");
  });

  it("title-cases a single Wizard name", () => {
    expect(displayNameFromLookupVehicle({ name: "RIO", model: "RIO" })).toEqual({
      make: "Rio",
      model: "",
    });
  });

  it("matches fixture by model, not by make === name", () => {
    const match = matchFixtureForLookupVehicle({ id: 137, name: "RIO", model: "RIO" });
    expect(match?.slug).toBe("kia-rio");
  });

  it("overlays website catalog vehicle by wiz-{id} for confirmation/lookup", () => {
    const booking = toBookingFromLookup(rioLookup);
    const hydrated = applyWebsiteVehicleToLookup(booking, 137, [
      {
        id: "wiz-137",
        slug: "kia-rio",
        make: "Kia",
        model: "Rio",
        year: 2018,
        category: "economy",
        transmission: "automatic",
        fuel: "petrol",
        seats: 5,
        doors: 4,
        bags: 3,
        features: [],
        images: [{ url: "/images/Car Images/kia-rio-2018-.png", alt: "Kia Rio", width: 1080, height: 810 }],
        dailyRateFromCents: 2500,
        ownsInFleet: true,
      },
    ]);
    expect(hydrated.vehicleSnapshot.make).toBe("Kia");
    expect(hydrated.vehicleSnapshot.model).toBe("Rio");
    expect(hydrated.vehicle.vehicleId).toBe("wiz-137");
  });
});
