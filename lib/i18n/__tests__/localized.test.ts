import { describe, expect, it } from "vitest";
import { getLocalizedString, toLocalizedString, toLocalizedStringArray } from "../localized";

describe("toLocalizedString", () => {
  it("keeps a normal locale map", () => {
    expect(toLocalizedString({ en: "Booking", ar: "الحجز", fr: "Réservation" })).toEqual({
      en: "Booking",
      ar: "الحجز",
      fr: "Réservation",
    });
  });

  it("wraps a plain string as English", () => {
    expect(toLocalizedString("Pickup")).toEqual({ en: "Pickup" });
  });

  it("parses a JSON string locale map", () => {
    expect(toLocalizedString('{"en":"Payment","ar":"الدفع","fr":"Paiement"}')).toEqual({
      en: "Payment",
      ar: "الدفع",
      fr: "Paiement",
    });
  });

  it("unwraps jsonb_build_object wrapping of a JSON string", () => {
    expect(
      toLocalizedString({
        en: '{"en":"How do I book a car?","ar":"كيف أحجز سيارة؟","fr":"Comment réserver ?"}',
      }),
    ).toEqual({
      en: "How do I book a car?",
      ar: "كيف أحجز سيارة؟",
      fr: "Comment réserver ?",
    });
  });

  it("unwraps a nested locale object stuffed into en", () => {
    expect(
      toLocalizedString({
        en: { en: "Insurance", ar: "التأمين", fr: "Assurance" },
      }),
    ).toEqual({
      en: "Insurance",
      ar: "التأمين",
      fr: "Assurance",
    });
  });
});

describe("getLocalizedString", () => {
  it("returns the active locale after unwrapping a migration-wrapped value", () => {
    const wrapped = {
      en: '{"en":"Can I book without an account?","ar":"هل يمكنني الحجز بدون حساب؟","fr":"Sans compte ?"}',
    };
    expect(getLocalizedString(wrapped, "en")).toBe("Can I book without an account?");
    expect(getLocalizedString(wrapped, "ar")).toBe("هل يمكنني الحجز بدون حساب؟");
    expect(getLocalizedString(wrapped, "fr")).toBe("Sans compte ?");
  });
});

describe("toLocalizedStringArray", () => {
  it("unwraps a JSON string stuffed into en", () => {
    expect(toLocalizedStringArray({ en: '{"en":["Airport","City"]}' })).toEqual({
      en: ["Airport", "City"],
    });
  });
});
