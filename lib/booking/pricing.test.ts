import { describe, expect, it } from "vitest";
import {
  computePrice,
  formatUsd,
  generateBookingRef,
  isWithinOnlineBookingWindow,
  perDayRate,
  rentalDays,
} from "./pricing";
import { VEHICLES } from "@/lib/api/mocks/fixtures/vehicles";
import { ADD_ONS, PROTECTION_TIERS } from "@/lib/api/mocks/fixtures/catalog";
import type { BookingDraft } from "@/types/domain";

const yaris = VEHICLES.find((v) => v.slug === "toyota-yaris")!;

function draft(overrides: Partial<BookingDraft> = {}): BookingDraft {
  return {
    pickup: { type: "airport", locationId: "br-bey", datetime: "2026-05-20T10:00" },
    return: { locationId: "br-bey", datetime: "2026-05-25T10:00" },
    vehicle: { vehicleId: yaris.id, rate: { type: "best-price", mileage: "capped-200km" } },
    extras: [],
    protectionTierId: "pt-basic",
    marketingConsent: false,
    whatsappOptIn: true,
    ...overrides,
  };
}

describe("booking/pricing", () => {
  it("computes a 5-day base rate at the from-price for best-price + capped", () => {
    const price = computePrice({
      draft: draft(),
      vehicle: yaris,
      addOns: ADD_ONS,
      tiers: PROTECTION_TIERS,
    });
    expect(rentalDays("2026-05-20T10:00", "2026-05-25T10:00")).toBe(5);
    expect(price.baseRateCents).toBe(yaris.dailyRateFromCents * 5);
  });

  it("flexible rate adds 15% per day", () => {
    expect(perDayRate(yaris, "flexible", "capped-200km")).toBe(
      Math.round(yaris.dailyRateFromCents * 1.15),
    );
  });

  it("unlimited mileage adds 10% per day", () => {
    expect(perDayRate(yaris, "best-price", "unlimited")).toBe(
      Math.round(yaris.dailyRateFromCents * 1.1),
    );
  });

  it("rolls in extras priced per-day", () => {
    const babySeat = ADD_ONS.find((a) => a.id === "ao-baby-seat")!;
    const result = computePrice({
      draft: draft({ extras: [{ addOnId: babySeat.id, qty: 1 }] }),
      vehicle: yaris,
      addOns: ADD_ONS,
      tiers: PROTECTION_TIERS,
    });
    expect(result.extrasCents).toBe(babySeat.priceCents * 5);
  });

  it("applies the SUMMER15 discount", () => {
    const noPromo = computePrice({
      draft: draft(),
      vehicle: yaris,
      addOns: ADD_ONS,
      tiers: PROTECTION_TIERS,
    });
    const withPromo = computePrice({
      draft: draft({ promoCode: "SUMMER15" }),
      vehicle: yaris,
      addOns: ADD_ONS,
      tiers: PROTECTION_TIERS,
      promoDiscountPercent: 15,
    });
    expect(withPromo.discountCents).toBeGreaterThan(0);
    expect(withPromo.totalCents).toBeLessThan(noPromo.totalCents);
  });

  it("returns the empty breakdown when no vehicle is set", () => {
    const result = computePrice({
      draft: { ...draft(), vehicle: undefined },
      addOns: ADD_ONS,
      tiers: PROTECTION_TIERS,
    });
    expect(result.totalCents).toBe(0);
  });

  it("formats cents to USD with no trailing zeros for whole dollars", () => {
    expect(formatUsd(2500)).toBe("$25");
    expect(formatUsd(2599)).toBe("$25.99");
  });

  it("generates a ref that matches WRC-YYMMDD-XXXX", () => {
    const ref = generateBookingRef(new Date("2026-05-20T10:00:00.000Z"));
    expect(ref).toMatch(/^WRC-260520-[A-Z0-9]{4}$/);
  });
});


describe("isWithinOnlineBookingWindow", () => {
  it("allows rentals up to 92 days", () => {
    expect(isWithinOnlineBookingWindow("2026-05-01T10:00", "2026-06-01T10:00")).toBe(true);
  });

  it("rejects rentals longer than 92 days", () => {
    expect(isWithinOnlineBookingWindow("2026-05-01T10:00", "2026-09-01T10:00")).toBe(false);
  });
});
