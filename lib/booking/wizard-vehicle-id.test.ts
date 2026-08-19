import { describe, expect, it } from "vitest";
import {
  frontendVehicleIdFromWizard,
  parseWizardVehicleId,
  slugifyVehicleName,
  parseWizardIdInput,
  newManualVehicleId,
  normalizeManualUnitId,
  displayManualUnitId,
} from "./wizard-vehicle-id";

describe("wizard-vehicle-id", () => {
  it("round-trips wizard ids", () => {
    expect(frontendVehicleIdFromWizard(131)).toBe("wiz-131");
    expect(parseWizardVehicleId("wiz-131")).toBe(131);
  });

  it("rejects non-wiz ids", () => {
    expect(parseWizardVehicleId("veh-yaris")).toBeNull();
  });

  it("parses typed Wizard ids", () => {
    expect(parseWizardIdInput("131")).toBe(131);
    expect(parseWizardIdInput("wiz-131")).toBe(131);
    expect(parseWizardIdInput(" 131 ")).toBe(131);
    expect(parseWizardVehicleId("240")).toBe(240);
    expect(parseWizardIdInput("0")).toBeNull();
    expect(parseWizardIdInput("manual-1")).toBeNull();
  });

  it("slugifies display names", () => {
    expect(slugifyVehicleName("Toyota Yaris")).toBe("toyota-yaris");
  });

  it("creates unique website-only vehicle ids", () => {
    expect(newManualVehicleId()).toMatch(/^manual-[0-9a-f-]{36}$/i);
    expect(newManualVehicleId()).not.toBe(newManualVehicleId());
  });

  it("normalizes typed manual unit ids", () => {
    expect(normalizeManualUnitId(" PLATE 12 ")).toBe("manual-PLATE-12");
    expect(normalizeManualUnitId("manual-MICRA-1")).toBe("manual-MICRA-1");
    expect(normalizeManualUnitId("131")).toBeNull();
    expect(normalizeManualUnitId("wiz-131")).toBeNull();
    expect(normalizeManualUnitId("")).toBeNull();
    expect(normalizeManualUnitId("bad id!")).toBeNull();
    expect(displayManualUnitId("manual-MICRA-1")).toBe("MICRA-1");
    expect(displayManualUnitId("manual-PLATE-12")).toBe("PLATE-12");
  });
});
