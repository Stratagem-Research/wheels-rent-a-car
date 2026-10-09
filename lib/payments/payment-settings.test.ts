import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAYMENT_SETTINGS,
  computeDayTiersCents,
  computeSurchargeCents,
  hasBankTransferDetails,
  matchDayTier,
  paymentSurchargeCents,
} from "./payment-settings";
import type { PaymentSettings, PaymentSurcharge } from "@/types/domain";

const settings = (over: Partial<PaymentSettings["surcharges"]>): PaymentSettings => ({
  ...DEFAULT_PAYMENT_SETTINGS,
  surcharges: { ...DEFAULT_PAYMENT_SETTINGS.surcharges, ...over },
});

describe("payments/payment-settings", () => {
  it("charges nothing when the mode is none", () => {
    expect(
      computeSurchargeCents(
        { mode: "none", amountCents: 500, percent: 5, dayTiers: [] },
        { baseCents: 10_000 },
      ),
    ).toBe(0);
  });

  it("charges a fixed amount regardless of the total", () => {
    const surcharge = {
      mode: "fixed",
      amountCents: 500,
      percent: 0,
      dayTiers: [],
    } satisfies PaymentSurcharge;
    expect(computeSurchargeCents(surcharge, { baseCents: 10_000 })).toBe(500);
    expect(computeSurchargeCents(surcharge, { baseCents: 90_000 })).toBe(500);
  });

  it("takes a percentage of the pre-surcharge total", () => {
    expect(
      computeSurchargeCents(
        { mode: "percent", amountCents: 0, percent: 2.5, dayTiers: [] },
        {
          baseCents: 10_000,
        },
      ),
    ).toBe(250);
  });

  it("never charges cash", () => {
    const configured = settings({
      transfer: { mode: "fixed", amountCents: 500, percent: 0, dayTiers: [] },
    });
    expect(paymentSurchargeCents({ method: "cash", settings: configured, baseCents: 10_000 })).toBe(
      0,
    );
  });

  it("applies the surcharge of the selected method only", () => {
    const configured = settings({
      transfer: { mode: "fixed", amountCents: 500, percent: 0, dayTiers: [] },
      omt: { mode: "percent", amountCents: 0, percent: 10, dayTiers: [] },
    });
    expect(
      paymentSurchargeCents({ method: "transfer", settings: configured, baseCents: 10_000 }),
    ).toBe(500);
    expect(paymentSurchargeCents({ method: "omt", settings: configured, baseCents: 10_000 })).toBe(
      1_000,
    );
    expect(paymentSurchargeCents({ method: "neo", settings: configured, baseCents: 10_000 })).toBe(
      0,
    );
  });

  it("multiplies a per-day charge by the rental length", () => {
    const surcharge = {
      mode: "per-day",
      amountCents: 250,
      percent: 0,
      dayTiers: [],
    } satisfies PaymentSurcharge;
    expect(computeSurchargeCents(surcharge, { baseCents: 10_000, days: 1 })).toBe(250);
    expect(computeSurchargeCents(surcharge, { baseCents: 10_000, days: 4 })).toBe(1_000);
    // A missing rental length is treated as a single day, never zero.
    expect(computeSurchargeCents(surcharge, { baseCents: 10_000 })).toBe(250);
  });

  it("charges each rental day at the rate of the band it falls in", () => {
    const surcharge = {
      mode: "day-tiers",
      amountCents: 0,
      percent: 0,
      dayTiers: [
        { startDay: 1, endDay: 3, perDayCents: 500 },
        { startDay: 4, endDay: 7, perDayCents: 1_200 },
        { startDay: 8, endDay: null, perDayCents: 2_000 },
      ],
    } satisfies PaymentSurcharge;
    // 1 day: 1 x 500.
    expect(computeSurchargeCents(surcharge, { baseCents: 10_000, days: 1 })).toBe(500);
    // 3 days: 3 x 500.
    expect(computeSurchargeCents(surcharge, { baseCents: 10_000, days: 3 })).toBe(1_500);
    // 4 days: 3 x 500 + 1 x 1_200.
    expect(computeSurchargeCents(surcharge, { baseCents: 10_000, days: 4 })).toBe(2_700);
    // 10 days: 3 x 500 + 4 x 1_200 + 3 x 2_000.
    expect(computeSurchargeCents(surcharge, { baseCents: 10_000, days: 10 })).toBe(12_300);
  });

  it("skips days no band covers", () => {
    const surcharge = {
      mode: "day-tiers",
      amountCents: 0,
      percent: 0,
      dayTiers: [{ startDay: 5, endDay: 7, perDayCents: 900 }],
    } satisfies PaymentSurcharge;
    // Days 1-4 and 8-9 fall outside the only band, so only days 5-7 are charged.
    expect(computeSurchargeCents(surcharge, { baseCents: 10_000, days: 2 })).toBe(0);
    expect(computeSurchargeCents(surcharge, { baseCents: 10_000, days: 6 })).toBe(1_800);
    expect(computeSurchargeCents(surcharge, { baseCents: 10_000, days: 9 })).toBe(2_700);
    expect(computeDayTiersCents([], 9)).toBe(0);
    expect(matchDayTier(surcharge.dayTiers, 6)?.perDayCents).toBe(900);
    expect(matchDayTier(surcharge.dayTiers, 2)).toBeNull();
  });

  it("picks the day band per method through paymentSurchargeCents", () => {
    const configured = settings({
      transfer: {
        mode: "day-tiers",
        amountCents: 0,
        percent: 0,
        dayTiers: [
          { startDay: 1, endDay: 2, perDayCents: 300 },
          { startDay: 3, endDay: null, perDayCents: 800 },
        ],
      },
    });
    expect(
      paymentSurchargeCents({
        method: "transfer",
        settings: configured,
        baseCents: 10_000,
        days: 2,
      }),
    ).toBe(600);
    expect(
      paymentSurchargeCents({
        method: "transfer",
        settings: configured,
        baseCents: 10_000,
        days: 5,
      }),
    ).toBe(3_000);
  });

  it("falls back to no surcharge without settings", () => {
    expect(paymentSurchargeCents({ method: "transfer", baseCents: 10_000 })).toBe(0);
  });

  it("treats blank bank details as unset", () => {
    expect(hasBankTransferDetails(DEFAULT_PAYMENT_SETTINGS)).toBe(false);
    expect(
      hasBankTransferDetails({
        ...DEFAULT_PAYMENT_SETTINGS,
        bankTransfer: { ...DEFAULT_PAYMENT_SETTINGS.bankTransfer, iban: "LB01" },
      }),
    ).toBe(true);
  });
});
