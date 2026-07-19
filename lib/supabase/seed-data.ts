/**
 * Server-only CMS seed payloads (used by lib/supabase/seed.ts).
 * Not used at runtime — public/admin pages read from Supabase via /api/cms/*.
 */
import type { CorporateTier, FaqGroup, Itinerary, Trip } from "@/types/domain";
import { BRANCHES } from "@/lib/api/fixtures/branches";
import { SITE_CONFIG } from "@/lib/api/fixtures/content";
import {
  ABOUT_PULL_QUOTE,
  ABOUT_STATS,
  ABOUT_STORY_PARAGRAPHS,
  ABOUT_TEAM_DEDICATION,
  ABOUT_TEAM_INTRO,
  ABOUT_TEAM,
  FLEET_PHILOSOPHY,
} from "@/lib/content/about";
import { toLocalizedString, toLocalizedStringArray } from "@/lib/i18n/localized";
import {
  ABOUT_T,
  CORPORATE_T,
  FAQ_GROUP_T,
  FAQ_T,
  ITINERARY_T,
  TRIP_T,
  type LocaleList,
  type LocaleText,
} from "@/lib/supabase/seed-i18n";
/** Default FAQ content per 10_help_faq.md. ~30 entries across 8 topic groups. */
export const FAQS: FaqGroup[] = [
  {
    id: "g-booking",
    title: "Booking",
    entries: [
      {
        id: "f-b-1",
        group: "g-booking",
        question: "How do I book a car?",
        answer:
          "Use the search bar on the homepage to pick dates and location, choose a car, and complete checkout. The whole process takes under 90 seconds.",
      },
      {
        id: "f-b-2",
        group: "g-booking",
        question: "Can I book without an account?",
        answer:
          "Yes. Guest checkout works for the entire booking flow. Create an account at the end if you want to save your details for next time.",
      },
      {
        id: "f-b-3",
        group: "g-booking",
        question: "Can I book for someone else?",
        answer:
          "Yes. Just enter their details as the driver. The primary driver must be present at pickup with a valid licence.",
      },
      {
        id: "f-b-4",
        group: "g-booking",
        question: "How far in advance can I book?",
        answer:
          "Up to 11 months ahead. For same-day pickups, call us â€” we'll confirm by WhatsApp.",
      },
    ],
  },
  {
    id: "g-pickup",
    title: "Pickup & return",
    entries: [
      {
        id: "f-p-1",
        group: "g-pickup",
        question: "Where do I pick up the car?",
        answer:
          "At our Hazmieh hub (Gallery Semaan, facing Sea Sweet) or by Address Delivery anywhere in Greater Beirut â€” including Beirut Airport.",
      },
      {
        id: "f-p-2",
        group: "g-pickup",
        question: "What time can I pick up or return?",
        answer:
          "Our hub is open 08:00â€“20:00 Mondayâ€“Saturday and 10:00â€“16:00 Sunday. For pickups outside those hours, WhatsApp us â€” we'll arrange.",
      },
      {
        id: "f-p-3",
        group: "g-pickup",
        question: "Can you meet me at the airport?",
        answer:
          "Yes. Choose Address Delivery and enter the airport â€” we track your flight and meet you at arrivals. Up to 90 minutes' delay is free.",
      },
      {
        id: "f-p-4",
        group: "g-pickup",
        question: "Can I return at a different location?",
        answer:
          "Yes. Tap 'Different return location' in the search bar. A small one-way fee may apply.",
      },
    ],
  },
  {
    id: "g-payment",
    title: "Payment",
    entries: [
      {
        id: "f-pa-1",
        group: "g-payment",
        question: "What payment methods do you accept?",
        answer:
          "Visa, Mastercard, Amex, cash on pickup (USD or LBP), bank transfer, and OMT/Whish/Bob Finance.",
      },
      {
        id: "f-pa-2",
        group: "g-payment",
        question: "Can I pay in cash?",
        answer:
          "Yes. Cash on pickup is accepted at every branch in either USD or LBP. A refundable deposit is required at the counter.",
      },
      {
        id: "f-pa-3",
        group: "g-payment",
        question: "What is the deposit?",
        answer:
          "Refundable, varies by car class â€” typically $300 for economy, up to $1,500 for luxury. Released after return inspection.",
      },
      {
        id: "f-pa-4",
        group: "g-payment",
        question: "When am I charged?",
        answer:
          "Card payments charge at booking. Cash bookings are charged at pickup. Transfer and OMT are confirmed once we verify the receipt.",
      },
      {
        id: "f-pa-5",
        group: "g-payment",
        question: "Do you accept Lebanese pounds?",
        answer: "Yes, at the daily rate. We display prices in USD for clarity.",
      },
    ],
  },
  {
    id: "g-insurance",
    title: "Insurance",
    entries: [
      {
        id: "f-i-1",
        group: "g-insurance",
        question: "Is insurance included?",
        answer:
          "Yes. Every rental includes basic third-party and collision insurance. You can upgrade to Smart or All-inclusive at booking.",
      },
      {
        id: "f-i-2",
        group: "g-insurance",
        question: "What does the deductible cover?",
        answer:
          "It's the maximum amount you'd pay in case of damage. Basic is $800, Smart is $250, All-inclusive is $0.",
      },
      {
        id: "f-i-3",
        group: "g-insurance",
        question: "Can I buy additional protection?",
        answer: "Yes, at any point during booking. You can also upgrade at the counter at pickup.",
      },
    ],
  },
  {
    id: "g-driver",
    title: "Driver requirements",
    entries: [
      {
        id: "f-d-1",
        group: "g-driver",
        question: "What's the minimum age?",
        answer:
          "25 for most cars. 21â€“24 drivers can rent economy and compact categories with the underage driver add-on.",
      },
      {
        id: "f-d-2",
        group: "g-driver",
        question: "What documents do I need?",
        answer:
          "A valid driver's licence (held â‰¥ 1 year), a passport or national ID, and a credit card.",
      },
      {
        id: "f-d-3",
        group: "g-driver",
        question: "Is an international licence accepted?",
        answer:
          "Foreign licences in Latin script are accepted. For non-Latin licences, an International Driving Permit is required.",
      },
      {
        id: "f-d-4",
        group: "g-driver",
        question: "Can I add an extra driver?",
        answer:
          "Yes â€” at booking or at the counter. Each extra driver must also present a valid licence.",
      },
    ],
  },
  {
    id: "g-cancel",
    title: "Cancellation",
    entries: [
      {
        id: "f-c-1",
        group: "g-cancel",
        question: "How do I cancel?",
        answer:
          "Sign in and open the booking, or use Manage Booking with your reference and email. Both flows have a Cancel option.",
      },
      {
        id: "f-c-2",
        group: "g-cancel",
        question: "Is cancellation free?",
        answer: "Yes if cancelled â‰¥ 24h before pickup. Within 24h, a one-day rate fee applies.",
      },
      {
        id: "f-c-3",
        group: "g-cancel",
        question: "How long does a refund take?",
        answer:
          "Card refunds clear in 3â€“10 business days depending on your bank. Cash bookings have no refund (we never charged you).",
      },
    ],
  },
  {
    id: "g-wa",
    title: "WhatsApp",
    entries: [
      {
        id: "f-w-1",
        group: "g-wa",
        question: "How do I get WhatsApp updates?",
        answer:
          "Tick 'Send my booking updates via WhatsApp' at checkout. We confirm your booking and remind you 24h before pickup.",
      },
      {
        id: "f-w-2",
        group: "g-wa",
        question: "Who replies on WhatsApp?",
        answer: "Real humans on our operations team. 24/7.",
      },
      {
        id: "f-w-3",
        group: "g-wa",
        question: "Is WhatsApp available 24/7?",
        answer:
          "Yes. Median response time is under 2 minutes during business hours, under 10 minutes overnight.",
      },
    ],
  },
];
export const TRIPS: Trip[] = [
  {
    slug: "the-cedars",
    title: "The Cedars",
    excerpt:
      "Snow-touched cedars and the Qadisha Valley's monasteries in one full day from Beirut.",
    coverImage: {
      src: "/images/Trips Images/cedars.jpg",
      alt: "Snow-touched cedars in northern Lebanon",
      width: 1200,
      height: 1500,
    },
    meta: "8h Â· SUV recommended",
    region: "mountains",
    body: `The drive up from Beirut climbs through Tannourine and Bcharre before the cedar grove reveals itself at 2,000m. Plan a lunch stop in Hadath El Jebbeh for the view across the Qadisha Valley.

The route in winter requires a 4x4 or SUV with winter tyres; in spring and autumn any sedan with comfortable highway manners is fine. The grove itself is a short walk from the parking area and is best visited mid-morning to mid-afternoon when the light catches the snow on the older trees.

Most visitors pair the Cedars with the Gibran Museum in Bcharre, a Maronite history detour, or a coffee stop at the Saydet El Hosn shrine perched above the valley.`,
    suggestedVehicleCategory: "suv",
    tags: ["mountains", "day trip", "scenic"],
    publishedAt: "2026-03-10",
    updatedAt: "2026-04-12T10:00:00.000Z",
  },
  {
    slug: "baalbek-anjar",
    title: "Baalbek & Anjar",
    excerpt:
      "Roman temples at Baalbek and the Umayyad palace city of Anjar â€” a Bekaa Valley double-header.",
    coverImage: {
      src: "/images/Trips Images/baalbek.jpg",
      alt: "Roman ruins at Baalbek in the Bekaa valley",
      width: 1200,
      height: 1500,
    },
    meta: "9h Â· Sedan recommended",
    region: "bekaa",
    body: `Baalbek's Temple of Jupiter is the largest Roman temple ever built â€” its six standing columns are 22m tall. Allow two hours on the site, then drive 40 minutes south to Anjar's Umayyad palace city for a quieter, equally substantial ruin.

The Bekaa Valley between the two is wine country: ChÃ¢teau Ksara, Domaine Wardy, and ChÃ¢teau Kefraya all offer cellar visits and tastings if you book ahead. Many travellers add a Bekaa lunch (mezza at Tawlet Ammiq) before turning back to Beirut via the Dahr el Baidar pass.

A comfortable sedan handles the route well â€” the Bekaa is largely flat once you're past the mountain pass.`,
    suggestedVehicleCategory: "sedan",
    tags: ["history", "wine", "bekaa"],
    publishedAt: "2026-03-15",
    updatedAt: "2026-04-12T10:00:00.000Z",
  },
  {
    slug: "tyre-sidon",
    title: "Tyre & Sidon",
    excerpt:
      "Phoenician harbours, Mamluk souks, and a seafood lunch at Tyre's old port â€” south coast in a day.",
    coverImage: {
      src: "/images/Trips Images/south lebanon.jpg",
      alt: "Coastal village in southern Lebanon between Tyre and Sidon",
      width: 1200,
      height: 1500,
    },
    meta: "8h Â· Sedan recommended",
    region: "south",
    body: `Sidon's Sea Castle and the Khan El Franj caravanserai start the route; Tyre's UNESCO-listed Roman hippodrome and necropolis close it. The drive south is a comfortable two-lane coastal highway with frequent fish restaurants if you want to extend lunch.

A sedan handles the route easily. If you have an extra day, add MaghdouchÃ© (the Lady of Mantara shrine) on the return for the view of the Sidon coast.`,
    suggestedVehicleCategory: "sedan",
    tags: ["coast", "history", "south"],
    publishedAt: "2026-03-22",
    updatedAt: "2026-04-12T10:00:00.000Z",
  },
  {
    slug: "byblos-batroun",
    title: "Byblos & Batroun",
    excerpt:
      "The world's oldest continuously inhabited city and a seaside town with a thriving old souk.",
    coverImage: {
      src: "/images/Trips Images/byblos.jpg",
      alt: "Byblos harbour at golden hour",
      width: 1200,
      height: 1500,
    },
    meta: "7h Â· Any car",
    region: "coast",
    body: `Byblos (Jbeil) is the easiest day trip from Beirut â€” 35 minutes on the coastal highway. The Phoenician harbour, the Crusader castle, and the old souk loop in three hours. Lunch at Pepe Abed in the old port is the classic move.

Add Batroun on the way back: the seafront, the Phoenician wall, and a Hilmi's lemonade are the standard programme.`,
    suggestedVehicleCategory: "compact",
    tags: ["coast", "history", "easy"],
    publishedAt: "2026-04-01",
    updatedAt: "2026-04-12T10:00:00.000Z",
  },
  {
    slug: "chouf-mountains",
    title: "Chouf Mountains",
    excerpt:
      "The Chouf Cedar Reserve, Beiteddine Palace, and the Druze villages of Lebanon's heartland.",
    coverImage: {
      src: "/images/Trips Images/chouf.jpg",
      alt: "Chouf mountains landscape",
      width: 1200,
      height: 1500,
    },
    meta: "8h Â· SUV recommended",
    region: "mountains",
    body: `The Chouf Cedar Reserve is Lebanon's largest cedar stand â€” a series of trails ranging from 30 minutes to a full-day hike. Beiteddine Palace, 30 minutes away, is the country's best-preserved 19th-century palace and hosts the Beiteddine Festival in summer.

The route is full of switchbacks; an SUV is more comfortable, though a sedan handles it in good weather. Lunch options include the seasonal restaurants in Deir el Qamar â€” try the kibbeh nayyeh.`,
    suggestedVehicleCategory: "suv",
    tags: ["mountains", "cedars", "history"],
    publishedAt: "2026-04-05",
    updatedAt: "2026-04-12T10:00:00.000Z",
  },
  {
    slug: "qadisha-valley",
    title: "Qadisha Valley",
    excerpt:
      "Maronite monasteries carved into a sandstone gorge â€” one of Lebanon's most cinematic drives.",
    coverImage: {
      src: "/images/Trips Images/qadisha.jpg",
      alt: "Qadisha valley monasteries",
      width: 1200,
      height: 1500,
    },
    meta: "9h Â· SUV recommended",
    region: "north",
    body: `The Qadisha (Holy) Valley is a UNESCO World Heritage site: a deep sandstone gorge dotted with Maronite monasteries and hermitages, several still in active use. The road follows the rim with several viewpoints; hikers can descend into the valley itself for a half-day walk.

Pair with the Cedars (15 minutes away) for a full day in northern Lebanon. SUV is recommended for the rim road in winter; in summer a sedan is fine.`,
    suggestedVehicleCategory: "suv",
    tags: ["mountains", "spiritual", "north"],
    publishedAt: "2026-04-10",
    updatedAt: "2026-04-12T10:00:00.000Z",
  },
];

/**
 * Default chauffeur-led itineraries (Phase 12 â€” Sample Itineraries surface).
 *
 * Seeds the /chauffeur "Sample itineraries" carousel, the /itineraries
 * listing page, and per-itinerary /itineraries/[slug] pages. Admin CRUD
 * overlays via lib/admin/store.ts (commit 6).
 */
export const ITINERARIES: Itinerary[] = [
  {
    slug: "cedars-of-god",
    title: "Cedars of God",
    excerpt: "The 6,000-year-old grove in the Bcharre mountains, with lunch at Hadath El Jebbeh.",
    coverImage: {
      src: "/images/Trips Images/cedars.jpg",
      alt: "Cedars of God grove",
      width: 1200,
      height: 1500,
    },
    category: "day-trip",
    duration: "Full day Â· 9-10 hours",
    priceFromCents: 22_000,
    highlights: [
      "Cedar grove visit",
      "Lunch stop in Bcharre",
      "Qadisha valley viewpoint",
      "Gibran museum (optional)",
    ],
    schedule: [
      {
        time: "08:30",
        title: "Pickup from your hotel",
        body: "Hazmieh, Beirut, or anywhere in Greater Beirut.",
      },
      {
        time: "10:30",
        title: "Bcharre coffee stop",
        body: "Stretch the legs, take in the valley view.",
      },
      { time: "12:30", title: "Cedars of God", body: "Guided walk through the grove (1h)." },
      { time: "13:30", title: "Lunch at Hadath El Jebbeh", body: "Traditional mountain mezza." },
      { time: "16:00", title: "Qadisha viewpoint", body: "Photo stop on the rim road." },
      { time: "18:00", title: "Return to hotel" },
    ],
    vehicleClass: "suv",
    updatedAt: "2026-04-12T10:00:00.000Z",
  },
  {
    slug: "baalbek-anjar-wine",
    title: "Baalbek, Anjar & Bekaa Wine",
    excerpt: "Roman temples, an Umayyad palace city, and a Bekaa Valley winery in one day.",
    coverImage: {
      src: "/images/Trips Images/baalbek.jpg",
      alt: "Baalbek Roman temples",
      width: 1200,
      height: 1500,
    },
    category: "wine",
    duration: "Full day Â· 9-10 hours",
    priceFromCents: 24_000,
    highlights: [
      "Baalbek temples (2h)",
      "Anjar archaeological site",
      "Bekaa winery tour & tasting",
      "Mezza lunch at Tawlet Ammiq",
    ],
    schedule: [
      { time: "08:30", title: "Pickup from your hotel" },
      {
        time: "10:30",
        title: "Baalbek arrival",
        body: "Guided tour of Jupiter and Bacchus temples.",
      },
      { time: "13:00", title: "Lunch at Tawlet Ammiq" },
      { time: "15:00", title: "Anjar Umayyad palace city" },
      { time: "16:30", title: "ChÃ¢teau Ksara cellar tour" },
      { time: "18:30", title: "Return to hotel" },
    ],
    vehicleClass: "sedan",
    updatedAt: "2026-04-12T10:00:00.000Z",
  },
  {
    slug: "byblos-batroun-coastal",
    title: "Byblos & Batroun",
    excerpt: "Phoenician harbour at Byblos, seaside Batroun, lemonade at Hilmi's, souk wandering.",
    coverImage: {
      src: "/images/Trips Images/byblos.jpg",
      alt: "Byblos harbour",
      width: 1200,
      height: 1500,
    },
    category: "day-trip",
    duration: "Full day Â· 8 hours",
    priceFromCents: 18_000,
    highlights: [
      "Byblos citadel & port",
      "Old souk wandering",
      "Hilmi's lemonade",
      "Batroun seafront",
    ],
    schedule: [
      { time: "09:00", title: "Pickup from your hotel" },
      { time: "10:00", title: "Byblos arrival" },
      { time: "12:30", title: "Seafood lunch at Pepe Abed" },
      { time: "14:30", title: "Drive to Batroun" },
      { time: "15:30", title: "Batroun seafront & souk" },
      { time: "17:00", title: "Return to hotel" },
    ],
    vehicleClass: "sedan",
    updatedAt: "2026-04-12T10:00:00.000Z",
  },
  {
    slug: "south-tyre-sidon",
    title: "Tyre & Sidon",
    excerpt: "Phoenician ruins along the south coast, with seafood lunch in Tyre's old port.",
    coverImage: {
      src: "/images/Trips Images/south lebanon.jpg",
      alt: "South Lebanon coast",
      width: 1200,
      height: 1500,
    },
    category: "south",
    duration: "Full day Â· 8 hours",
    priceFromCents: 20_000,
    highlights: [
      "Sidon Sea Castle",
      "Khan El Franj caravanserai",
      "Tyre Roman hippodrome",
      "Seafood lunch at Tyre old port",
    ],
    schedule: [
      { time: "09:00", title: "Pickup from your hotel" },
      { time: "10:00", title: "Sidon arrival", body: "Sea Castle + Khan El Franj." },
      { time: "13:00", title: "Seafood lunch at Tyre" },
      { time: "15:00", title: "Tyre archaeological site" },
      { time: "17:00", title: "Return to hotel" },
    ],
    vehicleClass: "sedan",
    updatedAt: "2026-04-12T10:00:00.000Z",
  },
  {
    slug: "chouf-cedars",
    title: "Chouf Cedars & Beiteddine",
    excerpt: "Lebanon's largest cedar reserve, Beiteddine Palace, and a Deir el Qamar lunch.",
    coverImage: {
      src: "/images/Trips Images/chouf.jpg",
      alt: "Chouf cedars",
      width: 1200,
      height: 1500,
    },
    category: "cultural",
    duration: "Full day Â· 9 hours",
    priceFromCents: 22_000,
    highlights: [
      "Chouf Cedar Reserve (1h walk)",
      "Beiteddine Palace tour",
      "Deir el Qamar lunch",
      "Druze village stop",
    ],
    schedule: [
      { time: "08:30", title: "Pickup from your hotel" },
      { time: "10:30", title: "Chouf Cedar Reserve" },
      { time: "13:00", title: "Deir el Qamar lunch" },
      { time: "15:00", title: "Beiteddine Palace" },
      { time: "18:00", title: "Return to hotel" },
    ],
    vehicleClass: "suv",
    updatedAt: "2026-04-12T10:00:00.000Z",
  },
  {
    slug: "north-tripoli-bsharre",
    title: "Tripoli & North Lebanon",
    excerpt: "Mamluk souks of Tripoli, the citadel, and on to Bsharre and the Qadisha viewpoints.",
    coverImage: {
      src: "/images/Trips Images/tripoli-north.jpg",
      alt: "Tripoli old city and citadel",
      width: 1200,
      height: 1500,
    },
    category: "north",
    duration: "Full day Â· 10 hours",
    priceFromCents: 26_000,
    highlights: [
      "Tripoli Mamluk souks",
      "Citadel of Raymond de Saint-Gilles",
      "Famous Tripoli sweets stop",
      "Bsharre + Qadisha viewpoints",
    ],
    schedule: [
      { time: "08:00", title: "Pickup from your hotel" },
      { time: "09:30", title: "Tripoli arrival" },
      { time: "12:30", title: "Lunch in Tripoli" },
      { time: "14:30", title: "Drive to Bsharre" },
      { time: "16:00", title: "Qadisha viewpoint" },
      { time: "18:00", title: "Return to hotel" },
    ],
    vehicleClass: "suv",
    updatedAt: "2026-04-12T10:00:00.000Z",
  },
];
/** Corporate tiers for /corporate (un-descoped in Phase 12). */
export const CORPORATE_TIERS: CorporateTier[] = [
  {
    id: "co-starter",
    name: "Starter",
    tagline: "For lean teams renting occasionally",
    perDayCents: 2400,
    fleetSize: "1-2 cars / month",
    inclusions: [
      "Corporate billing portal",
      "Single monthly invoice",
      "Priority WhatsApp line",
      "Free Hazmieh pickup",
    ],
  },
  {
    id: "co-growth",
    name: "Growth",
    tagline: "For growing companies with regular needs",
    perDayCents: 1950,
    fleetSize: "3-10 cars / month",
    inclusions: [
      "Dedicated account manager",
      "Volume pricing (up to 18% off)",
      "Free Greater Beirut delivery",
      "Driver document storage",
      "VAT-ready invoicing",
    ],
    popular: true,
  },
  {
    id: "co-enterprise",
    name: "Enterprise",
    tagline: "For enterprise fleets and corporate travel",
    perDayCents: null,
    fleetSize: "10+ cars / month",
    inclusions: [
      "Custom pricing & terms",
      "Reserved fleet allocation",
      "Onsite delivery & swap",
      "API integration with your travel system",
      "24/7 dedicated dispatch",
      "Quarterly business reviews",
    ],
    ctaLabel: "Contact sales",
  },
];

export const LOCATIONS_SEED = BRANCHES;

export const PROMOTIONS_SEED = SITE_CONFIG.promo
  ? [
      {
        id: "default-promo",
        message: SITE_CONFIG.promo.message,
        href: SITE_CONFIG.promo.href ?? null,
        active: true,
        starts_at: null,
        ends_at: null,
      },
    ]
  : [];

export const ABOUT_CONTENT_SEED = {
  storyParagraphs: localizeList(ABOUT_STORY_PARAGRAPHS, ABOUT_T.storyParagraphs),
  pullQuote: localize(ABOUT_PULL_QUOTE, ABOUT_T.pullQuote),
  fleetPhilosophy: {
    heading: localize(FLEET_PHILOSOPHY.heading, ABOUT_T.fleetHeading),
    paragraphs: localizeList(FLEET_PHILOSOPHY.paragraphs, ABOUT_T.fleetParagraphs),
  },
  stats: ABOUT_STATS.map((stat) => ({
    ...stat,
    label: localize(stat.label, ABOUT_T.statLabels[stat.label]),
  })),
  teamIntro: localize(ABOUT_TEAM_INTRO, ABOUT_T.teamIntro),
  teamDedication: localize(ABOUT_TEAM_DEDICATION, ABOUT_T.teamDedication),
  team: ABOUT_TEAM.map((member) => ({
    ...member,
    role: localize(member.role, ABOUT_T.roles[member.name]),
    quote: member.quote ? { en: member.quote, ar: member.quote, fr: member.quote } : undefined,
    bio: { en: member.bio, ar: member.bio, fr: member.bio },
    highlights: {
      en: member.highlights ?? [],
      ar: member.highlights ?? [],
      fr: member.highlights ?? [],
    },
  })),
};

/** Build a localized string from an English base + optional AR/FR overrides. */
function localize(value: string, t?: LocaleText) {
  return { en: value, ar: t?.ar ?? value, fr: t?.fr ?? value };
}

/** Build a localized string array from an English base + optional AR/FR overrides. */
function localizeList(value: string[], t?: LocaleList) {
  return { en: value, ar: t?.ar ?? value, fr: t?.fr ?? value };
}

for (const trip of TRIPS) {
  const tr = TRIP_T[trip.slug];
  trip.title = localize(toLocalizedString(trip.title).en, tr?.title);
  trip.excerpt = localize(toLocalizedString(trip.excerpt).en, tr?.excerpt);
  trip.meta = localize(toLocalizedString(trip.meta).en, tr?.meta);
  trip.body = localize(toLocalizedString(trip.body).en, tr?.body);
  trip.coverImage.alt = localize(toLocalizedString(trip.coverImage.alt).en, tr?.alt);
  trip.tags = localizeList(toLocalizedStringArray(trip.tags).en, tr?.tags);
}

for (const itinerary of ITINERARIES) {
  const it = ITINERARY_T[itinerary.slug];
  itinerary.title = localize(toLocalizedString(itinerary.title).en, it?.title);
  itinerary.excerpt = localize(toLocalizedString(itinerary.excerpt).en, it?.excerpt);
  itinerary.duration = localize(toLocalizedString(itinerary.duration).en, it?.duration);
  itinerary.coverImage.alt = localize(toLocalizedString(itinerary.coverImage.alt).en, it?.alt);
  itinerary.highlights = localizeList(toLocalizedStringArray(itinerary.highlights).en, it?.highlights);
  itinerary.schedule = itinerary.schedule.map((step, i) => ({
    ...step,
    title: localize(toLocalizedString(step.title).en, it?.schedule[i]?.title),
    body: step.body
      ? localize(toLocalizedString(step.body).en, it?.schedule[i]?.body)
      : undefined,
  }));
}

for (const group of FAQS) {
  group.title = localize(toLocalizedString(group.title).en, FAQ_GROUP_T[group.id]);
  group.entries = group.entries.map((entry) => ({
    ...entry,
    question: localize(toLocalizedString(entry.question).en, FAQ_T[entry.id]?.question),
    answer: localize(toLocalizedString(entry.answer).en, FAQ_T[entry.id]?.answer),
  }));
}

for (const tier of CORPORATE_TIERS) {
  const ct = CORPORATE_T[tier.id];
  tier.name = localize(toLocalizedString(tier.name).en, ct?.name);
  tier.tagline = localize(toLocalizedString(tier.tagline).en, ct?.tagline);
  tier.fleetSize = localize(toLocalizedString(tier.fleetSize).en, ct?.fleetSize);
  tier.inclusions = localizeList(toLocalizedStringArray(tier.inclusions).en, ct?.inclusions);
  if (tier.ctaLabel) {
    tier.ctaLabel = localize(toLocalizedString(tier.ctaLabel).en, ct?.ctaLabel);
  }
}
