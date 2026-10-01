import { describe, expect, it } from "vitest";
import {
  DEFAULT_PAYMENT_SETTINGS,
  computeSurchargeCents,
  hasBankTransferDetails,
  paymentSurchargeCents,
} from "./payment-settings";
import type { PaymentSettings } from "@/types/domain";

const settings = (over: Partial<PaymentSettings["surcharges"]>): PaymentSettings => ({
  ...DEFAULT_PAYMENT_SETTINGS,
  surcharges: { ...DEFAULT_PAYMENT_SETTINGS.surcharges, ...over },
});

describe("payments/payment-settings", () => {
  it("charges nothing when the mode is none", () => {
    expect(
      computeSurchargeCents({ mode: "none", amountCents: 500, percent: 5 }, { baseCents: 10_000 }),
    ).toBe(0);
  });

  it("charges a fixed amount regardless of the total", () => {
    const surcharge = { mode: "fixed", amountCents: 500, percent: 0 } as const;
    expect(computeSurchargeCents(surcharge, { baseCents: 10_000 })).toBe(500);
    expect(computeSurchargeCents(surcharge, { baseCents: 90_000 })).toBe(500);
  });

  it("takes a percentage of the pre-surcharge total", () => {
    expect(
      computeSurchargeCents({ mode: "percent", amountCents: 0, percent: 2.5 }, {
        baseCents: 10_000,
      }),
    ).toBe(250);
  });

  it("never charges cash", () => {
    const configured = settings({ transfer: { mode: "fixed", amountCents: 500, percent: 0 } });
    expect(
      paymentSurchargeCents({ method: "cash", settings: configured, baseCents: 10_000 }),
    ).toBe(0);
  });

  it("applies the surcharge of the selected method only", () => {
    const configured = settings({
      transfer: { mode: "fixed", amountCents: 500, percent: 0 },
      omt: { mode: "percent", amountCents: 0, percent: 10 },
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
