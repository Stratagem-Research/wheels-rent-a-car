# Wheels Rent A Car — Revision 1 Walkthrough

**A strategic alignment checkpoint, not a final demo.**
30 minutes · screen-share friendly · decisions over polish.

> This is the single document for the call. Open it on screen and walk top-to-bottom.

---

## What this call is

- A **direction-setting review** of everything we've done so far.
- A chance to **align on brand, structure, and priorities** before the next build iteration.
- The goal: leave with **decisions and owners**, not a finished product.

---

## How we got here

Before any pixel was designed, we did the homework.

### 1. Market & competitor research

We studied how the best rent-a-car operators in Europe, the US, and the region structure their sites and booking flows, so Wheels enters the market with a benchmark-grade experience.

Competitors and references studied in depth (screens archived in `docs/Research/`):

- **Sixt** — premium positioning, dark vehicle cards with inline "car selected" expansion, spec chips, sticky booking summary, full account + manage-booking flows.
- **Avis** — search-results layout, protection / add-on selection, checkout structure.
- **Alamo** — account dashboards and confirmation email patterns.
- **Kayak** — search bar UX (location picker, calendar, time selection).
- **Advance Rent a Car (regional)** — local Lebanese / regional flow, WhatsApp popup pattern, checkout localization.

For each, we captured: landing structure, search-bar UX, results page, "car selected" pattern, add-ons / protection step, checkout, confirmation, account, and any region-specific affordance (WhatsApp, cash payment, airport pickup).

### 2. Target users — who we are designing for

We mapped three primary personas. Every section of the site must visibly serve at least one of them.

| Persona | Profile | Top jobs | Why it matters |
| --- | --- | --- | --- |
| **Inbound Tourist** (primary) | International visitor, 28–55, arriving via BEY, 1–14 day rental | Find a car for airport pickup, understand insurance, pay confidently in USD | Drives the airport-pickup, insurance comparison, USD pricing, and English-first decisions |
| **Local Lebanese Renter** (primary) | Resident, 25–50, weekend trip, replacement, or longer-term need | Quick reservation, pay cash / local transfer, pickup from Hazmieh | Drives cash + bank-transfer + OMT payment paths and WhatsApp completion |
| **Business Traveler** (primary) | Executive or SME, multi-day rental, often longer term | Reliable car, on-time delivery, invoice-ready receipt | Drives long-term tiers, address delivery, and clean invoicing |

(Secondary persona — expat / returning diaspora — is treated as a sub-segment of the Inbound Tourist.)

### 3. Product Requirements Document (PRD v2.0)

The research and personas were translated into a single PRD that locks scope, features, and priorities for Phase 1. It defines:

- Business goals and **KPIs** (booking conversion ≥ 4.5%, drop-off ≤ 55%, mobile share ≥ 55%, Lighthouse ≥ 90, etc.).
- Full **information architecture and sitemap**.
- **Page-by-page UX** for every route.
- **Lebanon-specific features**: WhatsApp, cash, bank transfer, OMT/Whish, Hazmieh hub, address delivery (including BEY).
- **Functional and non-functional requirements** (performance, security, accessibility, browser support).
- **Acceptance criteria** for Phase 1 launch.

The PRD lives at `docs/PRD/Wheels_Rent_A_Car_PRD_v2.md`.

### 4. Sitemap — the full site, one page

We then drew the complete sitemap (`docs/PRD/Wheels_Sitemap_v2.svg`). This is the structural backbone — every public, authenticated, and utility route is on it.

We will walk through this together in the **Sitemap section** below.

### 5. Implementation specs — one per module

The PRD breaks down into 16 implementation-ready specs (in `docs/Implementation/`), one per module, so the build is structured, traceable, and not improvised:

`00_global` (cross-cutting rules) · `landingpage` (home) · `02_fleet_browse` · `04_booking_flow` · `05_locations` · `06_long_term` · `09_about` · `10_help_faq` · `11_contact` · `12_account` · `13_manage_booking` · `14_auth` · `15_legal_and_utility`. Chauffeur + Corporate specs (`07`, `08`) are retained for a future Phase 2 revival.

### 6. Design system — INK & SIGNAL

Before any page was built, we defined the visual language:

- **One typeface** — Geist (Sans + Mono).
- **Monochrome spine** — black (`ink-100`) is primary, white (`paper`) is the canvas.
- **Single red CTA per screen** — `signal-red` reserved for the highest-conversion action only.
- **Blue is informational only** — never a primary action.
- **Pill buttons everywhere**, no decorative shadows on cards, monumental typography as a layout device.
- Inspired by **Rivian** (premium typography), **Tripadvisor** (inverse marketing blocks), **Sixt** (dark vehicle cards).

### 7. Build plan — 11 phases

A canonical 11-phase plan (`docs/Plan/PLAN.md`) sequences the build, with each phase a single coherent commit on `main`. All 11 phases are shipped today.

---

## What we'll cover today (30 minutes)

| Time | Section | Outcome |
| --- | --- | --- |
| 0:00 – 2:00 | Frame the session | Shared understanding of what this call is |
| 2:00 – 6:00 | Visual reaction — homepage | Quick gut-check on the brand direction |
| 6:00 – 12:00 | Brand & design strategy | Approval to keep the direction as baseline |
| 12:00 – 18:00 | Sitemap walkthrough | Sign-off on structure & pages |
| 18:00 – 22:00 | Delivery status & roadmap | Clear picture of what's done vs. next |
| 22:00 – 28:00 | Open product questions + key decisions | Direction for the next iteration |
| 28:00 – 30:00 | Wrap-up & next steps | Owners, dates, scope for Revision 2 |

---

## 1. Homepage — visual direction

We'll look at the homepage hero and a couple of key sections.

The homepage follows an 8-section structure, in order:

1. **Hero** — paper canvas with a monumental headline and the search bar. No hero image — the headline is the hero.
2. **Hero promo** — inverse marketing block (Tripadvisor pattern), white pill CTA.
3. **Categories** — 4 Rivian-pattern cards (Sedan, SUV, Luxury, 7-Seater) with category names set huge behind the vehicle photos.
4. **Our Benefits** — Free pickup, free cancellation, WhatsApp 24/7, pay how you want.
5. **Featured 4 Cars** — full-bleed black band with 4 dark vehicle cards.
6. **Explore Lebanon** — editorial tiles (Cedars, Baalbek & Anjar, Tyre & Sidon).
7. **Long-term promo** — black band with "Drive longer. Save more.", white pill CTA.
8. **Reviews** — 3 tinted cards with monochrome stars.

**Questions for you:**

- Does this visual direction feel right for Wheels?
- Do the colors and tone feel premium enough — or too bold / too subtle?
- Anything in the look-and-feel that feels off-brand?

---

## 2. Brand & design strategy

The design system was built around three principles:

- **Premium and minimal** — restrained, confident, lifestyle-oriented.
- **Conversion-first** — every screen has a single dominant call-to-action (the red CTA rule).
- **Consistent hierarchy** — one typeface, one signal color, predictable rhythm across pages.

**Decision we need:**
- Are we approved to keep this direction as the **baseline** for all pages?

---

## 3. Sitemap walkthrough (`Wheels_Sitemap_v2.svg`)

We'll open the sitemap and walk through the full site, section by section.

**Top-level navigation:**
- Vehicles · Locations · Long-term · About · Help · Contact

**Public routes covered:**

- **Home** (`/`)
- **Vehicles** (`/vehicles`) — unified results page with inline "car selected" expansion (no separate detail page).
- **Booking flow** (`/book/extras` → `/book/protection` → `/book/checkout` → `/book/confirmation/[ref]`).
- **Locations** (`/locations`) — single Hazmieh hub.
- **Long-term** (`/long-term`) — monthly tier comparison + enquiry form.
- **About**, **Help** (+ FAQ / Terms / Insurance / Payment / Cancellation), **Contact**.
- **Manage Booking** (`/manage-booking`) — guest lookup by reference + email.
- **Auth** (`/login`, `/register`, `/forgot-password`, `/reset-password`).
- **Account area** (authenticated) — dashboard, bookings, profile, documents, saved vehicles.
- **Legal & utility** — Privacy, Terms, Cookies, 404, Error, Maintenance.

**Notable structural decisions in v2:**

- **No PDP** — the dedicated vehicle detail page is removed. Clicking a car expands inline on the results page (Sixt pattern).
- **Single Hazmieh hub** — multi-branch UI removed; address delivery covers anywhere in Greater Beirut, including BEY.
- **Chauffeur and Corporate descoped** — both routes return 404 in Phase 1; specs retained for Phase 2.
- **Unified `/vehicles`** — category filtering is `?category=`, car selection is `?selected=`, booking step 1 is `?step=1`.

**Decisions we need:**
- Is Sitemap v2 final for this phase?
- Any page to add, remove, or reorder before we continue?
- Any business-critical route we're missing?

---

## 4. Where we are on delivery

The build follows an 11-phase plan (`docs/Plan/PLAN.md`). **All 11 phases are shipped today.**

| Phase | Title | Status |
| --- | --- | --- |
| 1 | Foundation cleanup (Hazmieh-only, real photos, descopes) | Shipped |
| 2 | Search-bar primitives (date / time / location pickers) | Shipped |
| 3 | Typography & token system (INK & SIGNAL) | Shipped |
| 4 | Primitives overhaul (Button, Card, Input, Modal, etc.) | Shipped |
| 5 | New SearchBar (paper canvas, no hero image) | Shipped |
| 6 | Landing page rebuild (8-section structure) | Shipped |
| 7 | Unified `/vehicles` + inline car-selected (PDP removed) | Shipped |
| 8 | Booking funnel restyle (5 steps) | Shipped |
| 9 | Long-term, About, Help, Contact, Manage Booking restyle | Shipped |
| 10 | Locations + Account + Auth restyle | Shipped |
| 11 | Legal pages + motion layer + final polish + tests | Shipped |

This is a **strong first foundation** — clean, structured, and built on real research. The next iteration will build on the decisions made today, which is why getting alignment now matters: it avoids rework later.

---

## 5. Open product questions

These are the open scope and product questions where we need your direction. They map directly to what changes in the next build iteration.

### 5.1 Blog / Trips section

**Question:** Do you want a blog section for trips that advises people on where to go in Lebanon (and which car suits each trip)?

**If YES:**
- New `/trips` listing page + `/trips/[slug]` article template.
- A CMS surface in the back office for writing posts.
- Significant SEO upside (organic traffic from "car rental Lebanon Cedars", "Baalbek day trip from Beirut", etc.).

### 5.2 Corporate packages

**Question:** Do you have corporate packages and business special prices we need to advertise?

**If YES:**
- Re-enable `/corporate` (currently 404). Hero + value props + how-it-works + contact-sales form.
- Pricing can be opaque ("Get a quote") or transparent (tier comparison) — your call.

### 5.3 Airport pickup as a chauffeur option

**Question:** Do you operate a chauffeur service that picks people up from Beirut Airport (BEY)?

**What we have today:**
- **Airport meet-and-greet** as a self-drive option (customer collects keys at BEY arrivals).
- A `/chauffeur` page concept with three formats (airport transfer / day trip / hourly) — currently descoped.

**If YES** for chauffeur airport transfer: it becomes a real bookable / quotable flow, with flight-number capture and ops alignment.

### 5.4 Pickup / drop-off locations

**Question:** Where can customers actually pick up and drop off cars?

**What we have today:**
- **Wheels Hazmieh** — physical branch, free pickup at the hub.
- **Beirut Airport (BEY)** — meet-and-greet at arrivals, dispatched on demand from Hazmieh.
- **Address Delivery** — anywhere in Greater Beirut, zone-based fee.

**Please confirm:**
1. Is the airport meet-and-greet available 24/7, or limited hours?
2. Any other physical branches we should add (Jounieh, Tripoli, Tyre)?
3. Address-delivery fee model — flat fee, zone-based, or free over a certain rental length? Real numbers needed.

### 5.5 Long-term rentals — bookable or quotable?

**Question:** Do you want long-term rentals to be quote-only (current behavior) or directly bookable for some tiers?

**What we have today:**
- `/long-term` page with tier comparison (1 / 3 / 6 / 12 months).
- Enquiry form at the bottom — we follow up with a tailored quote.
- No direct "buy now" path.

**Please confirm:**
1. Stay quote-only? Or expose direct booking for the 1-month tier?
2. Realistic SLA on follow-up — 24h business days? Same-day?
3. Are the tier prices on the site (`$15–$22 / day` range) directionally correct, or placeholders?

### 5.6 Cross-cutting items

Quick confirms we need in the same conversation or by email:

- **Currency** — site is USD-only; LBP shown only on confirmation. OK?
- **Payment methods** — Card (Areeba), Cash, Bank Transfer, OMT / Whish. Anything missing (Western Union, Bob Finance, crypto)?
- **Minimum driver age** — currently 21. Confirm? Category bumps (e.g., 25 for luxury / 4x4)?
- **Insurance tiers** — Basic / Smart (popular) / Premium. Need real deductibles + coverage lines from your insurer.
- **Phone hours** — +961 1 629 100 in the footer. Actual hours? 24/7 or 09:00–20:00?

---

## 6. Critical decisions we need from you

These are the questions that unlock the next iteration. Same wording we'll use in the recap email.

1. **Brand direction** — approved as baseline? (Yes / No + notes)
2. **Sitemap v2** — approved for this phase? (Yes / No + edits)
3. **Primary conversion goal** — which is #1 we optimize for?
   - Book now
   - WhatsApp lead
   - Long-term inquiry
4. **Backend APIs** — when can we receive staging APIs, and which endpoints first?
   - Availability / search
   - Quote / pricing
   - Booking submit
   - Auth + manage-booking
5. **Payment integration** — when can we receive Areeba credentials (and is Stripe still the international fallback)?
6. **Content ownership** — who provides and signs off on final copy (About, FAQs, legal text)?
7. **Final approver** — single decision-maker for design and content, and typical turnaround?
8. **Operational SLA** — for cash / bank-transfer / OMT pending bookings, what's the verification timeframe?
9. **Launch criteria** — exact conditions that define launch readiness (must-have features, test environments, acceptance owner).

---

## 7. Decision log (we capture this live, send same day)

- Brand direction approved: [ Yes / No / Notes ]
- Sitemap v2 approved: [ Yes / No / Changes ]
- Primary conversion goal: [ ]
- Backend staging API date: [ ]
- Payment credentials date: [ ]
- Content owner + sign-off date: [ ]
- Final approver + typical turnaround: [ ]
- Open product items (blog, corporate, chauffeur airport, locations, long-term flow): [ Per-item decisions ]

---

## 8. What happens after this call

- **Same day** — we send a 1-page recap with:
  - Decisions made
  - Open questions still outstanding
  - Owners per item
  - Target dates
  - Scope for Revision 2
- **Next iteration** — we update the PRD, the sitemap (if needed), and the implementation specs based on what was decided, then build.

---

## 9. Anything else you want to raise

Open floor — any concerns, priorities, or questions we haven't covered?

---

## Appendix — Revision 1 outcomes (decisions captured on the call)

The May 17, 2026 walkthrough resulted in the following approvals and product decisions. These shipped together as **Phase 12 (Revision 2)** — see `docs/Plan/PLAN.md`.

1. **Brand direction** — approved as the baseline. INK & SIGNAL stays.
2. **Hero treatment** — replace the grey/paper canvas behind "Drive Lebanon, your way." with a **full-bleed cinematic Lebanon photograph** + dark gradient overlay. Headline + chips repaint to paper. Search bar stays card-floating.
3. **Sitemap additions** approved:
   - Restore **`/corporate`** (un-descope). Add corporate value props + 3-tier comparison + enquiry form.
   - Add **`/trips`** and **`/trips/[slug]`** as the self-drive blog. Homepage Explore Lebanon converts to a horizontal carousel linking to `/trips` for the full listing.
   - Add **`/itineraries`** and **`/itineraries/[slug]`** for chauffeur-led tours. `/chauffeur` Sample Itineraries section becomes a horizontal carousel with "See all itineraries →" routing here.
4. **Admin dashboard** — build a staging-only `/admin` with hardcoded `admin / admin123`. Full CMS scope: trips, itineraries, FAQs (sections + questions), corporate tier content. Persisted to localStorage; drop-in replaceable with real backend.
5. **Photography** — placeholders in code; client supplies final cinematic Lebanon photos before launch.

**What stayed locked from earlier phases:**
- Single Hazmieh hub.
- No PDP — inline car-selected expansion on `/vehicles`.
- USD-only pricing; LBP on confirmation.
- WhatsApp + Cash + Bank Transfer + OMT/Whish as payment methods.
- Single red CTA per screen rule.

**Still open after the call:**
- Final corporate package real numbers (placeholder pricing shipped).
- Real Lebanon photography (placeholders in place).
- Backend staging API date.
- Payment integration timeline (Areeba credentials + Stripe fallback decision).
- Real auth + persistence to replace the admin demo-grade layer before production.
