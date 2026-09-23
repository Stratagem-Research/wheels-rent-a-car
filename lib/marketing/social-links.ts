/**
 * Canonical Wheels social profile URLs — single source of truth.
 *
 * These are the live handles. Keep every social affordance (footer icons,
 * contact page, JSON-LD `sameAs`) pointing here so they can never drift apart
 * again. Update in one place if a handle changes.
 */
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/wheelsrentacar.lb?igsi=c3Bwem1lNnNxM2Jm&utm_source=qr",
  facebook: "https://www.facebook.com/share/1DadsyiQ7h/?mibextid=wwXIfr",
  tiktok: "https://www.tiktok.com/@wheelsrentacar.lb?_r=1&_t=ZS-99GBZYQ0UCL",
} as const;

/** Ordered list for UI that renders every profile (footer, contact page). */
export const SOCIAL_LINKS_LIST = [
  { label: "Instagram", href: SOCIAL_LINKS.instagram },
  { label: "Facebook", href: SOCIAL_LINKS.facebook },
  { label: "TikTok", href: SOCIAL_LINKS.tiktok },
] as const;

/** Bare array for JSON-LD `sameAs`. */
export const SOCIAL_SAME_AS: string[] = SOCIAL_LINKS_LIST.map((s) => s.href);
