import type { PageHeroImage } from "@/components/marketing/PageHero";

/**
 * Single swap point for secondary-page hero photography.
 *
 * These are curated, free-to-use Lebanon placeholders (Unsplash License — see
 * `public/images/Page Heroes/ATTRIBUTION.md`). When the client delivers final
 * licensed photography, drop the files into `public/images/Page Heroes/` (same
 * filenames) or edit the `src` here — no component changes required.
 *
 * Brand rule: real Lebanese settings, natural light (DESIGN.md). Hero imagery
 * is full-bleed; `PageHero` applies the gradient scrim so paper type holds
 * WCAG AA over any photo.
 */
export const PAGE_HERO_IMAGES = {
  trips: {
    src: "/images/Page Heroes/trips-self-drive.jpg",
    alt: "A scenic mountain road through the Lebanese highlands",
    position: "center 45%",
  },
  itineraries: {
    src: "/images/Page Heroes/itineraries-scenic.jpg",
    alt: "Rock formations along the Lebanese Mediterranean coast",
    position: "center 50%",
  },
  chauffeur: {
    src: "/images/Page Heroes/chauffeur-evening.jpg",
    alt: "The Beirut skyline at golden hour",
    position: "center 55%",
  },
  corporate: {
    src: "/images/Page Heroes/corporate-downtown.jpg",
    alt: "Downtown Beirut at Nejmeh Square",
    position: "center 35%",
  },
  longTerm: {
    src: "/images/Page Heroes/long-term-street.jpg",
    alt: "A quiet residential street in Beirut",
    position: "center 50%",
  },
  locations: {
    src: "/images/Page Heroes/locations-hub.jpg",
    alt: "Aerial view of Beirut and the Mediterranean coastline",
    position: "center 40%",
  },
  contact: {
    src: "/images/Page Heroes/contact-coast.jpg",
    alt: "The Beirut waterfront and marina",
    position: "center 50%",
  },
  about: {
    src: "/images/Page Heroes/about-cityscape.jpg",
    alt: "Aerial view of the Beirut cityscape",
    position: "center 40%",
  },
  carWash: {
    src: "/images/Page Heroes/car-wash.jpg",
    alt: "A clean vehicle at a professional car wash bay",
    position: "center 50%",
  },
} satisfies Record<string, PageHeroImage>;

/** Standalone branch photograph used in the body of /locations. */
export const HAZMIEH_BRANCH_IMAGE: PageHeroImage = {
  src: "/images/Page Heroes/hazmieh-branch.jpg",
  alt: "Beirut neighbourhood near the Wheels Hazmieh hub",
  position: "center 45%",
};
