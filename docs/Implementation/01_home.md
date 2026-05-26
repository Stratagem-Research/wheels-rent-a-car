# 01 — Home

> Route: `/`
> Depends on: `00_global.md` (page shell, header, search bar, footer, WhatsApp FAB)
> Related: PRD §6.1, sitemap node `Home`
> Primary persona: All three (tourist, local, business)

---

## Purpose & success criteria

The homepage exists to **start a booking within seconds**. Discovery content (categories, lifestyle modules, reviews, FAQ) is below the hero and serves users who didn't arrive with intent.

**Success looks like:**
- ≥ 65% of sessions interact with the search bar within 12s.
- The "Show cars" button is the single most-clicked element on the page.
- Mobile bounce rate < 35%.

---

## Page sections (top to bottom)

### 1. Promo strip (optional, dismissible)

- **Visibility:** only when an active campaign is running (admin-controlled).
- **Layout:** full-width strip above the header. Background `colors.primary-10`, white text, 40px tall.
- **Content:** short message + inline link. e.g. `Summer in Lebanon — 15% off on weekly rentals. Code SUMMER15 →`
- **Dismiss:** small × button on the right; remembers dismissal for 7 days in `localStorage`.

### 2. Hero with persistent search bar

The most important real estate on the site.

**Layout — desktop:**

```
┌──────────────────────────────────────────────────────────────┐
│  [Header sits transparently over the image until scroll]    │
│                                                              │
│   ╔══════════════════════════════════════════════════════╗   │
│   ║   DRIVE LEBANON, YOUR WAY                            ║   │
│   ║   Premium cars from $25/day · Free Beirut Airport    ║   │
│   ║   pickup · WhatsApp support 24/7                     ║   │
│   ║                                                      ║   │
│   ║   [ SEARCH BAR — see global section 4 ]              ║   │
│   ╚══════════════════════════════════════════════════════╝   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- **Background image:** full-bleed photograph, ~720px tall on desktop, ~520px on mobile. Editorial Lebanese setting (Raouché coast, Cedars road, Downtown Beirut, mountain switchbacks). Always shot in natural light. A subtle dark gradient overlay (top→bottom, 0% → 40% black) ensures headline contrast.
- **Copy block:** left-aligned on desktop (50% width), centered on mobile.
  - Headline: `display-2xl` (`64px`) on desktop, `display-lg` (`48px`) mobile. Color `colors.neutral-99`.
  - Subline: `body-lg`, color `colors.neutral-99` at 90% opacity. 480px max width.
- **Search bar:** full global persistent search bar (see `00_global.md` §4). Sits below the headline copy on desktop; full-width below copy on mobile.
- **Trust micro-strip** sits underneath the search bar inside the hero overlay:
  - Single horizontal row, white text at 14px:
    - `★ 4.8 on Google · 1,000+ rentals · Free BEY pickup · 24/7 WhatsApp`
  - Mobile: scrolls horizontally (overflow-x).

**Behavior:**
- Hero image preloads as the LCP element. WebP/AVIF, multiple sizes.
- On scroll past 60px, header switches from transparent to white.
- Search bar persists its values from `localStorage` (`wheels.lastSearch`).

### 3. Featured categories (6 cards)

A 6-up grid that lets discovery-mode users skip the search and dive into a category.

**Layout:**
- Section padding: `64px` top, `64px` bottom.
- Container: `container-max` (1280px) centered, page padding from §11 of global.
- Section heading: `headline-lg` "Find your category" (left-aligned, 24px below).
- Grid: 6 columns desktop, 3 columns tablet, 2 columns mobile. 24px gutter.

**Each category card:**
- Aspect ratio 4:3.
- White card, `rounded-lg`, `elevation-1`. Hover lifts to `elevation-2` and reveals a faint `colors.primary-95` background.
- Vehicle photo (or category illustration) bled to the corners on top half.
- Bottom half (white): category name (`title-lg`), one-line subtext ("from $25/day").
- Whole card is a link to `/vehicles/[category]`.
- No buttons inside.

**Categories (in order):** Economy · Compact · Sedan · SUV · Luxury · 7-Seater.

### 4. Why Wheels — 3-up value props

Three short statements the brand stands behind. Builds trust before the user hits another CTA.

**Layout:**
- 3 columns desktop, 1 column mobile. 24px gutter. 64px section vertical padding.
- Each item:
  - Icon at the top (40px, `colors.primary-40`, line style).
  - Headline (`title-lg`, neutral-10).
  - Paragraph (`body-md`, neutral-50). 2–3 lines.

**Content:**
1. **Free cancellation up to 24h** — Plans change. Cancel for free up to 24 hours before pickup. No questions, no fees.
2. **Free pickup at Beirut Airport** — Land, meet our agent at arrivals, drive away. No taxis, no detours.
3. **WhatsApp support, 24/7** — Real humans on the other end. Message us anytime.

### 5. Featured vehicles carousel

Six to ten cards, horizontally scrollable.

- Section heading: `headline-lg` "Popular this week" (left-aligned).
- Subheading: `body-md`, neutral-50: "What our guests are choosing this month."
- Card pattern: identical to the **vehicle card** in `02_fleet_browse.md` (consistency matters).
- Carousel controls: left/right chevrons on desktop (overlay on the edges, not below); free swipe on mobile.
- Each card → `/vehicles/[slug]` (the PDP).

### 6. "Explore Lebanon" — destination module

Editorial moment. Builds the touristic positioning.

**Layout:**
- 3-up cards on desktop, 1-up stacked on mobile.
- Each card: large photograph (16:10), title overlay at the bottom in white over a dark gradient.
- Cards: **The Cedars** · **Baalbek & the Beqaa** · **Tyre & the South**.
- Clicking a card → an editorial article (Phase 2 if no content; for Phase 1 link to `/vehicles/suv` or relevant fleet).
- Tertiary palette (`colors.tertiary-50`) is allowed here for accent text — the only place outside the booking flow where the olive sand tone appears.

### 7. Long-term + Corporate dual CTA strip

Two side-by-side cards with bold headlines and primary CTAs. Splits the page neatly between B2C and B2B audiences.

- Background: `colors.primary-10`. White text. 64px vertical padding.
- Two cards, equal width on desktop, stacked on mobile.
- Each card: `headline-md` headline, one-paragraph body, `button-secondary` (white outline on dark).
- Card 1 — **Long-term rental.** "Lower rates from one month up. Perfect for expats, families, and businesses." → `/long-term`
- Card 2 — **Corporate accounts.** "Volume pricing, single invoice, dedicated account manager." → `/corporate`

### 8. Reviews carousel

- Pulls live data from Trustpilot / Google Reviews API (cache 1h).
- Section heading: `headline-lg` "What our guests say" + Trustpilot logo.
- Card style: white, `rounded-lg`, 24px padding, `elevation-1`. Stars at top, review text middle, reviewer name + date bottom.
- Carousel: 3 cards visible desktop, 1 mobile. Free swipe on mobile.

### 9. FAQ — top 6 questions

Accordion. Quick answers without leaving the page.

- Section heading: `headline-lg` "Common questions".
- 6 accordion items. Each row: question (`title-md`, neutral-10), chevron icon. Open state reveals the answer (`body-md`, neutral-30) with 16px top padding.
- Below the accordion: text link "Read all FAQs →" → `/help/faq`.

**Default questions (Phase 1):**
1. What do I need to rent a car?
2. Do you offer airport pickup?
3. What payment methods do you accept?
4. Can I pay in cash?
5. Is insurance included?
6. What is your cancellation policy?

### 10. Footer

Global footer per `00_global.md` §5.

---

## Module-specific components

None unique to home — every component is consumed from the global pattern library or other modules. The homepage's job is to compose, not to introduce.

---

## States & edge cases

| Scenario                                  | Behavior                                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| First visit, no search history            | Search bar defaults: pickup = Beirut Airport (BEY); pickup date = today + 1 at 10:00; return = today + 4 at 10:00. |
| Returning visit, search in localStorage   | Pre-fill the search bar from `wheels.lastSearch` if < 7 days old. Show small chip "Pick up where you left off?" linking back to `/book/select-vehicle?...`. |
| In-progress booking saved                 | Above the hero, show a slim banner: "Continue your booking — Toyota Yaris, May 20–25 →" with a Resume button. |
| Promo applied via UTM (`?promo=SUMMER15`) | Auto-apply promo, surface a banner "Promo SUMMER15 applied — 15% off". Pre-fill into the search bar promo field. |
| User on a slow connection                 | Hero image lazy-falls back to a solid `colors.primary-20` background; search bar still renders instantly. |
| Reviews API down                          | Section hidden silently; do not break the layout. |

---

## Data requirements

- **Featured vehicles:** `GET /api/vehicles/featured` → list of 10 vehicles with image, name, category, from-price.
- **Reviews:** `GET /api/reviews?limit=10` → array of reviews from cached Trustpilot/Google.
- **Promo strip:** `GET /api/site-config` → returns active promo strip if any (admin-controlled).
- **Search criteria persistence:** read/write `localStorage` key `wheels.lastSearch`.

---

## SEO & metadata

- **Title:** "Wheels Rent A Car — Premium Car Rental in Lebanon · Free Airport Pickup"
- **Description:** "Rent a premium car in Lebanon. Free Beirut Airport pickup, 24/7 WhatsApp support, free cancellation. Book online in under 90 seconds."
- **OG image:** Wheels hero photograph, branded with logo top-left.
- **JSON-LD:** `Organization` + `WebSite` (with `SearchAction`).
- **H1:** the hero headline.

---

## Acceptance criteria

- [ ] Hero LCP < 2.0s on a Slow 4G throttled mobile profile.
- [ ] "Show cars" button is the singular red CTA on the page.
- [ ] All 10 sections render in the order listed; mobile stacking works at 360px.
- [ ] Returning visitor with `wheels.lastSearch` sees the search bar pre-filled.
- [ ] Featured vehicle carousel pulls from API and falls back gracefully if empty.
- [ ] Reviews module hides if API returns empty or errors.
- [ ] No CLS spike from hero image or carousel images.
- [ ] Page passes axe-core with zero serious or critical violations.
- [ ] All 6 default FAQ questions render and expand correctly via keyboard.
- [ ] WhatsApp FAB is visible and opens the generic message template.
