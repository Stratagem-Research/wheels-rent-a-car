import { describe, expect, it } from "vitest";
import {
  computePrice,
  formatUsd,
  generateBookingRef,
  isWithinOnlineBookingWindow,
  perDayRate,
  rentalDays,
} from "./pricing";
import { VEHICLES } from "@/lib/api/fixtures/vehicles";
import { ADD_ONS, PROTECTION_TIERS } from "@/lib/api/fixtures/catalog";
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
  it("rentalDays uses calendar dates for SearchBar datetimes (timezone-safe)", () => {
    expect(rentalDays("2026-07-23T10:00", "2026-07-24T10:00")).toBe(1);
    expect(rentalDays("2026-07-23T10:00", "2026-07-25T10:00")).toBe(2);
  });

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
    const extraDriver = ADD_ONS.find((a) => a.id === "ao-extra-driver")!;
    const result = computePrice({
      draft: draft({ extras: [{ addOnId: extraDriver.id, qty: 1 }] }),
      vehicle: yaris,
      addOns: ADD_ONS,
      tiers: PROTECTION_TIERS,
    });
    expect(result.extrasCents).toBe(extraDriver.priceCents * 5);
  });

  it("charges child seats once per rental, not per day", () => {
    const baby = ADD_ONS.find((a) => a.id === "ao-baby-seat")!;
    const booster = ADD_ONS.find((a) => a.id === "ao-booster-seat")!;
    const child = ADD_ONS.find((a) => a.id === "ao-child-seat")!;
    expect(baby.pricing).toBe("per-rental");
    expect(booster.pricing).toBe("per-rental");
    expect(child.pricing).toBe("per-rental");

    const result = computePrice({
      draft: draft({
        extras: [
          { addOnId: baby.id, qty: 1 },
          { addOnId: booster.id, qty: 2 },
          { addOnId: child.id, qty: 1 },
        ],
      }),
      vehicle: yaris,
      addOns: ADD_ONS,
      tiers: PROTECTION_TIERS,
    });
    expect(result.extrasCents).toBe(baby.priceCents + booster.priceCents * 2 + child.priceCents);
  });

  it("charges the 22 GB hotspot once per rental", () => {
    const wifi = ADD_ONS.find((a) => a.id === "ao-wifi")!;
    expect(wifi.pricing).toBe("per-rental");
    const result = computePrice({
      draft: draft({ extras: [{ addOnId: wifi.id, qty: 1 }] }),
      vehicle: yaris,
      addOns: ADD_ONS,
      tiers: PROTECTION_TIERS,
    });
    expect(result.extrasCents).toBe(wifi.priceCents);
  });

  it("charges custom WiFi data per GB for the rental", () => {
    const custom = ADD_ONS.find((a) => a.id === "ao-wifi-custom")!;
    expect(custom.quantityUnit).toBe("gb");
    expect(custom.pricing).toBe("per-rental");
    const result = computePrice({
      draft: draft({ extras: [{ addOnId: custom.id, qty: 40 }] }),
      vehicle: yaris,
      addOns: ADD_ONS,
      tiers: PROTECTION_TIERS,
    });
    expect(result.extrasCents).toBe(custom.priceCents * 40);
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
