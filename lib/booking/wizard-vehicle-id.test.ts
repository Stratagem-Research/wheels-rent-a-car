import { describe, expect, it } from "vitest";
import {
  frontendVehicleIdFromWizard,
  parseWizardVehicleId,
  slugifyVehicleName,
} from "./wizard-vehicle-id";

describe("wizard-vehicle-id", () => {
  it("round-trips wizard ids", () => {
    expect(frontendVehicleIdFromWizard(131)).toBe("wiz-131");
    expect(parseWizardVehicleId("wiz-131")).toBe(131);
  });

  it("rejects non-wiz ids", () => {
    expect(parseWizardVehicleId("veh-yaris")).toBeNull();
  });

  it("slugifies display names", () => {
    expect(slugifyVehicleName("Toyota Yaris")).toBe("toyota-yaris");
  });
});
