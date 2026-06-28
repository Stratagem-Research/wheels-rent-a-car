import { describe, expect, it } from "vitest";
import { promoDiscountCents, validatePromoCodeFromRow } from "./promo";

describe("promo validation", () => {
  it("accepts active promo codes", () => {
    const result = validatePromoCodeFromRow(
      "summer15",
      {
        code: "SUMMER15",
        discount_percent: 15,
        active: true,
        starts_at: null,
        ends_at: null,
      },
      Date.parse("2026-06-01T00:00:00Z"),
    );
    expect(result).toEqual({ valid: true, code: "SUMMER15", discountPercent: 15 });
  });

  it("rejects inactive codes", () => {
    const result = validatePromoCodeFromRow("SUMMER15", {
      code: "SUMMER15",
      discount_percent: 15,
      active: false,
      starts_at: null,
      ends_at: null,
    });
    expect(result?.valid).toBe(false);
  });

  it("computes discount cents", () => {
    expect(promoDiscountCents(10_000, 15)).toBe(1500);
  });
});
