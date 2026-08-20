import * as Sentry from "@sentry/nextjs";
import type { Branch, DeliveryPricingSettings, Review, SiteConfig, Vehicle } from "@/types/domain";
import { BRANCHES as FALLBACK_BRANCHES } from "@/lib/api/fixtures/branches";
import { SITE_CONFIG as FALLBACK_SITE_CONFIG } from "@/lib/api/fixtures/content";
import { VEHICLES as FALLBACK_VEHICLES } from "@/lib/api/fixtures/vehicles";
import { listReviewsFromDb } from "@/lib/supabase/reviews-repository";
import { ABOUT_CONTENT_SEED } from "@/lib/supabase/seed-data";
import { DEFAULT_DELIVERY_PRICING_SETTINGS } from "@/lib/booking/delivery-pricing";
import {
  getDeliveryPricingSettings,
  listAboutContent,
  listLocations,
  listPromotions,
  listVehicleMetadata,
  toVehicleWithMetadata,
} from "@/lib/supabase/admin-repository";
import { getSyncedPublicVehicles } from "@/lib/server/wizard-catalog";
import { getCheckoutPaymentMethods } from "@/lib/server/payment-methods";
import { listRecentlyBookedVehicleIds } from "@/lib/supabase/user-bookings-repository";

/**
 * Fixture fallbacks below keep pages rendering through a transient
 * Supabase/Wizard outage instead of crashing — but that must never be
 * silent. Report every fallback so an outage that starts serving fake
 * catalog data in production actually pages someone instead of going
 * unnoticed.
 */
function reportFixtureFallback(source: string, reason: string, err?: unknown) {
  const message = `[public-content] serving fixture fallback for "${source}": ${reason}`;
  if (err) {
    // A real exception (Supabase/Wizard threw) — this is the case worth a
    // red flag both locally and in prod.
    console.error(message, err);
    Sentry.captureException(err, { tags: { fixtureFallback: source }, extra: { reason } });
  } else {
    // Zero rows isn't necessarily broken — e.g. the table just isn't
    // provisioned yet locally/in staging. Warn, don't error, so Next's dev
    // overlay doesn't red-screen an expected empty-table fallback.
    console.warn(message);
    Sentry.captureMessage(message, {
      level: "warning",
      tags: { fixtureFallback: source },
    });
  }
}

export async function getPublicBranches(): Promise<Branch[]> {
  try {
    const branches = await listLocations();
    if (branches.length > 0) return branches;
    reportFixtureFallback("branches", "listLocations() returned zero rows");
  } catch (err) {
    reportFixtureFallback("branches", "listLocations() threw", err);
  }
  return FALLBACK_BRANCHES;
}

export async function getPublicDeliveryPricing(): Promise<DeliveryPricingSettings> {
  try {
    const settings = await getDeliveryPricingSettings();
    if (settings) return settings;
    reportFixtureFallback("delivery-pricing", "getDeliveryPricingSettings() returned no row");
  } catch (err) {
    reportFixtureFallback("delivery-pricing", "getDeliveryPricingSettings() threw", err);
  }
  return DEFAULT_DELIVERY_PRICING_SETTINGS;
}

function withPaymentMethods(config: SiteConfig): SiteConfig {
  return {
    ...config,
    paymentMethods: getCheckoutPaymentMethods(),
  };
}

export async function getPublicSiteConfig(): Promise<SiteConfig> {
  try {
    const promotions = await listPromotions();
    const now = Date.now();
    const active = promotions.find((item) => {
      if (!item.active) return false;
      const startsAt = item.starts_at ? Date.parse(item.starts_at) : null;
      const endsAt = item.ends_at ? Date.parse(item.ends_at) : null;
      if (startsAt && startsAt > now) return false;
      if (endsAt && endsAt < now) return false;
      return true;
    });
    if (active) {
      return withPaymentMethods({
        ...FALLBACK_SITE_CONFIG,
        promo: {
          message: active.message,
          href: active.href ?? undefined,
        },
      });
    }
    return withPaymentMethods({
      ...FALLBACK_SITE_CONFIG,
      promo: null,
    });
  } catch (err) {
    reportFixtureFallback("siteConfig.promotions", "listPromotions() threw", err);
    return withPaymentMethods(FALLBACK_SITE_CONFIG);
  }
}

export async function getPublicVehicles(): Promise<Vehicle[]> {
  try {
    const synced = await getSyncedPublicVehicles();
    if (synced.length > 0) return synced;

    reportFixtureFallback("vehicles", "getSyncedPublicVehicles() returned zero rows");
    const metadata = await listVehicleMetadata();
    if (metadata.length === 0) return FALLBACK_VEHICLES;
    return FALLBACK_VEHICLES.map((vehicle) => toVehicleWithMetadata(vehicle, metadata));
  } catch (err) {
    reportFixtureFallback("vehicles", "getSyncedPublicVehicles()/listVehicleMetadata() threw", err);
    return FALLBACK_VEHICLES;
  }
}

/**
 * Homepage "Driver favourites" pick: the highest-priced cars among recently
 * booked vehicles (last 30 days). Fills any remaining slots — including all
 * of them when there's no recent booking activity — with the highest-priced
 * cars in the catalog, so the section never comes back empty.
 */
export async function getFeaturedVehicles(count = 4): Promise<Vehicle[]> {
  const vehicles = await getPublicVehicles();
  const byId = new Map(vehicles.map((v) => [v.id, v]));

  let recentIds: string[] = [];
  try {
    recentIds = await listRecentlyBookedVehicleIds();
  } catch (err) {
    reportFixtureFallback("featuredVehicles", "listRecentlyBookedVehicleIds() threw", err);
  }

  const recentVehicles = recentIds
    .map((id) => byId.get(id))
    .filter((v): v is Vehicle => v != null)
    .sort((a, b) => b.dailyRateFromCents - a.dailyRateFromCents);

  const seen = new Set<string>();
  const picked: Vehicle[] = [];
  for (const v of [...recentVehicles, ...[...vehicles].sort((a, b) => b.dailyRateFromCents - a.dailyRateFromCents)]) {
    if (seen.has(v.id)) continue;
    seen.add(v.id);
    picked.push(v);
    if (picked.length === count) break;
  }
  return picked;
}

export async function getPublicAboutContent() {
  try {
    const content = await listAboutContent();
    if (content) return content;
    reportFixtureFallback("aboutContent", "listAboutContent() returned no rows");
  } catch (err) {
    reportFixtureFallback("aboutContent", "listAboutContent() threw", err);
  }
  // Fallback to the localized seed (en/ar/fr) so the About page still
  // translates even when the CMS about table isn't provisioned.
  return ABOUT_CONTENT_SEED;
}

export async function getPublicReviews(limit = 10): Promise<Review[]> {
  try {
    return await listReviewsFromDb(limit);
  } catch (err) {
    reportFixtureFallback("reviews", "listReviewsFromDb() threw", err);
    const { REVIEWS } = await import("@/lib/api/fixtures/content");
    return REVIEWS.slice(0, limit);
  }
}
