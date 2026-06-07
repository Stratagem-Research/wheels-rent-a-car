/**
 * Legal article content per 15_legal_and_utility.md.
 *
 * Mirrors the `HelpArticle` shape so the same LegalArticleLayout +
 * TocSidebar combo can render them. Phase 1 ships placeholder copy
 * marked with `[draft by counsel]` per the spec; Phase 2 lawyers replace
 * the body text without changing structure.
 *
 * The old /lib/content/legal/*.md files were the early-Sprint-2 draft
 * format; this file supersedes them.
 */

export interface LegalSection {
  id: string;
  heading: string;
  body: string;
}

export interface LegalArticle {
  slug: "privacy" | "terms" | "cookies";
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
  draftNote?: string;
}

export const LEGAL_ARTICLES: Record<LegalArticle["slug"], LegalArticle> = {
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    lastUpdated: "2026-05-15",
    intro:
      "How Wheels Rent A Car collects, uses, and shares personal information when you visit our website, book a rental, or interact with us through WhatsApp, phone, email, or in person at one of our branches.",
    // draftNote: "[draft by counsel]" — hidden from UI per request; legal copy is under review by the client's lawyers.
    sections: [
      {
        id: "what-we-collect",
        heading: "What we collect",
        body: "Identity and contact information (name, email, phone, date of birth, address). Driver's licence and ID/passport details for rental eligibility. Booking details: pickup/return dates and locations, vehicle preferences. Payment information handled by our PCI-compliant payment provider; we never store full card numbers. Technical data: IP address, browser type, device information, cookies (see our Cookie Policy).",
      },
      {
        id: "how-we-use",
        heading: "How we use your information",
        body: "To process and fulfil your rental bookings. To send confirmations, reminders, and updates via email and WhatsApp (if you opt in). To meet our legal and regulatory obligations (insurance, traffic violations, customs). To improve our service through aggregated, non-identifying analytics.",
      },
      {
        id: "sharing",
        heading: "Sharing",
        body: "We share personal information only with service providers necessary to operate the rental (insurance, payment processors, WhatsApp Business API provider), Lebanese authorities when legally required, and our internal management system (CRM and operations). We never sell personal data.",
      },
      {
        id: "your-rights",
        heading: "Your rights",
        body: "You may request access to, correction of, or deletion of your personal data at any time by contacting privacy@wheelsrentacar.com.lb. For EU visitors, our processing is governed by GDPR equivalents under Lebanese data protection law.",
      },
      {
        id: "retention",
        heading: "Retention",
        body: "Booking records are retained for 7 years for tax and insurance purposes. Marketing preferences are honoured indefinitely or until you opt out.",
      },
      {
        id: "contact",
        heading: "Contact",
        body: "Questions about this policy? Email privacy@wheelsrentacar.com.lb or message us on WhatsApp.",
      },
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms & Conditions",
    lastUpdated: "2026-05-15",
    intro:
      "By renting a vehicle from Wheels Rent A Car SAL, you agree to these Terms & Conditions. They supplement the individual rental agreement signed at pickup.",
    // draftNote: "[draft by counsel]" — hidden from UI per request; legal copy is under review by the client's lawyers.
    sections: [
      {
        id: "who-can-rent",
        heading: "Who can rent",
        body: "Minimum age 25 for most categories; 21–24 with the underage driver supplement. A valid driver's licence held for at least one year. A passport or national ID and a credit card for the security deposit. Foreign licences must be in Latin script; otherwise an International Driving Permit is required.",
      },
      {
        id: "booking-payment",
        heading: "Booking and payment",
        body: 'Card payments are charged at booking. Cash, bank transfer, and OMT payments are settled per the methods described at checkout. A refundable security deposit is held at pickup and released after return inspection. Bank transfer and OMT bookings remain in "Pending" status until we verify receipt.',
      },
      {
        id: "insurance-liability",
        heading: "Insurance and liability",
        body: "Every rental includes basic third-party liability and collision damage insurance. Upgrades to Smart or All-inclusive protection reduce or eliminate the deductible. The driver is liable for damages not covered by the chosen protection, traffic violations, and any breach of the rental terms.",
      },
      {
        id: "mileage-fuel",
        heading: "Mileage and fuel",
        body: "Rentals include either capped (200 km/day, 1,000 km/week) or unlimited mileage depending on your selection. Cars must be returned with the same fuel level received.",
      },
      {
        id: "cancellation",
        heading: "Cancellation",
        body: "Free cancellation up to 24 hours before pickup. Within 24 hours of pickup a one-day rate fee applies. Best-Price (pay now) rates are non-refundable except where Lebanese consumer law requires.",
      },
      {
        id: "damages",
        heading: "Damages",
        body: "Damages to the vehicle, theft, or loss not covered by the selected protection tier are charged to the renter up to the deductible amount, plus a $50 administrative fee.",
      },
      {
        id: "disputes",
        heading: "Dispute resolution",
        body: "Disputes are governed by Lebanese law and resolved in Beirut courts. We aim to resolve issues directly via WhatsApp or phone before any formal action.",
      },
      {
        id: "contact",
        heading: "Contact",
        body: "Questions? Email legal@wheelsrentacar.com.lb or message us on WhatsApp.",
      },
    ],
  },
  cookies: {
    slug: "cookies",
    title: "Cookie Policy",
    lastUpdated: "2026-05-15",
    intro: "What cookies we use, how to manage them, and how they relate to your privacy choices.",
    // draftNote: "[draft by counsel]" — hidden from UI per request; legal copy is under review by the client's lawyers.
    sections: [
      {
        id: "what-are-cookies",
        heading: "What are cookies",
        body: "Cookies are small text files stored on your device when you visit a website. They allow the site to remember your actions and preferences over time.",
      },
      {
        id: "categories",
        heading: "Categories we use",
        body: "Essential cookies are required for the site to work (authentication, search-state persistence, booking funnel). Analytics cookies are anonymised data we use to improve the site (Google Analytics 4, Meta Pixel) — opt in via the cookie banner. Marketing cookies are used to personalise advertising on other platforms — opt in via the cookie banner.",
      },
      {
        id: "managing",
        heading: "Managing cookies",
        body: "Accept or reject non-essential cookies via the banner shown on your first visit, and update preferences at any time from the footer link. Most browsers also let you delete or block cookies entirely; doing so may prevent parts of the site from working.",
      },
      {
        id: "third-parties",
        heading: "Third-party cookies",
        body: "We use the following third parties, each with their own privacy policies: Google (Analytics, Maps), Meta (Pixel), Areeba (Payment Services), WhatsApp (Business API).",
      },
      {
        id: "contact",
        heading: "Contact",
        body: "Questions? Email privacy@wheelsrentacar.com.lb.",
      },
    ],
  },
};
