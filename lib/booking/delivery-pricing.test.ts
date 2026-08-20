import { describe, expect, it } from "vitest";
import {
  computeDeliveryFeeCents,
  DEFAULT_DELIVERY_PRICING_SETTINGS,
  haversineDistanceKm,
  nearestBranchDistanceKm,
} from "./delivery-pricing";
import { BRANCHES } from "@/lib/api/fixtures/branches";

const hazmieh = BRANCHES.find((b) => b.id === "br-hazmieh")!;

describe("booking/delivery-pricing", () => {
  it("returns 0 distance for the same point", () => {
    expect(haversineDistanceKm(hazmieh, hazmieh)).toBeCloseTo(0, 5);
  });

  it("finds the nearest of several branches", () => {
    const near = { lat: hazmieh.lat + 0.001, lng: hazmieh.lng + 0.001 };
    const far = [{ ...hazmieh, id: "far", lat: hazmieh.lat + 5, lng: hazmieh.lng + 5 }, hazmieh];
    expect(nearestBranchDistanceKm(near, far)).toBeLessThan(1);
  });

  it("charges only the base fee within the free radius", () => {
    const point = { lat: hazmieh.lat + 0.005, lng: hazmieh.lng }; // ~0.5km
    const cents = computeDeliveryFeeCents(point, [hazmieh]);
    expect(cents).toBe(DEFAULT_DELIVERY_PRICING_SETTINGS.baseFeeCents);
  });

  it("adds a per-km surcharge beyond the free radius", () => {
    // ~0.111km per 0.001deg lat; use a delta well beyond the 5km default radius.
    const point = { lat: hazmieh.lat + 0.15, lng: hazmieh.lng };
    const distanceKm = haversineDistanceKm(point, hazmieh);
    expect(distanceKm).toBeGreaterThan(DEFAULT_DELIVERY_PRICING_SETTINGS.freeRadiusKm);
    const cents = computeDeliveryFeeCents(point, [hazmieh]);
    const expected =
      DEFAULT_DELIVERY_PRICING_SETTINGS.baseFeeCents +
      Math.round(
        (distanceKm - DEFAULT_DELIVERY_PRICING_SETTINGS.freeRadiusKm) *
          DEFAULT_DELIVERY_PRICING_SETTINGS.perKmCents,
      );
    expect(cents).toBe(expected);
  });

  it("falls back to the flat base fee when there's no lat/lng", () => {
    expect(computeDeliveryFeeCents({}, [hazmieh])).toBe(
      DEFAULT_DELIVERY_PRICING_SETTINGS.baseFeeCents,
    );
    expect(computeDeliveryFeeCents(undefined, [hazmieh])).toBe(
      DEFAULT_DELIVERY_PRICING_SETTINGS.baseFeeCents,
    );
  });

  it("falls back to the flat base fee when there are no known branches", () => {
    const point = { lat: hazmieh.lat + 5, lng: hazmieh.lng + 5 };
    expect(computeDeliveryFeeCents(point, [])).toBe(
      DEFAULT_DELIVERY_PRICING_SETTINGS.baseFeeCents,
    );
  });

  it("respects admin-editable settings", () => {
    const point = { lat: hazmieh.lat + 0.2, lng: hazmieh.lng };
    const distanceKm = haversineDistanceKm(point, hazmieh);
    const settings = { baseFeeCents: 2000, freeRadiusKm: 2, perKmCents: 300 };
    const cents = computeDeliveryFeeCents(point, [hazmieh], settings);
    expect(cents).toBe(2000 + Math.round((distanceKm - 2) * 300));
  });
});
