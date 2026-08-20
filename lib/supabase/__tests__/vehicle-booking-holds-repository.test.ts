import { describe, expect, it } from "vitest";
import { fleetVehicleLabel, holdInventoryStatus, toHoldIso } from "../vehicle-booking-holds-repository";

describe("toHoldIso", () => {
  it("treats SearchBar local datetimes as Asia/Beirut", () => {
    expect(toHoldIso("2026-07-21T10:00")).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("accepts Wizard backend datetimes", () => {
    expect(toHoldIso("2026-07-21 10:00")).toBe(toHoldIso("2026-07-21T10:00"));
  });

  it("passes through UTC ISO", () => {
    expect(toHoldIso("2026-07-21T07:00:00.000Z")).toBe("2026-07-21T07:00:00.000Z");
  });
});

describe("holdInventoryStatus", () => {
  const now = new Date("2026-08-18T12:00:00.000Z");

  it("marks a live rental as on-rent", () => {
    expect(
      holdInventoryStatus("2026-08-17T10:00:00.000Z", "2026-08-20T10:00:00.000Z", now),
    ).toBe("on-rent");
  });

  it("marks a future hold as upcoming", () => {
    expect(
      holdInventoryStatus("2026-09-01T10:00:00.000Z", "2026-09-05T10:00:00.000Z", now),
    ).toBe("upcoming");
  });

  it("marks a returned car as ended", () => {
    expect(
      holdInventoryStatus("2026-08-01T10:00:00.000Z", "2026-08-10T10:00:00.000Z", now),
    ).toBe("ended");
  });
});

describe("fleetVehicleLabel", () => {
  it("prefers website brand and model over Wizard names", () => {
    expect(
      fleetVehicleLabel(
        { brand: "Toyota", model: "Yaris", display_name: "Toyota Yaris" },
        { brand: "Kia", model: "Rio" },
      ),
    ).toBe("Kia Rio");
  });

  it("falls back to Wizard when website metadata has no name", () => {
    expect(
      fleetVehicleLabel({ brand: "Toyota", model: "Yaris", display_name: "Toyota Yaris" }, {}),
    ).toBe("Toyota Yaris");
  });
});
