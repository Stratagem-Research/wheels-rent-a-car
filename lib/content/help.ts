/**
 * Long-form help article content per 10_help_faq.md.
 *
 * Each article is a series of `<h2>` sections with body content rendered
 * by the LegalArticleLayout. The TOC entries match h2 ids exactly so the
 * sticky sidebar can scroll-spy them.
 *
 * Phase 1: typed objects in code. Phase 2 swaps to CMS (Sanity/Strapi).
 */

export interface HelpSection {
  id: string;
  heading: string;
  body: string;
}

export interface HelpArticle {
  slug: string;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: HelpSection[];
}

export const HELP_ARTICLES: Record<string, HelpArticle> = {
  "rental-terms": {
    slug: "rental-terms",
    title: "Rental terms",
    lastUpdated: "2026-05-15",
    intro: "Everything you agree to when you rent from Wheels — distilled into plain English.",
    sections: [
      {
        id: "intro",
        heading: "Introduction",
        body: "These terms apply to every rental booked through Wheels Rent A Car SAL. They supplement the signed agreement at pickup; in case of conflict, the on-the-day agreement controls.",
      },
      {
        id: "who-can-rent",
        heading: "Who can rent",
        body: "Drivers aged 25+ with a licence held ≥ 1 year. Ages 21–24 can rent economy and compact categories with the underage driver supplement. Foreign licences in Latin script are accepted; otherwise an International Driving Permit is required.",
      },
      {
        id: "documents",
        heading: "Documents required",
        body: "A valid driver's licence, a passport or national ID, and a credit card for the security deposit at pickup.",
      },
      {
        id: "mileage",
        heading: "Mileage",
        body: "Rentals include either 200 km/day (1,000 km/week) or unlimited mileage. Excess kilometres on capped rates are charged at $0.10/km.",
      },
      {
        id: "fuel",
        heading: "Fuel",
        body: "Cars must be returned with the same fuel level as received. Refuelling service is sold as an add-on if you'd rather skip the petrol stop.",
      },
      {
        id: "damages",
        heading: "Damages",
        body: "Damages not covered by your protection tier are charged up to the deductible amount plus a $50 administrative fee. We document all damage with photos at pickup and return.",
      },
      {
        id: "disputes",
        heading: "Disputes",
        body: "We aim to resolve issues directly via WhatsApp or phone. Formal disputes are governed by Lebanese law and resolved in Beirut courts.",
      },
    ],
  },
  "insurance-and-coverage": {
    slug: "insurance-and-coverage",
    title: "Insurance & coverage",
    lastUpdated: "2026-05-15",
    intro:
      "Three protection tiers, what each one covers, and how to choose. Pick at booking; upgrade at pickup; never downgrade mid-rental.",
    sections: [
      {
        id: "what-is-deductible",
        heading: "What's a deductible?",
        body: "It's the maximum amount you'd pay out of pocket for damages, no matter what the actual repair costs. Basic is $800. Smart drops it to $250. All-inclusive is $0.",
      },
      {
        id: "tiers",
        heading: "Our three tiers",
        body: "Basic is included with every rental — third-party liability + collision damage with the $800 deductible. Smart adds tyre + windscreen cover, lockout, and personal effects up to $500. All-inclusive removes the deductible entirely and bumps personal effects to $2,000.",
      },
      {
        id: "what-is-not-covered",
        heading: "What's not covered",
        body: "Traffic violations, off-road damage, fuel mishaps, and deliberate damage are never covered. Driving under influence voids all protection. Cross-border driving requires the cross-border permit add-on.",
      },
      {
        id: "claims",
        heading: "How claims work",
        body: "If something happens, document the scene with photos, get a police report if relevant, and WhatsApp us immediately. We'll guide you through the next steps from there.",
      },
    ],
  },
  "payment-and-deposits": {
    slug: "payment-and-deposits",
    title: "Payment & deposits",
    lastUpdated: "2026-05-15",
    intro:
      "Lebanon-localised payment: card, cash, bank transfer, OMT/Whish/Bob Finance. The deposit is always refundable.",
    sections: [
      {
        id: "methods",
        heading: "Payment methods",
        body: "Visa, Mastercard, and Amex are processed by Areeba (PCI compliant). Cash on pickup is accepted in USD or LBP. Bank transfer and OMT/Whish/Bob Finance are also available; we hold the booking as Pending until verified.",
      },
      {
        id: "when-charged",
        heading: "When you're charged",
        body: "Card payments are captured at booking. Cash bookings are charged at pickup. Transfer and OMT bookings are confirmed once we verify receipt — typically within 24h (transfer) or 4h (OMT).",
      },
      {
        id: "deposit",
        heading: "The security deposit",
        body: "We hold a refundable deposit on your card at pickup. Amount varies by category — $300 economy, $500 sedan, $750 SUV, $1,500 luxury. It's released after the return inspection.",
      },
      {
        id: "refunds",
        heading: "Refunds",
        body: "Card refunds clear in 3–10 business days. Cash bookings have no refund — we never charged you. For Pending bookings cancelled before verification, no funds change hands.",
      },
    ],
  },
  "cancellation-policy": {
    slug: "cancellation-policy",
    title: "Cancellation policy",
    lastUpdated: "2026-05-15",
    intro:
      "Free up to 24 hours before pickup. Within 24 hours, a one-day rate fee applies. Best-Price rates are non-refundable except where Lebanese law requires.",
    sections: [
      {
        id: "free-window",
        heading: "Free cancellation window",
        body: "Cancel up to 24 hours before pickup and we refund the full amount. Modifications (date or location changes) are free in the same window.",
      },
      {
        id: "within-24h",
        heading: "Within 24 hours of pickup",
        body: "A one-day rate fee applies. We waive this for documented travel disruptions (cancelled flights, severe weather) — message us with proof and we'll review.",
      },
      {
        id: "best-price",
        heading: "Best-Price rate",
        body: "Best-Price rates are non-refundable by design. Choose the Flexible rate at booking if you want full cancellation rights.",
      },
      {
        id: "how-to-cancel",
        heading: "How to cancel",
        body: "Sign in and open the booking, or use Manage Booking with your reference and email. Both flows show the refund amount before you confirm.",
      },
    ],
  },
};

/**
 * Help-hub topic icons map to Lucide components in `HELP_TOPIC_ICON`. The
 * help page imports the lookup and renders the matching icon as monochrome
 * line art (1.5px stroke) per DESIGN.md §Iconography.
 */
export const HELP_TOPICS = [
  {
    slug: "rental-terms",
    title: "Rental terms",
    blurb: "Who can rent, documents, mileage, damages.",
    iconName: "book-open",
  },
  {
    slug: "insurance-and-coverage",
    title: "Insurance & coverage",
    blurb: "Three tiers explained. What is and isn't covered.",
    iconName: "shield-check",
  },
  {
    slug: "payment-and-deposits",
    title: "Payment & deposits",
    blurb: "Card, cash, transfer, OMT. How the deposit works.",
    iconName: "credit-card",
  },
  {
    slug: "cancellation-policy",
    title: "Cancellation policy",
    blurb: "Free up to 24h before pickup. Within 24h: one-day fee.",
    iconName: "calendar-x",
  },
  {
    slug: "faq",
    title: "FAQ",
    blurb: "Quick answers to the most common questions.",
    iconName: "help-circle",
  },
  {
    slug: "whatsapp",
    title: "WhatsApp us",
    blurb: "Real humans, 24/7 — fastest answer.",
    iconName: "message-circle",
  },
] as const;

export type HelpTopicIconName = (typeof HELP_TOPICS)[number]["iconName"];
