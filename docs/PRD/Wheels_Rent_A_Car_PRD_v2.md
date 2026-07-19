# Wheels Rent A Car

**Lebanon — Customer Website**
**Product Requirements Document, UX Flows & Sitemap**
Phase 1 — Customer-facing booking website · **INK & SIGNAL** redesign
Version 2.0 · Prepared by Stratagem Research

| Field | Value |
| --- | --- |
| Document | Wheels Rent A Car — PRD, UX & Sitemap |
| Version | **2.0** (supersedes v1.0) |
| Status | Released — Phase 1 build shipped |
| Owner | Stratagem Research — Marc Khamis (`marc@stratagemresearch.co`) |
| Audience | Internal team, development agency, design partners |
| Scope | Phase 1 only — customer-facing site (English) |
| Out of scope | Native mobile apps, marketing automation, multilingual (Phase 2+) |

---

## Changes from v1.0

This revision aligns the PRD with the WHEELS / INK & SIGNAL design system and the as-built Phase 1 implementation. The high-level intent is unchanged; the structural decisions that drove the rebuild are summarised below.

1. **Design system overhaul (INK & SIGNAL).** Single typeface (Geist). Monochrome ink ramp + paper canvas. Red used **once per screen** as the singular CTA. Blue reserved for informational links / selected state. Pill buttons everywhere. No shadows on regular cards.
2. **Single Hazmieh branch.** The multi-branch model (BEY desk + city branches) collapses to one physical hub: **Hazmieh Gallery Semaan, facing Sea Sweet, next to Lancaster Tamar Hotel, Beirut**. Address Delivery still covers anywhere in Greater Beirut (including the airport).
3. **PDP removed.** The dedicated vehicle detail page is dropped. Clicking a vehicle card expands it inline on `/vehicles` (Sixt-style "car selected" panel).
4. **Unified `/vehicles` page.** One canonical results page replaces the legacy `/vehicles`, `/vehicles/[category]`, and `/vehicles/[slug]` routes. Category filtering is driven by the `?category=` query parameter. Booking step 1 lives at `/vehicles?step=1`.
5. **Chauffeur restored in Phase 12.** Initially descoped in v2; restored as a full service page with sample-itineraries carousel (linked to a dedicated `/itineraries` listing).
6. **Cookie banner re-skinned.** Ink-100 surface with paper text + primary-inverse "Accept all" pill, consistent with the brand's inverse-block treatment.
7. **Motion layer.** Framer-motion adds gentle scroll-reveals on landing sections and a stagger animation on the results grid; honours `prefers-reduced-motion`.

## Changes in Revision 2 (Phase 12)

The walkthrough call with Wheels (May 2026) approved the INK & SIGNAL direction and locked the following expansions:

1. **Hero cinematic redesign.** The homepage hero swaps the two-tone grey canvas for a full-bleed cinematic Lebanon photograph with a dark gradient overlay; headline + chips repaint to paper. The SearchBar stays `card-floating` so it lifts cleanly off the photo.
2. **`/corporate` un-descoped.** New page with hero, value props, 3-tier comparison (Starter / Growth / Enterprise), how-it-works, FAQ, and a corporate enquiry form posting to `/api/leads/corporate`.
3. **Trips / blog surface.** New self-drive trip articles: homepage Explore Lebanon carousels through them, `/trips` lists all with region filters, `/trips/[slug]` is the article template.
4. **Sample Itineraries (chauffeur).** `/chauffeur` Sample Itineraries section becomes a scroll-right carousel; new `/itineraries` listing page with category filters; new `/itineraries/[slug]` detail with highlights + schedule timeline.
5. **Admin dashboard.** `/admin` with hardcoded `admin / admin123` (staging-only client-side gate) for managing Trips, Itineraries, FAQs (sections + questions), and Corporate tier content. Backed by localStorage; drop-in replaceable with real backend. `/admin/*` is excluded from indexing via middleware.

The v1.0 PDF and DOCX remain in `/docs/PRD/` as historical artefacts. **This v2 Markdown (Revision 2) is the source of truth.**

---

## 1. Executive Summary

This document defines the Phase 1 scope, user experience, sitemap, and functional requirements for the new Wheels Rent A Car Lebanon website. It expands on the original PRD by translating high-level goals into screen-by-screen UX, a detailed information architecture, low-fidelity wireframe descriptions, and a Lebanon-localized feature set.

The site replaces the existing `wheelsrentacar.com.lb` experience with a modern, conversion-focused platform built on three references — Rivian (monumental typography), Tripadvisor (inverse marketing blocks), Sixt (dark vehicle cards with inline expansion). The platform must surface real-time inventory and pricing from Wheels' internal management system, and reduce manual booking handling to near zero.

Phase 1 deliberately excludes the operations admin panel, native mobile apps, and marketplace integrations. Localization is English-only at launch, with the architecture prepared for Arabic and French in Phase 2.

**Strategic positioning**

- Premium, touristic, lifestyle-oriented brand voice.
- Best-in-class booking UX: minimum clicks from landing to confirmed reservation.
- Lebanon-native: Hazmieh hub pickup, address delivery anywhere in Greater Beirut, WhatsApp assistance, cash and local bank-transfer options.
- Fully integrated with Wheels' fleet and operations system — single source of truth.

---

## 2. Goals & Success Metrics

### 2.1 Business goals

- Increase online booking conversion rate by replacing the legacy site with a frictionless flow.
- Eliminate manual handling for standard reservations through end-to-end system integration.
- Position Wheels as Lebanon's premium, tourist-friendly car rental brand.
- Capture demand from inbound tourists arriving at BEY (handled via Address Delivery).
- Reduce drop-off in the booking funnel through transparent pricing and clear copy.

### 2.2 Phase 1 KPIs

| KPI | Definition | Target (Year 1) |
| --- | --- | --- |
| Booking conversion rate | Sessions with completed booking / total sessions | ≥ 4.5% |
| Booking-flow drop-off | Users who start `/book` and don't reach confirmation | ≤ 55% |
| Time to first booking step | Landing → first interaction with search bar | < 12s median |
| Manual booking handling | Bookings requiring human intervention pre-pickup | < 5% |
| Mobile share of bookings | Bookings completed on mobile device | ≥ 55% |
| WhatsApp-assisted conversions | Sessions that touch WhatsApp & convert | Track baseline |
| Lighthouse performance (mobile) | Median across landing, /vehicles, checkout | ≥ 90 |
| Booking sync error rate | Failed / total real-time syncs to internal system | < 0.5% |
| NPS post-booking | Email survey after pickup | ≥ 50 |

---

## 3. Target Users & Personas

Phase 1 prioritises three primary personas. The site must visibly serve each of them on the homepage, in navigation, and in the booking flow.

### 3.1 Persona — Inbound Tourist (primary)

| Field | Value |
| --- | --- |
| Profile | International visitor, 28–55, arriving via BEY, 1–14 day rental |
| Devices | Mobile-first (iOS and Android), often on hotel Wi-Fi or international roaming |
| Top jobs | Find a car for airport pickup; understand insurance; pay confidently in USD or by card |
| Pain points | Hidden fees, unclear deposits, language friction, distrust of local operators |
| Site implications | Prominent Address Delivery to BEY; insurance tier comparison; English-first; visible trust strip; flight-number capture at checkout |

### 3.2 Persona — Local Lebanese Renter (primary)

| Field | Value |
| --- | --- |
| Profile | Lebanese resident, 25–50, weekend trip, replacement vehicle, or longer-term need |
| Devices | Mostly mobile; comfortable on WhatsApp |
| Top jobs | Quick reservation; pay cash or by local transfer; pickup from Hazmieh hub |
| Pain points | Card payment friction, deposit holds; rigid booking forms; slow confirmation |
| Site implications | Cash + bank-transfer (OMT/Whish/Bob) checkout path; WhatsApp completion option; Lebanese phone format default |

### 3.3 Persona — Business Traveler (primary)

| Field | Value |
| --- | --- |
| Profile | Executive or SME, multi-day rental, often longer term |
| Devices | Desktop and mobile; expects emailed invoice |
| Top jobs | Reliable car, on-time delivery, billing receipt, optional door delivery |
| Pain points | Receipt/invoice friction, no monthly pricing |
| Site implications | Long-term rental tier on `/long-term`, address delivery, invoice-ready confirmation email |

### 3.4 Secondary persona — Expat / Returning Diaspora

Treated as a sub-segment of Inbound Tourist; same flows but more likely to choose monthly tiers and address delivery to family addresses.

> **Removed in v2.** The dedicated "Chauffeur" and "Corporate" sub-personas from v1 are descoped in Phase 1; both backing routes return 404. Their module specs (`07_chauffeur.md`, `08_corporate.md`) are retained for future revival.

---

## 4. Information Architecture & Sitemap

The site is organised around the booking task, with discovery and trust-building content arranged to support conversion. The sitemap below covers all Phase 1 pages.

### 4.1 Top-level navigation

- **Vehicles** — unified results page with inline car-selected expansion
- **Long-term** — monthly tier comparison + enquiry form
- **Chauffeur** — driver-led service with sample-itineraries carousel
- **Corporate** — B2B fleet rental with tier comparison + enquiry form
- **Locations** — single Hazmieh hub (address + hours + parking)
- **About** — brand story, fleet philosophy, team
- **Trips** — self-drive trip guides (CMS-driven content)
- **Itineraries** — chauffeur-led itineraries listing (CMS-driven content)
- **Help** — FAQ, rental terms, insurance, payment, cancellation
- **Contact** — WhatsApp / phone / email, contact form

### 4.2 Full sitemap

| URL | Page | Access |
| --- | --- | --- |
| `/` | Home | Public |
| `/vehicles` | Canonical results page (filterable; inline car-selected expansion) | Public |
| `/vehicles?category=<slug>` | Category-filtered view (sedan / suv / luxury / 7-seater / …) | Public |
| `/vehicles?selected=<slug>` | Auto-expand the matching card on load | Public |
| `/vehicles?step=1` | Booking funnel step 1 — Vehicle (renders the Stepper) | Public |
| `/book/select-vehicle` | Redirects → `/vehicles?step=1&...` | Public |
| `/book/extras` | Add-ons selection (baby seats, GPS, etc.) | Public |
| `/book/protection` | Insurance / protection package tiers | Public |
| `/book/checkout` | Customer info + payment method | Public |
| `/book/confirmation/[ref]` | Booking confirmation, receipt | Public |
| `/locations` | Single Hazmieh branch page | Public |
| `/long-term` | Monthly rental landing | Public |
| `/chauffeur` | Chauffeur service (with sample-itineraries carousel) | Public |
| `/corporate` | Corporate rental with tier comparison + enquiry form | Public |
| `/trips` | Self-drive trip articles listing (region filters) | Public |
| `/trips/[slug]` | Trip article detail | Public |
| `/itineraries` | Chauffeur-led itineraries listing (category filters) | Public |
| `/itineraries/[slug]` | Itinerary detail with highlights + schedule | Public |
| `/about` | Brand story | Public |
| `/help` | Support hub | Public |
| `/help/faq` | FAQ | Public |
| `/help/rental-terms` | Rental terms | Public |
| `/help/insurance-and-coverage` | Insurance explainer | Public |
| `/help/payment-and-deposits` | Payment & deposit policy | Public |
| `/help/cancellation-policy` | Cancellation policy | Public |
| `/contact` | Contact page | Public |
| `/manage-booking` | Lookup by ref + email (no login) | Public |
| `/login` | Sign in | Public |
| `/register` | Create account | Public |
| `/forgot-password` | Password recovery request | Public |
| `/reset-password` | Password reset | Public |
| `/account` | Account dashboard | Authenticated |
| `/account/bookings` | Booking history list | Authenticated |
| `/account/bookings/[ref]` | Booking detail | Authenticated |
| `/account/profile` | Profile + preferences | Authenticated |
| `/account/documents` | Driver's licence + ID upload | Authenticated |
| `/account/saved-vehicles` | Wishlist / saved cars | Authenticated |
| `/privacy` | Privacy policy | Public |
| `/terms` | Terms of service | Public |
| `/cookies` | Cookie policy | Public |
| `/404`, `/error`, `/maintenance` | Error & utility pages | Public |
| `/admin` | Admin dashboard home (staging-only, client-gated, `noindex`) | Admin |
| `/admin/login` | Admin sign-in (hardcoded `admin/admin123`) | Public (no SEO) |
| `/admin/trips` | Trips CRUD (list + new + edit) | Admin |
| `/admin/itineraries` | Itineraries CRUD | Admin |
| `/admin/faqs` | FAQ sections + questions editor | Admin |
| `/admin/corporate` | Corporate tier editor | Admin |

**Routes removed in v2:**

- `/vehicles/[category]` — collapsed into `/vehicles?category=<slug>`
- `/vehicles/[slug]` (PDP) — replaced by inline `?selected=<slug>` expansion
- `/locations/beirut-airport` and `/locations/[branch]` — single Hazmieh hub

**Routes restored in Revision 2 (Phase 12):**

- `/chauffeur` — full chauffeur service page with sample-itineraries carousel
- `/corporate` — restored as a B2B service page with tier comparison and enquiry form

### 4.3 Visual sitemap

See `Wheels_Sitemap_v2.svg` in this folder. Re-export to PNG when stakeholder reviews require a flat asset.

---

## 5. Global UI System

Components shared across every page. The Phase 1 implementation lives under `/components/` (primitives in `components/ui/`, shell pieces in `components/shell/`, landing pieces in `components/landing/`).

### 5.1 Header

Sticky on every public route. **Three variants:**

- `default` — paper background, ink-100 logo + nav, 1px ink-20 border-bottom (used on most pages)
- `overlay` — transparent over a dark hero; solid paper once scrolled past 60px
- `inverse` — ink-100 surface, paper text (for dark hero sections)

Phase-1 home uses `default` (the landing hero is paper canvas).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [LOGO]   Vehicles  Locations  Long-term  About  Help              Phone WA  │
│                                                                       Sign in │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Search bar (TravelPerk pattern)

The most important component on the site. Sits inside a `card-floating` (paper + rounded-2xl + elevation-2) — the only shadowed element on the landing page.

**Tab row above the card (`HeroSearchTabs`):** Cars (default, wired) · Long-term (routes to `/long-term`). Chauffeur and Airport-transfer tabs were dropped in Phase 1; the structure can hold more later without breaking the layout.

**Fields:**

1. Pickup location (full-width row) — branch / address-delivery picker with the `+ Different return location` ghost link inline
2. Date range pair (3-month range calendar, range mode)
3. Pickup-time + return-time pickers (2-column pill grid)
4. Promo code (collapsible tertiary link)
5. `SHOW CARS` red pill CTA — the singular red on the page, 56px tall

**Mobile** collapses to a single compact pill that opens a bottom sheet.

### 5.3 Footer (Rivian pattern)

- Massive `display-2xl` "WHEELS" wordmark anchored top-left (responsive clamp 72→192px)
- Four columns: Wheels · Help · Contact · Trust
- Bottom strip: copyright · legal links · language switcher (EN active; AR/FR show "Coming soon" struck-through) · social icons

### 5.4 Floating WhatsApp button

Persistent on every page (hidden only on `/book/checkout`). 56px circle, locked `#25D366` green, bottom-right, context-aware pre-filled message per route.

### 5.5 Cookie & consent banner

Bottom-anchored on first visit. Ink-100 surface with paper text. Two actions: `Accept all` (primary-inverse white pill) · `Manage preferences` (secondary-inverse outline). Preferences modal opens to a `rounded.3xl` paper card with toggle rows on ink-10 tiles.

### 5.6 Newsletter popup

Fires 30s after landing on `/`. Suppressed for 30 days once dismissed. Modal headline-lg "Get weekly deals." Submit CTA is the singular red (`variant="cta"`, 56px) for that surface.

---

## 6. Page-by-Page UX & Wireframes

For each page below: purpose, content blocks, layout description, primary actions, edge cases.

### 6.1 Home — `/`

**Purpose** — Convert intent traffic into bookings within seconds, while introducing the premium brand to discovery traffic.

**Section order (per `docs/Implementation/landingpage.md`):**

1. **Hero** — paper canvas, `display-2xl` headline "Drive Lebanon, your way.", `lead-lg` sub, HeroSearchTabs + SearchBar, trust chips beneath ("★ 4.8 on Google · 1,000+ rentals · Hazmieh hub · 24/7 WhatsApp"). **No hero image** — the headline IS the hero.
2. **Hero promo** — Tripadvisor-style inverse marketing block: "Travelers' choice — the cars you trust at Hazmieh." White pill CTA "Browse fleet →".
3. **Categories** — 4 Rivian-pattern cards (Sedan, SUV, Luxury, 7-Seater) with the category name set in `display-mega` (144px desktop, 112px mobile) behind the vehicle photo. Each card opens to `/vehicles?category=<slug>`.
4. **Our Benefits** — tinted ink-10 band, 4 paper cards: "Free pickup at Hazmieh", "Free cancellation up to 24h", "WhatsApp 24/7", "Pay how you want".
5. **Featured 4 Cars** — full-bleed ink-100 band with 4 dark VehicleCards. Cards lift to ink-90 to read off the band. CTA "View the full fleet →" routes to `/vehicles`.
6. **Explore Lebanon** — 3 editorial tiles (Cedars, Baalbek & Anjar, Tyre & Sidon) with bottom-anchored scrim text.
7. **Long-term promo** — full-bleed ink-100 band with `display-xl` "Drive longer. Save more.", XL primary-inverse white pill "Get a quote →" routing to `/long-term`.
8. **Reviews** — 3 tinted cards with monochrome ink-100 stars. Section hides silently if the reviews API returns empty.

JSON-LD: `Organization` + `WebSite` (with `SearchAction` pointing at the search bar).

### 6.2 Vehicles — `/vehicles`

**Purpose** — Single canonical results page; replaces the legacy fleet listing, the category routes, and the PDP.

**Content blocks:**

- Sticky top band: `<SearchBar variant="compact" />`
- Heading: `display-md` "Which car do you want to drive?"
- Toolbar of pill chips: **Lowest price** · **Filter** (opens `FilterSidebar` in a right-anchored Sheet with the active count) · **Guaranteed model** · **Auto only**
- 3-up grid of dark `VehicleCard`s (lg) / 2-up (md) / 1-up (sm)
- When `?selected=<slug>` is present, the matching card auto-expands into `<VehicleCardExpanded />` (spans 2 cols on lg)

**Inline car-selected panel (`VehicleCardExpanded`):**

- Photo left; booking option (Best Price vs Flexible) + mileage (200 km/day vs Unlimited) + total + 2 CTAs right
- Red `Next →` writes the choice into the booking draft and routes to `/book/extras`
- Black `Ask on WhatsApp` deep-links with the vehicle name pre-filled
- Close × clears `?selected=` and collapses the panel back to a regular card

**Step-1 booking mode:** visiting `/vehicles?step=1` renders the booking Stepper above the toolbar. Pressing Next inside the expanded panel writes the vehicle into the draft and routes to `/book/extras`.

```
┌── HEADER ─────────────────────────────────────────────────────────────────┐
│ Hazmieh · May 20 10:00 → May 25 10:00 · 5 days ·  ✏ Edit                  │
├──────────────────────────────────────────────────────────────────────────┤
│ WHICH CAR DO YOU WANT TO DRIVE?                                          │
│ [ Lowest price ] [ Filter · 2 ] [ Guaranteed model ] [ Auto only ]       │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌── dark card ──┐  ┌── dark card ──┐  ┌── dark card ──┐                 │
│ │ TOYOTA YARIS  │  │ KIA CERATO    │  │ MITSUBISHI    │                 │
│ │ or similar    │  │ or similar    │  │ ASX           │                 │
│ │ [5][AUTO][PE] │  │ [5][AUTO][PE] │  │ [5][AUTO][PE] │                 │
│ │ $25/DAY [SEL] │  │ $32/DAY [SEL] │  │ $48/DAY [SEL] │                 │
│ └───────────────┘  └───────────────┘  └───────────────┘                 │
└──────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Vehicle Detail Page — **REMOVED in Phase 1**

The dedicated PDP route (`/vehicles/[slug]`) is dropped. The inline car-selected panel on `/vehicles` replaces it. The module spec `03_vehicle_detail.md` is marked DEPRECATED.

### 6.4 Booking flow — step by step

The booking flow is a 5-step linear funnel with a persistent stepper at the top and a sticky summary panel on the right (desktop) or expandable bottom sheet (mobile).

**Stepper (always visible):**

```
1. Vehicle  →  2. Extras  →  3. Protection  →  4. Checkout  →  5. Confirmation
```

Steps 1–4 are clickable to go back; step 5 is read-only. Active + complete steps in ink-100 with a checkmark; future steps in ink-50.

#### Step 1 — `/vehicles?step=1`

Same canonical results page as 6.2, with the Stepper rendered above the toolbar. `/book/select-vehicle` redirects here, forwarding any query string.

#### Step 2 — `/book/extras`

Add-ons grouped by category (Driver & access, Comfort, Connectivity, Convenience, Sustainability). Each row uses `<AddOnRow />`: 2px ink-100 outline on active, ink-100 icon swatch when on. Switch for single-quantity items, `QuantityStepper` for multi-quantity items. Sticky right rail uses `FlowSummaryPanel` (card-floating).

#### Step 3 — `/book/protection`

3 tier cards via `<ProtectionTierCard />`: surface `card-default` rounded-xl, inner max-liability box `card-tint`, popular tier wears a 2px ink-100 outline + `badge-popular` (black ribbon). Inclusions checkmarks in ink-100 (no green).

#### Step 4 — `/book/checkout`

Driver details · Licence details · Pickup details (conditional) · Payment method · Promo code · Terms checkbox · Marketing opt-in.

`<PaymentMethodSelector />` shows the 4 methods as outlined cards; selected method opens a `<Card variant="tint" />` panel below:

- **Card** — Areeba-hosted form stub (no raw PAN client-side)
- **Cash on pickup** — info copy only; booking confirms instantly
- **Bank transfer** — bank details + reference (booking ref) + file upload (proof of transfer required)
- **OMT / Whish / Bob Finance** — payment code + branch reference + optional receipt upload

`<HoldTimer />` shows the 24-minute booking hold in `bg-warning-bg / text-warning` (orange — never red, so the singular red CTA stays uncontested). Mobile sticky bottom bar: ink-100 surface, paper text, red `Pay & confirm` CTA at the right.

#### Step 5 — `/book/confirmation/[ref]`

Confirmation screen. Email + WhatsApp message also sent. Booking ref in mono with copy-to-clipboard. Vehicle, pickup, return, total summary. Next-steps checklist. "Add to calendar" buttons. Modify / cancel inline actions. "Create an account in 1 click" upsell pre-filled from booking.

### 6.5 Locations — `/locations`

**Single Hazmieh page.** Inverse hero (`display-xl` "Visit us in Hazmieh.") + the SearchBar on a paper canvas + a leaner address/hours/contact stack on `card-tint` (rounded-xl) with directions, click-to-call, WhatsApp, and a primary-black `Browse cars` button (red stays reserved for the SearchBar's `Show cars`).

Below: a "Cars usually at our branch" snap-scroll using light VehicleCards, then a Common questions accordion.

### 6.6 Long-term — `/long-term`

Inverse hero band (display-xl "Drive longer. Save more.", primary-inverse + tertiary-inverse pill pair). Tier comparison: 4 `<TierCardLongTerm />` (1 / 3 / 6 / 12 months) — popular tier (6-month) wears 2px ink-100 + `badge-popular`. Get-a-quote button is primary (black) on every tier; the singular red is on the enquiry-form submit at the bottom. Inclusions checkmarks in ink-100. The form lives inside a paper card on an ink-10 band; we follow up within 24h.

### 6.7 Chauffeur — `/chauffeur`

**Restored in Revision 2.** Inverse hero ("Sit back. We'll handle the driving."), three service formats (Airport transfer / Day trip / By the hour), vehicle classes (Sedan / SUV / Van), how-it-works row, **Sample Itineraries scroll-right carousel** (most-requested chauffeur-led tours, pulled from the admin store), driver trust block, FAQ accordion, enquiry form. The "See all itineraries →" link routes to `/itineraries` for the full catalog. Singular red CTA = the enquiry-form submit.

### 6.8 Corporate — `/corporate`

**Restored in Revision 2.** Inverse hero ("Drive your business."), 4-up value props (Dedicated fleet · Single monthly invoice · Account manager · Maintenance handled), 3-tier comparison (Starter / Growth / Enterprise) via `<TierCardCorporate />`, how-it-works row, inclusions strip, FAQ, and an enquiry form posting to `/api/leads/corporate`. Singular red CTA = the enquiry-form submit.

### 6.13 Trips — `/trips` and `/trips/[slug]`

**Added in Revision 2.** Self-drive trip guides — editorial articles for renters who want a curated drive plan. `/trips` is the listing with region filters (Mountains / Coast / Bekaa / Cultural / North / South); each tile uses `<DestinationTile />` and links to `/trips/[slug]`. `/trips/[slug]` is the article template: hero cover photo, body in `body-lg` narrow column, suggested-vehicle card (singular red CTA = "Browse [category] cars"), related-trips strip. Content is admin-managed via `/admin/trips`.

### 6.14 Itineraries — `/itineraries` and `/itineraries/[slug]`

**Added in Revision 2.** Chauffeur-led itineraries — pre-packaged tours with set highlights and schedule. `/itineraries` is the listing with category filters (Day trips / Multi-day / Cultural / Wine / North / South). `/itineraries/[slug]` shows the cover photo, highlights list, schedule timeline, and a vehicle-class card. Singular red CTA = "Request this itinerary" linking to `/chauffeur#enquiry`. Content is admin-managed via `/admin/itineraries`.

### 6.15 Admin — `/admin/*`

**Added in Revision 2 — staging only.** Demo-grade CMS for the dynamic content surfaces. Routes:
- `/admin/login` — paper-canvas sign-in. Hardcoded `admin / admin123`, sessionStorage-backed gate.
- `/admin` — dashboard with 4 quick-action tiles + live counts pulled from the store.
- `/admin/trips`, `/admin/itineraries` — list + create + edit, with delete + reset-to-defaults.
- `/admin/faqs` — two-pane sections / questions editor.
- `/admin/corporate` — multi-tier editor with inline price, inclusions, popular flag.

Writes persist to `localStorage` via `lib/admin/store.ts`. Public pages read from the same store through `useAdminStore` hooks, falling back to seed fixtures. Middleware adds `X-Robots-Tag: noindex, nofollow` so admin routes never appear in search results. The whole layer is designed for swap-out — replace the auth helpers + store with real backend calls before production.

### 6.9 About — `/about`

Editorial inverse hero: `display-2xl` "We pick you up. / We wait for you." Story narrows to 720px in body-lg with an ink-100 pull-quote border. `<StatStrip />` on `bg-ink-10` with display-md numbers. `<TeamCard />` rounded-xl photos. Find-us card linking to `/locations`. Final inverse band with the singular red `Browse cars` CTA.

### 6.10 Help & FAQ — `/help/*`

Inverse hero with `display-xl` "How can we help?" + search bar on the ink-100 background. Topic tiles use `<Card variant="tint" />`. Sub-articles use `LegalArticleLayout` with a TOC sidebar (`label-md` uppercase pill-rounded; active section fills with ink-100 + paper text).

### 6.11 Contact — `/contact`

Inverse hero. 3 channel cards (`<ChannelCard />`):

- **WhatsApp** — locked green border, primary CTA `Chat now`
- **Phone** — paper card; collapses to "Closed — message us on WhatsApp." (warning-orange pill) outside business hours
- **Email** — paper card with mailto CTA

Below: contact form on a paper card (ink-10 band), branch map with selected-state cards (2px ink-100 outline), and a Follow-us strip.

### 6.12 Account & Manage Booking

**Account shell** has a left sidebar (`<AccountNav />`) with pill-rounded uppercase nav. Active route fills with ink-100; hover lifts to ink-10.

- **`/account`** — time-of-day greeting (`headline-xl` "Good morning, Marc."). Upcoming booking on `card-floating`. Quick-action cards (Browse cars · Manage documents · Update profile). Recent-bookings list rows.
- **`/account/bookings`** — filter chips (All · Upcoming · Pending · Completed · Cancelled) with counts. `<BookingHistoryRow />` cards rounded-xl on paper. Pill-rounded pagination.
- **`/account/bookings/[ref]`** — `<BookingDetailPanel />` rebuilt as `card-floating`. Pending state shows a warning-orange "Next steps" block.
- **`/account/profile`** + `documents` + `saved-vehicles` — paper section cards (`<Card variant="default" />`).

**Manage Booking (no login)** at `/manage-booking` — inverse hero "Find my booking." Paper-card lookup form with the singular red `Find my booking` CTA. On match, render `<BookingDetailPanel />` plus a `card-inverse` "Want easier access?" upsell with a primary-inverse CTA.

---

## 7. Lebanon-Specific Feature Deep Dive

### 7.1 WhatsApp integration

**Touchpoints:**

- Floating WhatsApp button (every page except `/book/checkout`) — context-aware pre-filled message per route
- Header WhatsApp icon (locked green)
- `<VehicleCardExpanded />` CTA "Ask on WhatsApp" (with model name)
- Mid-checkout assistance prompt after 30s idle on `/book/checkout`
- Confirmation screen + email — "Save our WhatsApp: +961 …"
- 24h pre-pickup reminder via WhatsApp Business API
- Post-rental review request via WhatsApp

**Implementation requirements:**

- WhatsApp Business API account (Twilio, MessageBird, or Meta Cloud) with a single Wheels Business number
- Pre-filled message templates per touchpoint
- Internal routing inbox so multiple agents can respond — recommend 360dialog or Respond.io
- Opt-in capture at checkout: "Send my booking updates via WhatsApp" (default ON for +961 numbers, OFF for international)

### 7.2 Cash on pickup, local bank transfer & OMT

| Method | When available | Deposit handling | User experience |
| --- | --- | --- | --- |
| Credit / Debit card | Always | Pre-auth hold on card at pickup | Standard flow — instant confirm |
| Cash on pickup (USD / LBP) | Toggle per branch / category | Cash deposit at counter | Booking confirms instantly; we WhatsApp to verify 24h before pickup |
| Bank transfer | Pickup ≥ 48h away | Full payment before pickup | Bank details + booking ref shown; user uploads proof; **Pending** until verified |
| OMT / Whish / Bob Finance | Local Lebanese | Full payment via local cash network | Payment code + branch reference shown; optional receipt upload; **Pending** until verified |

**Booking states:** add a **Pending** state to the standard Confirmed / Cancelled set. Cash bookings are Confirmed instantly; Bank-transfer + OMT bookings sit in Pending until ops verifies.

### 7.3 Hazmieh hub pickup, address delivery & airport

**Pickup type categories** on the search bar's location picker:

- **Hazmieh branch** — pick up from the hub (free)
- **Address Delivery** — driver delivers anywhere in Greater Beirut, **including Beirut Airport (BEY)**; fee zone-based

**Address delivery UX:**

- Pickup dropdown surfaces Address Delivery as an option
- Address autocomplete (Google Places / OpenCage), delivery-fee preview by zone
- Same-as-pickup toggle for return
- Checkout shows delivery fee as a separate line item
- Confirmation includes a "Where will the car be delivered?" map and contact info for the delivery driver

**Airport pickup specifics:** the flight-number field appears on `/book/checkout` when delivery address is BEY. Ops uses the flight number to track ETA; held vehicle is extended up to 90 min free if the flight is delayed.

---

## 8. Functional Requirements

### 8.1 Real-time inventory & pricing

- Vehicle availability MUST reflect Wheels' internal management system in near real-time (≤ 60s lag).
- Pricing rules (base rate, seasonal multipliers, length-of-rental discounts, promo codes) MUST be calculated server-side, internal system as the source of truth.
- If a vehicle's price changes mid-funnel, system MUST recalculate at `/book/checkout` entry and surface a non-blocking toast if total moves by > 1%.
- If a vehicle becomes unavailable mid-funnel, user MUST be redirected to `/vehicles?step=1` with a non-blocking notice and the same dates pre-applied.

### 8.2 Booking creation

- Successful checkout creates a reservation in the internal system in the same request that returns confirmation to the user.
- If the sync fails: card is NOT charged, user sees a friendly retry screen, ops is alerted.
- Booking reference format: **`WRC-YYMMDD-XXXX`** (4-char alphanumeric).
- Confirmation email sent within 30s of booking; WhatsApp message within 60s if opted in.

### 8.3 Search & filters

- Filter changes update results without full page reload (URL-driven, `router.replace`, no scroll).
- URL reflects filter state (shareable links): `/vehicles?category=suv&transmission=automatic`.
- Sort options: Recommended (default), Price low → high, Price high → low, Largest car.
- `?selected=<slug>` auto-expands the matching card on load.
- `?step=1` switches the page into booking-funnel mode (Stepper renders, NEXT routes to `/book/extras`).

### 8.4 Account & guest checkout

- Guest checkout is supported throughout — account creation is optional.
- Account creation can be 1-click from the confirmation page (email + sets password).
- Authenticated users have pre-filled checkout (driver details, licence).
- Driver licence and ID upload supported on `/account/documents` — accepted on subsequent bookings.

### 8.5 Manage booking

- `/manage-booking` — booking ref + email lookup → booking detail page with same actions as authenticated.
- Edit pickup / return time within policy (free up to 24h before pickup).
- Cancel booking — refund logic per `/help/cancellation-policy`; show refund preview before confirm.
- Add extras / change protection tier post-booking (re-charges or asks for additional payment at counter).

### 8.6 Notifications

| Trigger | Channel(s) | Content |
| --- | --- | --- |
| Booking confirmed | Email + WhatsApp (if opted) | Booking ref, vehicle, dates, total, what to bring |
| Booking pending verification | Email | Reference, what to do next, contact info |
| Payment received (bank transfer / OMT) | Email + WhatsApp | Confirmation |
| 24h pre-pickup | WhatsApp + Email | Reminder, meeting point, contact |
| Pickup ready / car delivered | WhatsApp | Acknowledgement |
| Return reminder (1h before) | WhatsApp | Where to return |
| Post-rental review request | WhatsApp + Email | 1-tap rating link |
| Booking cancelled | Email | Refund summary |
| Failed sync (internal) | Slack / email to ops | Error details, booking ref |

### 8.7 Search engine optimisation

- SEO-friendly URLs (kebab-case, semantic). Query-driven sub-states are intentionally not in the sitemap.
- Per-page meta titles and descriptions, Open Graph tags.
- Structured data: `Organization` + `WebSite` (`SearchAction`) on `/`; `CarRental` (`LocalBusiness`) on `/locations`; `Service` on `/long-term`; `FAQPage` on `/help/*`.
- `sitemap.xml` auto-generated; `robots.txt` managed.
- Canonical URLs without query parameters (canonical for `/vehicles` is the bare URL).

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Metric | Target |
| --- | --- |
| Largest Contentful Paint (mobile, 4G) | < 2.5s — the landing LCP is the hero headline (text), so this is achievable |
| First Input Delay | < 100ms |
| Cumulative Layout Shift | < 0.1 |
| Time to Interactive (mobile, 4G) | < 4s |
| Booking-flow page transitions | < 800ms perceived |
| Lighthouse mobile (every public route) | Perf ≥ 90 · A11y ≥ 95 · SEO ≥ 95 |

### 9.2 Security

- HTTPS enforced site-wide (HSTS, redirect).
- PCI DSS-compliant card handling — payments tokenised via PSP (Areeba primary, Stripe fallback). **Never collect raw card PAN client-side.**
- CSRF protection on all state-changing endpoints.
- Rate limiting on auth and booking endpoints.
- Personal data encryption at rest.
- Logging of admin actions; no PII in client-side logs.

### 9.3 Accessibility

- **WCAG 2.1 AA** target.
- Keyboard-navigable booking flow (no mouse required).
- Focus rings visible: `2px ink-100 outline` + `4px ink-10 halo` on light; inverse on dark.
- Semantic HTML; skip-to-content link (rendered as a paper pill on ink-100 when focused).
- Image alt text on all vehicle and content images.
- Colour-contrast ratio ≥ 4.5:1 for body text, ≥ 3:1 for large text.
- Honour `prefers-reduced-motion`: framer-motion variants collapse to `duration: 0` via `useMotionGate()`.

### 9.4 Reliability

- Target uptime 99.9%.
- Graceful degradation if internal system is unreachable: show cached fleet, disable booking with a clear message + WhatsApp / phone fallback.
- Daily database backups; weekly restoration test.

### 9.5 Browser & device support

- Latest 2 versions of Chrome, Safari, Firefox, Edge.
- iOS Safari 15+, Chrome Android last 2 years.
- Mobile-first responsive design at 360, 768, 1024, 1440 breakpoints.

---

## 10. Technical Requirements

### 10.1 Stack (as built)

- **Framework:** Next.js 16 (App Router) on TypeScript strict.
- **Styling:** Tailwind v4 with `@theme` block in `styles/tokens.css`. Numeric spacing scale only (don't name `--spacing-{key}` keys — clobbers `max-w-{key}`).
- **Typography:** [`geist`](https://www.npmjs.com/package/geist) npm package via `next/font` re-exports (`GeistSans`, `GeistMono`). One typeface across the system.
- **Component primitives:** Radix UI (Popover, Dialog, Accordion, Tabs, etc.) restyled to INK & SIGNAL.
- **Icons:** Lucide. 24×24 grid, 1.5px stroke.
- **Forms:** React Hook Form + Zod for client-side validation. Inline validation on blur; submit scrolls to first error.
- **State:** React Server Components for content; client components only where interactivity is needed. Booking-draft model lives in `sessionStorage` (`wheels.booking.draft`).
- **API client:** thin fetch wrapper in `/lib/api/`, typed against `/types/domain.ts`.
- **Seed/fallback data:** typed fixtures under `/lib/api/mocks/fixtures/` support database seeding, tests, and explicit repository fallbacks. API traffic is not intercepted.
- **Hosting:** Vercel.
- **Payments (frontend integration):** Areeba primary; Stripe Elements as international fallback. Never raw PAN.
- **Analytics:** GA4 + Meta Pixel. Server-side Conversions API is backend's concern.
- **Error monitoring:** Sentry browser SDK.
- **Animation:** `framer-motion@^12`. Variants library in `lib/motion/variants.ts`. Honours `prefers-reduced-motion`.
- **Testing:** Vitest + React Testing Library for unit + component tests; Playwright (chromium project gates CI) for end-to-end.

### 10.2 Environments

- `development` → `staging` → `production` with sanitised data in non-prod.
- CI/CD pipeline (GitHub Actions). Preview deploys on every PR.

### 10.3 Observability

- Frontend error monitoring (Sentry).
- Synthetic monitoring on `/book/checkout` (every 5 min).
- Sync-failure alerting to Slack `#wheels-ops`.

### 10.4 Scope reminder — FRONTEND ONLY

This codebase is the **frontend** of the customer-facing web app. The backend (vehicle inventory, pricing engine, reservation persistence, internal CRM, WhatsApp Business API server, transactional email, PSP webhook handling, ops admin) lives in Wheels' internal management system and is **out of scope** here. The `/api/...` endpoints referenced in the implementation specs are the frontend's contract with the backend.

Browser API traffic goes through Next.js route handlers typed against `/types/domain.ts`. Wheels-owned booking operations delegate to the Laravel public API; website-owned content and account data use Supabase.

---

## 11. Edge Cases & Error States

| Scenario | User experience |
| --- | --- |
| No vehicles available for the selected dates | Empty state: "No cars match these filters." + suggested actions (Reset filters / Browse fleet) |
| Vehicle becomes unavailable while in funnel | Soft redirect to `/vehicles?step=1` with toast: "That car was just booked — here are similar options." |
| Internal management system unreachable | Disable booking; show banner: "Online booking is temporarily unavailable. Reach us on WhatsApp +961 …" Cached browse still works. |
| Card payment fails | Inline error on card form, suggest retry or switch to Cash / Bank transfer methods. |
| Bank transfer proof not uploaded after 24h | Auto-cancel booking with email + WhatsApp notice; re-book friendly link. |
| Underage driver | Block selection of restricted categories with explainer copy and link to `/help/rental-terms`. |
| Foreign licence with non-Latin characters | Allow free-text licence number; passport upload required at counter. |
| Promo code invalid / expired | Inline message; do not block continuing without promo. |
| Unknown route | Renders `/not-found` ("Wrong turn.") with red `Browse our fleet` CTA + suggested links. |
| Internal route error | Renders `/error` ("Something went wrong.") with red Try-again CTA; Sentry ref shown. |
| Maintenance mode | Renders `/maintenance` ("We'll be right back.") with WhatsApp escape link. HTTP 503 + Retry-After header. |

---

## 12. Acceptance Criteria (Phase 1)

- A user can complete a booking from landing page to confirmation in ≤ 90 seconds on a typical mobile connection.
- All bookings created on the website appear in the internal management system within 60 seconds.
- Cash, bank transfer, OMT, and card payment methods are all functional and produce valid Pending or Confirmed bookings as appropriate.
- Hazmieh hub pickup and Address Delivery (including to BEY) are selectable in the search bar and produce correct line items.
- Floating WhatsApp button is present on every page (except `/book/checkout`), opens correct number, and pre-fills a context-aware message.
- Confirmation screen and email contain booking ref, vehicle, dates, location, total, and meeting instructions.
- Manage Booking lookup with valid ref + email returns booking details and supports edit / cancel within policy.
- Lighthouse mobile scores: Perf ≥ 90, A11y ≥ 95, SEO ≥ 95 on `/`, `/vehicles`, `/book/checkout`.
- WCAG 2.1 AA pass on those routes (verified with axe-core).
- `prefers-reduced-motion` collapses all framer-motion animations to `duration: 0`.
- The **singular red CTA per screen** rule holds: only one `variant="cta"` Button (or red-styled element) per page.
- `/chauffeur` and `/corporate` return 404.
- `/vehicles/<slug>` and `/vehicles/<category>` return 404 (consolidated into `/vehicles?category=` and `/vehicles?selected=`).
- All Phase 1 pages defined in the sitemap (Section 4) are live, indexable, and pass schema-validator.

---

## 13. Out of Scope (Phase 2+)

- Native mobile applications (iOS / Android).
- Arabic and French localization (architecture is ready via `next-intl`; content is not in Phase 1).
- Loyalty program / Wheels Rewards.
- Marketplace integrations (Booking.com, Rentalcars, Expedia).
- Marketing automation platform (Klaviyo / HubSpot integration).
- Telematics / live vehicle tracking on the customer side.
- In-app digital licence / ID verification (Onfido or similar).
- Operations admin panel deep redesign.
- **Chauffeur** and **Corporate** flows — module specs retained for Phase 2 revival.

---

## 14. Appendix

### 14.1 Brand & design references

- **`/docs/Design/DESIGN.md`** — WHEELS / INK & SIGNAL design system (the source of truth for tokens, typography, components, do's and don'ts).
- **`/docs/Implementation/landingpage.md`** — landing-page spec (8 sections in order).
- **`/docs/Implementation/00_global.md`** — cross-cutting rules (header, footer, search bar, WhatsApp FAB, modals, accessibility, Lebanon-specific globals).
- **`/docs/Implementation/README.md`** — implementation library index.

### 14.2 Component library (as built)

| Component | Used on |
| --- | --- |
| `<Header />` (default / overlay / inverse variants) | All pages |
| `<Footer />` (Rivian wordmark pattern) | All pages |
| `<SearchBar />` (expanded + compact) | `/`, `/vehicles`, `/locations` (expanded); booking funnel (compact) |
| `<HeroSearchTabs />` | Landing hero |
| `<LocationPicker />` / `<DatePopover />` / `<TimePicker />` | SearchBar |
| `<VehicleCard />` (dark default + light variant) | `/vehicles`, Featured 4 Cars, long-term, locations |
| `<VehicleCardExpanded />` (inline car-selected panel) | `/vehicles?selected=<slug>` |
| `<FilterSidebar />` (inside a Sheet via the Filter chip) | `/vehicles` toolbar |
| `<CategoryWordmarkCard />` (Rivian pattern) | Landing — Categories section |
| `<InversePromoBlock />` | Landing — Hero promo |
| `<DestinationTile />` | Landing — Explore Lebanon |
| `<ReviewCard />` (monochrome stars) | Landing — Reviews |
| `<TierCardLongTerm />` | `/long-term` |
| `<ProtectionTierCard />` | `/book/protection` |
| `<AddOnRow />` | `/book/extras` |
| `<PaymentMethodSelector />` | `/book/checkout` |
| `<HoldTimer />` (warning-orange) | `/book/checkout` |
| `<FlowSummaryPanel />` (card-floating desktop; ink-100 mobile sticky bar) | All booking steps |
| `<ChannelCard />` | `/contact` |
| `<StatStrip />`, `<TeamCard />` | `/about` |
| `<BookingDetailPanel />` (card-floating) | `/account/bookings/[ref]`, `/manage-booking` |
| `<BookingHistoryRow />` | `/account/bookings` |
| `<BookingLookupForm />` | `/manage-booking` |
| `<AccountNav />` (sticky pill-rounded sidebar) | `/account/*` |
| `<AuthCard />` (paper, rounded-2xl, 48px padding) | `/login`, `/register`, `/forgot-password`, `/reset-password` |
| `<CookieBanner />` (ink-100 bar) | All pages, dismissible |
| `<NewsletterPopup />` (modal, red Subscribe CTA) | Fires 30s into `/` |
| `<WhatsAppFab />` (locked green, 56px) | All pages except `/book/checkout` |
| `<Stepper />` (5 steps, monochrome states) | Booking funnel |
| `<Reveal />` (motion wrapper for landing sections) | Non-hero landing sections |

### 14.3 Glossary

| Term | Definition |
| --- | --- |
| BEY | Beirut–Rafic Hariri International Airport (IATA). Served via Address Delivery (no permanent desk). |
| PDP | Product / Vehicle Detail Page. **Removed in Phase 1** — replaced by `VehicleCardExpanded`. |
| PSP | Payment Service Provider. |
| Pre-auth | Card pre-authorisation hold for security deposit. |
| OMT / Whish / Bob Finance | Lebanese cash-and-transfer networks used widely for in-country payments. |
| Pending booking | Reservation created but awaiting payment verification (cash / bank transfer / OMT). |
| Or similar | The actual delivered car may be a comparable model in the same category. |
| INK & SIGNAL | The WHEELS design system. Monochrome ink ramp + paper canvas + signal-red singular CTA + signal-blue informational. |
| Singular red CTA | The brand rule that allows at most one red `Button` per screen — the highest-conversion action only. |

### 14.4 References

- **Rivian** — rivian.com (monumental typography, monochrome confidence, dark-footer wordmark)
- **Tripadvisor** — tripadvisor.com (inverse marketing blocks, pill buttons, one saturated colour)
- **Sixt** — sixt.com (dark vehicle cards, inline car-selected pattern, spec chips, sticky summary)
- **Airbnb** — airbnb.com (clean overlays, generous voids, snap-scroll carousels)
- **Existing site** — wheelsrentacar.com.lb (data only, **not design reference**)

### 14.5 Document control

| Field | Value |
| --- | --- |
| Author | Stratagem Research — Marc Khamis |
| Reviewers (Wheels) | TBD |
| Reviewers (Stratagem Research) | TBD |
| Status | Released — Phase 1 |
| Next review | Pre-Phase-2 kickoff |

### 14.6 Versions

| Version | Date | Notes |
| --- | --- | --- |
| 1.0 | 2025-05-15 | Initial PRD (docx + pdf). 8 top-level pages including Chauffeur + Corporate. PDP route. Multi-branch model. |
| 2.0 | 2026-05-15 | INK & SIGNAL redesign. PDP removed. Single Hazmieh branch. Chauffeur + Corporate descoped. Unified `/vehicles`. Sitemap regenerated as `Wheels_Sitemap_v2.svg`. |
| **2.1 (Revision 2)** | 2026-05-17 | Hero cinematic photo. Chauffeur + Corporate restored. New `/trips`, `/trips/[slug]`, `/itineraries`, `/itineraries/[slug]`. New `/admin/*` CMS dashboard (staging-only). Sitemap regenerated to include the four new top-level surfaces. |
