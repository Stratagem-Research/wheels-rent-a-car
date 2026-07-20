import type { MileagePlan, RateType } from "@/types/domain";

/** Default rate on collapsed cards and pay-now in the expanded panel. */
export const FLEET_PAY_NOW_RATE: { type: RateType; mileage: MileagePlan } = {
  type: "best-price",
  mileage: "capped-200km",
};

/** Pay-later bundle in the expanded panel (flexible + same mileage cap). */
export const FLEET_PAY_LATER_RATE: { type: RateType; mileage: MileagePlan } = {
  type: "flexible",
  mileage: "capped-200km",
};
