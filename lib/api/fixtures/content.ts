import type { Review, SiteConfig } from "@/types/domain";

export const REVIEWS: Review[] = [
  {
    id: "rev-1",
    source: "google",
    rating: 5,
    author: "Sara M.",
    body: "Easy pickup at the Hazmieh hub, car was spotless. The WhatsApp updates made everything easy.",
    date: "2026-04-12",
  },
  {
    id: "rev-2",
    source: "google",
    rating: 5,
    author: "Karim H.",
    body: "Smooth booking, fair price, and they accepted cash on pickup. Will use again next trip.",
    date: "2026-04-02",
  },
  {
    id: "rev-3",
    source: "trustpilot",
    rating: 4,
    author: "Jean-Luc R.",
    body: "Bonne expérience générale. Le RAV4 était parfait pour notre voyage au Liban. Recommandé.",
    date: "2026-03-20",
  },
  {
    id: "rev-4",
    source: "google",
    rating: 5,
    author: "Lina T.",
    body: "Booked last minute for a wedding in Faqra. Same-day confirmation, the team made it work.",
    date: "2026-03-15",
  },
  {
    id: "rev-5",
    source: "google",
    rating: 5,
    author: "Omar K.",
    body: "Long-term rental for 6 months. They swap the car for service when needed and bill me monthly. No friction.",
    date: "2026-02-28",
  },
  {
    id: "rev-6",
    source: "trustpilot",
    rating: 5,
    author: "Maya A.",
    body: "Honestly the cleanest cars I've rented in Lebanon. Picked up the Corolla and it felt brand new.",
    date: "2026-02-10",
  },
];

export const SITE_CONFIG: SiteConfig = {
  promo: {
    message: "Summer in Lebanon, 15% off on weekly rentals. Code SUMMER15 →",
    href: "/vehicles?promo=SUMMER15",
  },
  maintenance: false,
};
