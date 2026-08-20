import type { Branch, Cents, DeliveryPricingSettings } from "@/types/domain";

/** Seed row for `delivery_pricing_settings` and the client-side fixture fallback. */
export const DEFAULT_DELIVERY_PRICING_SETTINGS: DeliveryPricingSettings = {
  baseFeeCents: 1000,
  freeRadiusKm: 5,
  perKmCents: 150,
};

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two lat/lng points, in km. */
export function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Distance in km from the nearest branch, or null when no branches are known. */
export function nearestBranchDistanceKm(
  point: { lat: number; lng: number },
  branches: Branch[],
): number | null {
  if (branches.length === 0) return null;
  let min = Infinity;
  for (const branch of branches) {
    const d = haversineDistanceKm(point, branch);
    if (d < min) min = d;
  }
  return min;
}

/**
 * Delivery fee for an "address-delivery" pickup: free-radius base fee plus a
 * per-km surcharge beyond it, measured from the nearest branch. Falls back
 * to the flat base fee when the address has no lat/lng (free-typed, not
 * chosen via Places Autocomplete) or no branches are known.
 */
export function computeDeliveryFeeCents(
  point: { lat?: number; lng?: number } | undefined,
  branches: Branch[],
  settings: DeliveryPricingSettings = DEFAULT_DELIVERY_PRICING_SETTINGS,
): Cents {
  const distanceKm =
    point?.lat !== undefined && point?.lng !== undefined
      ? nearestBranchDistanceKm({ lat: point.lat, lng: point.lng }, branches)
      : null;
  if (distanceKm === null || distanceKm <= settings.freeRadiusKm) {
    return settings.baseFeeCents;
  }
  const extraKm = distanceKm - settings.freeRadiusKm;
  return settings.baseFeeCents + Math.round(extraKm * settings.perKmCents);
}
