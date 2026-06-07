import type { Branch, SiteConfig, Vehicle } from "@/types/domain";
import { BRANCHES as FALLBACK_BRANCHES } from "@/lib/api/mocks/fixtures/branches";
import { SITE_CONFIG as FALLBACK_SITE_CONFIG } from "@/lib/api/mocks/fixtures/content";
import { VEHICLES as FALLBACK_VEHICLES } from "@/lib/api/mocks/fixtures/vehicles";
import {
  ABOUT_PULL_QUOTE,
  ABOUT_STATS,
  ABOUT_STORY_PARAGRAPHS,
  ABOUT_TEAM_DEDICATION,
  ABOUT_TEAM_INTRO,
  ABOUT_TEAM,
  FLEET_PHILOSOPHY,
} from "@/lib/content/about";
import {
  listAboutContent,
  listLocations,
  listPromotions,
  listVehicleMetadata,
  toVehicleWithMetadata,
} from "@/lib/supabase/admin-repository";

export async function getPublicBranches(): Promise<Branch[]> {
  try {
    const branches = await listLocations();
    if (branches.length > 0) return branches;
  } catch {
    // Ignore and fallback to fixtures.
  }
  return FALLBACK_BRANCHES;
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
      return {
        ...FALLBACK_SITE_CONFIG,
        promo: {
          message: active.message,
          href: active.href ?? undefined,
        },
      };
    }
    return {
      ...FALLBACK_SITE_CONFIG,
      promo: null,
    };
  } catch {
    return FALLBACK_SITE_CONFIG;
  }
}

export async function getPublicVehicles(): Promise<Vehicle[]> {
  try {
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
  return {
    storyParagraphs: { en: ABOUT_STORY_PARAGRAPHS },
    pullQuote: { en: ABOUT_PULL_QUOTE },
    fleetPhilosophy: {
      heading: { en: FLEET_PHILOSOPHY.heading },
      paragraphs: { en: FLEET_PHILOSOPHY.paragraphs },
    },
    stats: ABOUT_STATS.map((item) => ({ value: item.value, label: { en: item.label } })),
    teamIntro: { en: ABOUT_TEAM_INTRO },
    teamDedication: { en: ABOUT_TEAM_DEDICATION },
    team: ABOUT_TEAM.map((member) => ({
      name: member.name,
      role: { en: member.role },
      photo: member.photo,
      quote: member.quote ? { en: member.quote } : undefined,
      bio: { en: member.bio },
      highlights: { en: member.highlights ?? [] },
    })),
  };
}
