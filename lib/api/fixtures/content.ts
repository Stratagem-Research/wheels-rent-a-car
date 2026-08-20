import type { Review, SiteConfig } from "@/types/domain";

/** Synced from live `cms_reviews`. Re-run `pnpm exec tsx scripts/pull-fixture-defaults.ts`. */
export const REVIEWS: Review[] = [
  {
    id: "rev-1",
    rating: 5,
    body: "Easy pickup at the Hazmieh hub — car was spotless. The WhatsApp updates made everything easy.",
    author: "Sara M.",
    date: "2026-04-12",
    source: "google",
  },
  {
    id: "rev-2",
    rating: 5,
    body: "Smooth booking, fair price, and they accepted cash on pickup. Will use again next trip.",
    author: "Karim H.",
    date: "2026-04-02",
    source: "google",
  },
  {
    id: "rev-3",
    rating: 4,
    body: "Bonne expérience générale. Le RAV4 était parfait pour notre voyage au Liban. Recommandé.",
    author: "Jean-Luc R.",
    date: "2026-03-20",
    source: "trustpilot",
  },
  {
    id: "rev-4",
    rating: 5,
    body: "Booked last minute for a wedding in Faqra. Same-day confirmation, the team made it work.",
    author: "Lina T.",
    date: "2026-03-15",
    source: "google",
  },
  {
    id: "rev-5",
    rating: 5,
    body: "Long-term rental for 6 months. They swap the car for service when needed and bill me monthly. No friction.",
    author: "Omar K.",
    date: "2026-02-28",
    source: "google",
  },
  {
    id: "rev-6",
    rating: 5,
    body: "Honestly the cleanest cars I've rented in Lebanon. Picked up the Corolla and it felt brand new.",
    author: "Maya A.",
    date: "2026-02-10",
    source: "trustpilot",
  },
];

export const SITE_CONFIG: SiteConfig = {
  promo: {
    message: "Summer in Lebanon, 15% off on weekly rentals. Code SUMMER15 →",
    href: "/vehicles?promo=SUMMER15",
  },
  maintenance: false,
  paymentMethods: [],
};
