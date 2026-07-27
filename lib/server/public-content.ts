import type { Branch, Review, SiteConfig, Vehicle } from "@/types/domain";
import { BRANCHES as FALLBACK_BRANCHES } from "@/lib/api/fixtures/branches";
import { SITE_CONFIG as FALLBACK_SITE_CONFIG } from "@/lib/api/fixtures/content";
import { VEHICLES as FALLBACK_VEHICLES } from "@/lib/api/fixtures/vehicles";
import { listReviewsFromDb } from "@/lib/supabase/reviews-repository";
import { ABOUT_CONTENT_SEED } from "@/lib/supabase/seed-data";
import {
  listAboutContent,
  listLocations,
  listPromotions,
  listVehicleMetadata,
  toVehicleWithMetadata,
} from "@/lib/supabase/admin-repository";
import { getSyncedPublicVehicles } from "@/lib/server/wizard-catalog";
import { getCheckoutPaymentMethods } from "@/lib/server/payment-methods";

export async function getPublicBranches(): Promise<Branch[]> {
  try {
    const branches = await listLocations();
    if (branches.length > 0) return branches;
  } catch {
    // Ignore and fallback to fixtures.
  }
  return FALLBACK_BRANCHES;
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
  } catch {
    return withPaymentMethods(FALLBACK_SITE_CONFIG);
  }
}

export async function getPublicVehicles(): Promise<Vehicle[]> {
  try {
    const synced = await getSyncedPublicVehicles();
    if (synced.length > 0) return synced;

    const metadata = await listVehicleMetadata();
    if (metadata.length === 0) return FALLBACK_VEHICLES;
    return FALLBACK_VEHICLES.map((vehicle) => toVehicleWithMetadata(vehicle, metadata));
  } catch {
    return FALLBACK_VEHICLES;
  }
}

export async function getPublicAboutContent() {
  try {
    const content = await listAboutContent();
    if (content) return content;
  } catch {
    // Ignore and fallback to static content.
  }
  // Fallback to the localized seed (en/ar/fr) so the About page still
  // translates even when the CMS about table isn't provisioned.
  return ABOUT_CONTENT_SEED;
}

export async function getPublicReviews(limit = 10): Promise<Review[]> {
  try {
    return await listReviewsFromDb(limit);
  } catch {
    const { REVIEWS } = await import("@/lib/api/fixtures/content");
    return REVIEWS.slice(0, limit);
  }
}
