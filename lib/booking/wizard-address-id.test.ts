import { describe, expect, it } from "vitest";
import {
  resolveWizardAddressForBooking,
  resolveWizardAddressId,
  UnmappedWizardAddressError,
} from "@/lib/booking/wizard-address-id";

describe("wizard-address-id", () => {
  it("maps known branch slugs to Wizard numeric ids", () => {
    expect(resolveWizardAddressId("br-hazmieh")).toBe(1);
    expect(resolveWizardAddressId("br-bey-airport")).toBe(2);
  });

  it("returns undefined for unknown slugs", () => {
    expect(resolveWizardAddressId("br-bey")).toBeUndefined();
  });

  it("resolveWizardAddressForBooking uses numeric id for branches", () => {
    expect(
      resolveWizardAddressForBooking({
        type: "branch",
        locationId: "br-hazmieh",
        datetime: "2026-07-21T10:00",
      }),
    ).toBe(1);
  });

  it("resolveWizardAddressForBooking uses freeform address for delivery", () => {
    expect(
      resolveWizardAddressForBooking({
        type: "address-delivery",
        address: "Hamra St",
        datetime: "2026-07-21T10:00",
      }),
    ).toBe("Hamra St");
  });

  it("throws UnmappedWizardAddressError for unknown branch without address", () => {
    expect(() =>
      resolveWizardAddressForBooking({
        type: "branch",
        locationId: "br-bey",
        datetime: "2026-07-21T10:00",
      }),
    ).toThrow(UnmappedWizardAddressError);
  });
});
