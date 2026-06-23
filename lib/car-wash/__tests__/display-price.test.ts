import { describe, expect, it } from "vitest";
import { CAR_WASH_PACKAGES } from "@/lib/api/mocks/fixtures/catalog";
import {
  formatCarWashPackagePrice,
  formatDurationMinutes,
  resolveCarWashPrice,
} from "@/lib/car-wash/display-price";
import { formatLbp, formatMoney } from "@/lib/booking/pricing";

describe("formatLbp", () => {
  it("formats whole LBP amounts with separators", () => {
    expect(formatLbp(600_000)).toBe("600,000 LBP");
    expect(formatLbp(700_000)).toBe("700,000 LBP");
  });
});

describe("formatMoney", () => {
  it("formats USD cents and LBP whole amounts", () => {
    expect(formatMoney(1500, "USD")).toBe("$15");
    expect(formatMoney(600_000, "LBP")).toBe("600,000 LBP");
  });
});

describe("car wash package pricing", () => {
  const labels = { car: "Car", suv: "SUV", quoteOnRequest: "Quote on request" };

  it("shows car and SUV LBP prices for normal wash", () => {
    const pkg = CAR_WASH_PACKAGES.find((p) => p.id === "normal-wash")!;
    expect(formatCarWashPackagePrice(pkg, labels)).toContain("600,000 LBP");
    expect(formatCarWashPackagePrice(pkg, labels)).toContain("700,000 LBP");
  });

  it("resolves SUV price for by-vehicle-class package", () => {
    const pkg = CAR_WASH_PACKAGES.find((p) => p.id === "normal-wash")!;
    expect(resolveCarWashPrice(pkg, "suv")?.label).toBe("700,000 LBP");
  });

  it("formats wedding package at $50", () => {
    const pkg = CAR_WASH_PACKAGES.find((p) => p.id === "wedding-detailing")!;
    expect(formatCarWashPackagePrice(pkg, labels)).toBe("$50");
  });

  it("formats duration labels", () => {
    expect(formatDurationMinutes(30)).toBe("30 min");
    expect(formatDurationMinutes(180)).toBe("3 hr");
  });
});
