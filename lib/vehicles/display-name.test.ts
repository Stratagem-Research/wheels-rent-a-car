import { describe, expect, it } from "vitest";
import { composeVehicleTitle, vehicleDisplayName } from "./display-name";

describe("composeVehicleTitle", () => {
  it("joins brand and model", () => {
    expect(composeVehicleTitle("Kia", "Rio")).toBe("Kia Rio");
  });
});

describe("vehicleDisplayName", () => {
  it("shows brand and model", () => {
    expect(vehicleDisplayName({ make: "Kia", model: "Rio", title: "Ignored" })).toBe("Kia Rio");
  });

  it("falls back to title when brand and model are empty", () => {
    expect(vehicleDisplayName({ make: "", model: "", title: "Custom" })).toBe("Custom");
  });
});
