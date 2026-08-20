import { describe, expect, it } from "vitest";
import { preserveWebsiteBrandModel } from "./preserve-fleet-names";

describe("preserveWebsiteBrandModel", () => {
  it("keeps website brand and model when they differ from the last Wizard names", () => {
    const previous = [
      {
        frontend_vehicle_id: "wiz-1",
        brand: "Kia",
        model: "Rio",
        wizard_brand: "Toyota",
        wizard_model: "Yaris",
      },
    ];
    const incoming = [
      {
        frontend_vehicle_id: "wiz-1",
        brand: "Toyota",
        model: "Yaris",
        wizard_brand: "Toyota",
        wizard_model: "Yaris",
      },
    ];
    expect(preserveWebsiteBrandModel(previous, incoming)).toEqual([
      {
        frontend_vehicle_id: "wiz-1",
        brand: "Kia",
        model: "Rio",
        wizard_brand: "Toyota",
        wizard_model: "Yaris",
      },
    ]);
  });

  it("follows Wizard names when the form was never customized", () => {
    const previous = [
      {
        frontend_vehicle_id: "wiz-1",
        brand: "Toyota",
        model: "Yaris",
        wizard_brand: "Toyota",
        wizard_model: "Yaris",
      },
    ];
    const incoming = [
      {
        frontend_vehicle_id: "wiz-1",
        brand: "Honda",
        model: "Civic",
        wizard_brand: "Honda",
        wizard_model: "Civic",
      },
    ];
    expect(preserveWebsiteBrandModel(previous, incoming)).toEqual(incoming);
  });
});
