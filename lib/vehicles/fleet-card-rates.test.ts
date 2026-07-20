import { describe, expect, it } from "vitest";
import { perDayRate } from "@/lib/booking/pricing";
import { VEHICLES } from "@/lib/api/fixtures/vehicles";
import { FLEET_PAY_LATER_RATE, FLEET_PAY_NOW_RATE } from "@/lib/vehicles/fleet-card-rates";

const yaris = VEHICLES.find((v) => v.slug === "toyota-yaris")!;

describe("fleet card rates", () => {
  it("pay-now expanded price matches collapsed card (no unlimited surcharge)", () => {
    const card = perDayRate(yaris, FLEET_PAY_NOW_RATE.type, FLEET_PAY_NOW_RATE.mileage);
    const expandedPayNow = perDayRate(yaris, FLEET_PAY_NOW_RATE.type, FLEET_PAY_NOW_RATE.mileage);
    expect(expandedPayNow).toBe(card);
    expect(expandedPayNow).toBeLessThan(
      perDayRate(yaris, FLEET_PAY_NOW_RATE.type, "unlimited"),
    );
  });

  it("pay-later adds flexible surcharge only, not unlimited mileage", () => {
    const payNow = perDayRate(yaris, FLEET_PAY_NOW_RATE.type, FLEET_PAY_NOW_RATE.mileage);
    const payLater = perDayRate(
      yaris,
      FLEET_PAY_LATER_RATE.type,
      FLEET_PAY_LATER_RATE.mileage,
    );
    expect(payLater).toBeGreaterThan(payNow);
    expect(payLater).toBe(Math.round(yaris.dailyRateFromCents * 1.15));
  });
});
