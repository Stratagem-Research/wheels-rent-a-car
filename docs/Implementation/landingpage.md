# LANDING PAGE — `/`

> Route: `/`
> Replaces: the old `01_home.md` (Mediterranean Modern direction)
> Design system: `/docs/Design/DESIGN.md` — **WHEELS / INK & SIGNAL**
> Reference layout: `/docs/Design/Landing Page.png` (annotated section sketch)
> Depends on: `00_global.md` (page shell, header, footer, WhatsApp FAB, search bar)
> Primary persona: All three (tourist, local, business)

---

## Mission of this page

Convert in seconds. Sell the brand in seconds more.

The landing page is the **first impression of WHEELS** and the **fastest path into the booking flow**. It must feel **bold, sleek, daring, modern** — closer to a flagship product page (Rivian) than a travel marketplace. Cars are the heroes. Type does the talking. Colour is rare.

**Hard rules carried over from the design system:**

- **Geist Extra Bold UPPERCASE** for every headline.
- **One red CTA on this page.** It's the search bar's `SHOW CARS` button.
- **No shadows on regular cards.** Use `card-tint`, `card-inverse`, or border to define edges.
- **Pill buttons everywhere.** Black on light, white on dark, red for the singular CTA.
- **Generous voids** — desktop section rhythm is `128px`. Don't fill the silence.
- **Massive type as a layout device** — the Categories section uses category names as wordmarks at `display-mega` scale.
- **Inverse blocks (black surface, white type)** are first-class signatures of the page.

---

## Section order (top to bottom)

| # | Section            | Surface              | Density          |
| - | ------------------ | -------------------- | ---------------- |
| 1 | Hero               | Paper + dark promo   | Low              |
| 2 | Categories         | Paper                | Low (massive)    |
| 3 | Our Benefits       | `ink-10` tinted      | Medium           |
| 4 | Featured 4 Cars    | `ink-100` inverse    | Medium           |
| 5 | Explore Lebanon    | Paper                | Low (editorial)  |
| 6 | Renting Long Term  | Inverse with accent  | Low (focused)    |
| 7 | Reviews            | Paper                | Medium           |
| 8 | Footer             | `ink-100` inverse    | Dense            |

---

## 1. HERO

The page opens with a **two-part hero**: a confident headline + persistent search bar on a paper canvas (top), and an **inverse promo strip** docked to the bottom of the viewport (bottom). Together they form the hero block.

### 1.1 Headline + search

**Layout — desktop**

```
┌────────────────── HEADER (transparent over white, sticky) ───────────────┐
└──────────────────────────────────────────────────────────────────────────┘

      ┌─────────────────────────────────────────────────────────┐
      │                                                         │
      │  DRIVE LEBANON,                                         │  display-2xl, ink-100
      │  YOUR WAY.                                              │
      │                                                         │
      │  Premium cars from $25 a day. Free Beirut Airport       │  lead-lg, ink-60
      │  pickup. WhatsApp support, 24/7.                        │
      │                                                         │
      └─────────────────────────────────────────────────────────┘

   [ TAB ROW — Cars · Long-term · Chauffeur · Airport transfer ]   chips, pill
   ┌─────────────────────────────────────────────────────────────────┐
   │  📍 Beirut Airport ▾    📅 May 20, 10:00 → May 25, 10:00 ▾      │   card-floating
   │  ☐ Different return location          [   SHOW CARS   →   ]    │   button-cta (RED)
   └─────────────────────────────────────────────────────────────────┘

```

**Specifics**

- **Surface:** `paper` (`#FFFFFF`) — the brand's light canvas. No hero photograph behind the headline. The headline IS the hero.
- **Container:** `container-default` (1280px), centered. Page padding `48px` desktop / `20px` mobile.
- **Vertical rhythm:** `96px` top padding on desktop (below header), `48px` mobile.
- **Headline (`display-2xl`):** "DRIVE LEBANON, / YOUR WAY." — set on two lines, hard line-break after the comma. Geist 800, uppercase, `letterSpacing: -0.035em`. Color `ink-100`.
- **Lead (`lead-lg`):** sub-headline below the headline, max width 540px, color `ink-60`. Two short sentences max.
- **Spacing between headline and search bar:** `48px` desktop, `32px` mobile.

**Tab row above the search bar (Sixt pattern)**

A horizontal row of pill chips immediately above the search card:

| Chip                | State (default) | Behavior                                    |
| ------------------- | --------------- | ------------------------------------------- |
| `CARS`              | `chip-selected` | Default tab — drives the search bar fields  |
| `LONG-TERM`         | `chip`          | Replaces the search bar with monthly tier picker → routes to `/long-term` |
| `CHAUFFEUR`         | `chip`          | Replaces the search bar with the chauffeur enquiry mini-form → routes to `/chauffeur` |
| `AIRPORT TRANSFER`  | `chip`          | Pre-fills pickup = BEY, sets return same day, optionally with driver toggle |

- Chips: pill, 36px tall. Selected state inverts to `ink-100` background, paper text. Use `chip` and `chip-selected` tokens.
- Gap between chips: `8px`.

**Search bar card**

- Uses the `card-floating` token (the rare card with a shadow — `elevation-2`).
- Surface `paper`, `rounded.2xl` (24px), 24px internal padding, no border.
- Internal layout per `00_global.md` §4 — pickup location dropdown + dates/times + return-location toggle + promo code (collapsible) + `SHOW CARS` CTA.
- The `SHOW CARS` button is the **singular `button-cta` (RED) on the entire page**. 56px tall.

**Behavior**

- Search bar pre-fills from `localStorage` `wheels.lastSearch` if present (< 7 days old).
- Tab change updates the search-bar fields contextually (keeps dates if compatible).
- Submitting routes to `/book/select-vehicle?...`.

### 1.2 Inverse promo strip (Tripadvisor pattern)

Directly below the search bar, an **inverse marketing block** sits inside the hero region — it's the first thing users see when they scroll one screen.

**Layout — desktop**

```
   ┌─────────────────────────────────────────────────────────────────┐
   │ [eyebrow: TRAVELERS' CHOICE]                                    │  overline, ink-40 (on dark)
   │                                                                  │
   │ THE CARS YOU                          ┌───────────────────────┐ │
   │ TRUST AT BEY.                         │  [Lebanese landscape  │ │   display-lg, paper
   │                                       │   photo with editorial│ │
   │ Free pickup. 90-min flight grace.     │   crop, full bleed]   │ │   lead-md, ink-30
   │ Brand-new fleet. WhatsApp support.    │                       │ │
   │                                       │                       │ │
   │ [    BROWSE FLEET    →    ]           │                       │ │   button-primary-inverse (WHITE pill)
   └───────────────────────────────────────────────────────────────┘
```

**Specifics**

- Container `container-default`, full width.
- Surface `card-inverse` (`ink-100`), `rounded.xl` (20px), 64px internal padding desktop / 32px mobile.
- Two columns desktop (60/40 split — copy left, image right). Stacks 1-up on mobile.
- Eyebrow: `overline` token in `ink-40`. Sets up the headline.
- Headline: `display-lg`, paper. Two lines, tight tracking.
- Sub-text: `lead-md`, `ink-30`. Max 360px width.
- CTA: `button-primary-inverse` (WHITE pill, black text). NOT red — red is reserved for the search bar's SHOW CARS.
- Image: Lebanese vehicle/scene shot in natural light, full-bleed inside the right column with rounded corners matching the card.

**Behavior**

- The strip is content-driven (admin-controlled). Phase 1 default copy as above. Phase 2: A/B test slot.
- On mobile, image stacks above copy with reduced height (220px).

---

## 2. CATEGORIES (the daring section)

The signature moment of the landing page. Inspired by Rivian's R1S/R1T product cards — **the vehicle photographed in profile with the category name set MASSIVE behind it**.

**Layout — desktop**

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [eyebrow: PICK YOUR CATEGORY]                                           │
│  CHOOSE YOUR DRIVE.                                                      │  display-xl, ink-100
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┬─────────────────────────────────────┐
│                                 │                                     │
│                                 │                                     │
│   SUV                           │   SEDAN                             │   ← display-mega behind/over
│                                 │                                     │     (ink-95 on near-white card)
│   ┌──────────────────────┐      │   ┌──────────────────────┐          │
│   │  [SUV photo, side]   │      │   │  [Sedan photo, side] │          │
│   └──────────────────────┘      │   └──────────────────────┘          │
│                                 │                                     │
│   All-rounder. Built for        │   Premium comfort. Built for        │   lead-md, ink-60
│   anywhere you call a road.     │   the everyday and the special.     │
│                                 │                                     │
│   From $48 / day                │   From $32 / day                    │   price-sm, ink-95
│                                 │                                     │
│   [   EXPLORE   ]   [   BOOK   ]│   [   EXPLORE   ]   [   BOOK   ]    │   secondary + primary pills
└─────────────────────────────────┴─────────────────────────────────────┘

┌─────────────────────────────────┬─────────────────────────────────────┐
│   LUXURY                        │   7-SEATER                          │   (second row, same pattern)
│   ...                           │   ...                               │
└─────────────────────────────────┴─────────────────────────────────────┘
```

**Specifics**

- Container `container-wide` (1440px) for this section — the category cards earn the room.
- Section eyebrow `overline` + headline `display-xl` `ink-100`.
- Card grid: **2 columns desktop**, 1-up mobile. 24px gutter.
- Phase 1 ships **4 categories** (Sedan, SUV, Luxury, 7-Seater) — two rows of two.
- **Each category card:**
  - Surface `card-tint` (`ink-10`) — quiet near-white, no border, no shadow.
  - `rounded.xl` (20px), 48px internal padding desktop / 32px mobile.
  - Min-height 480px desktop so the wordmark has room to breathe.
  - **Category wordmark:** the category name set in `display-mega` (Geist 800, 144px, uppercase, `letterSpacing: -0.04em`) behind/above the vehicle. Color `ink-95` at full opacity. Position: top-left of the card, anchored against the image — the photo overlaps the wordmark visually (Rivian pattern).
  - **Vehicle image:** profile shot, side view, transparent or context-cut background. 70–80% of the card width. Sits in the visual midground.
  - **Lead copy:** `lead-md`, `ink-60`, 2 short lines under the image.
  - **Price line:** `price-sm`, `ink-95`. "From $X / day".
  - **CTA pair:** `button-secondary` "EXPLORE" (links to `/vehicles/[category]`) + `button-primary` "BOOK" (links to `/book?category=[slug]` pre-filled).
- Hover: card lightly lifts to `elevation-1`; vehicle image scales to 1.03 (300ms ease).

**Mobile adaptation**

- 1 card per row.
- Wordmark scales down to `display-2xl` (112px) so it still feels monumental but doesn't break the card.
- Vehicle image lives below the wordmark instead of overlapping (tight overlap doesn't hold on small screens).

**Behavior**

- Whole card is clickable → `/vehicles/[category]`. The two pill buttons inside are explicit secondary affordances; they don't break the card link.

---

## 3. OUR BENEFITS

A 4-up benefit grid that builds trust before the next CTA push. Inspired by the Airbnb "flexibility" module — a tinted band with image-led cards.

**Layout — desktop**

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [eyebrow: WHY WHEELS]                                                   │
│  THE BASICS, COVERED.                                                    │  display-md, ink-100
│                                                                          │
│  No surprises. No fine print. Drive with the operator that picks         │  lead-lg, ink-60
│  you up at the airport and stays in WhatsApp range the whole trip.       │
└──────────────────────────────────────────────────────────────────────────┘

┌────────────────┬────────────────┬────────────────┬────────────────┐
│  [icon]        │  [icon]        │  [icon]        │  [icon]        │
│                │                │                │                │
│  FREE BEY      │  FREE          │  WHATSAPP      │  PAY HOW       │   headline-sm
│  PICKUP.       │  CANCELLATION  │  24/7.         │  YOU WANT.     │
│                │  UP TO 24H.    │                │                │
│                │                │                │                │
│  Meet our      │  Plans change. │  Real humans.  │  Card, cash,   │   body-md, ink-60
│  agent at      │  Cancel free   │  No bots, no   │  bank transfer │
│  arrivals.     │  up to 24h     │  hold music.   │  or OMT/Whish. │
│  Drive in 15   │  before pickup.│  Reach us in   │  Whatever's    │
│  minutes.      │                │  one tap.      │  easiest.      │
│                │                │                │                │
└────────────────┴────────────────┴────────────────┴────────────────┘
```

**Specifics**

- **Section background:** `surface-subtle` (`ink-10`) full-bleed band. `128px` vertical padding desktop / `64px` mobile.
- Container `container-default` centered inside the band.
- Section heading + lead at the top, 48px below before the grid.
- **Grid:** 4 columns desktop, 2 columns tablet, 1 column mobile. `24px` gutter.
- **Each benefit card:**
  - Uses the `card` token but on this tinted band, drops the border (the band's tint defines the edges naturally).
  - Surface `paper`, `rounded.xl` (20px), 32px padding.
  - Icon at the top: 32px, `ink-100`, Lucide line style.
  - Headline `headline-sm` (Geist 800 uppercase). 2 lines max.
  - Body `body-md`, `ink-60`. 3-4 short lines.
- **No shadow** — cards sit on the band as flat surfaces.
- Hover: subtle lift to `elevation-1` (the only motion).

**The 4 benefits (in order)**

1. **FREE BEY PICKUP** — `airplane` icon. "Meet our agent at arrivals. Drive in 15 minutes."
2. **FREE CANCELLATION UP TO 7 DAYS** — `calendar-x` icon. "Plans change. Cancel free up to 7 days before pickup."
3. **WHATSAPP 24/7** — `message-circle` icon. "Real humans. No bots, no hold music. Reach us in one tap."
4. **PAY HOW YOU WANT** — `wallet` icon. "Card, cash, bank transfer or OMT/Whish. Whatever's easiest."

**Mobile adaptation**

- Grid stacks 1-up.
- Cards keep 32px padding.
- Section vertical padding drops to 64px.

---

## 4. FEATURED 4 CARS

Sixt-style **dark inverse module** showing the four cars to book this week. The page's first dark-on-dark moment after the hero promo.

**Layout — desktop**

```
┌──────────────────────────────────────────────────────────────────────────┐  full-bleed inverse
│                                                                          │  surface ink-100
│  [eyebrow: POPULAR THIS WEEK]                                            │  paper text
│  THE FOUR YOU SHOULD BOOK.                                               │  display-lg, paper
│                                                                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐             │
│  │ [vehicle] │  │ [vehicle] │  │ [vehicle] │  │ [vehicle] │             │   vehicle-card
│  │           │  │           │  │           │  │           │             │   (dark, default)
│  │ TOYOTA    │  │ NISSAN    │  │ MERCEDES  │  │ BMW       │             │
│  │ COROLLA   │  │ SENTRA    │  │ E-CLASS   │  │ X3        │             │
│  │ or similar│  │ or similar│  │ or similar│  │ or similar│             │
│  │           │  │           │  │           │  │           │             │
│  │ [5][AUTO] │  │ [5][AUTO] │  │ [5][AUTO] │  │ [5][AUTO] │             │
│  │ [PETROL]  │  │ [PETROL]  │  │ [HYBRID]  │  │ [DIESEL]  │             │
│  │           │  │           │  │           │  │           │             │
│  │ $32/DAY   │  │ $35/DAY   │  │ $95/DAY   │  │ $110/DAY  │             │
│  │           │  │           │  │           │  │           │             │
│  │ [SELECT→] │  │ [SELECT→] │  │ [SELECT→] │  │ [SELECT→] │             │   button-primary-inverse
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘             │
│                                                                          │
│  [  VIEW THE FULL FLEET  →  ]                                           │   button-secondary-inverse
└──────────────────────────────────────────────────────────────────────────┘
```

**Specifics**

- **Section surface:** `card-inverse` style, full-bleed (no rounding) — the band runs edge-to-edge so it reads as a chapter break.
- `128px` vertical padding desktop / `64px` mobile.
- Container `container-wide` for the 4-card row.
- Section heading + eyebrow at top. Heading is `display-lg`, paper.
- **Grid:** 4 columns desktop, 2 columns tablet, 1.2 columns mobile (with peek and snap-scroll).
- **Each card:** the standard `vehicle-card` (DARK by default), but on this dark band the card surface lifts slightly to `ink-90` so it reads as separate from the section. Image bleeds top, content footer 24px padding.
- **CTA inside each card:** `button-primary-inverse` "SELECT →" (white pill with black text). Routes directly to `/book/select-vehicle?vehicleId=`.
- Below the grid, centered: `button-secondary-inverse` "VIEW THE FULL FLEET →" → `/vehicles`.

**Mobile adaptation**

- Cards become a horizontal snap-scroll carousel showing 1.2 cards (the next card peeks).
- Section heading and eyebrow stack normally above.
- "VIEW THE FULL FLEET" CTA stays centered below.

**Behavior**

- Cards pull from `GET /api/vehicles/featured?limit=4`. Cached 5 min.
- If fewer than 4 are returned, fill from "popular" backfill.

---

## 5. EXPLORE LEBANON

Editorial moment. Inspires the touristic positioning. The page's most photo-driven section.

**Layout — desktop**

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [eyebrow: BUILT FOR THE COUNTRY]                                        │
│  EXPLORE LEBANON.                                                        │  display-xl, ink-100
│                                                                          │
│  Three ways to spend a long weekend with the keys in your hand.          │  lead-lg, ink-60
└──────────────────────────────────────────────────────────────────────────┘

┌────────────────────┬────────────────────┬────────────────────┐
│                    │                    │                    │
│ [Cedars photo]     │ [Baalbek photo]    │ [Tyre photo]       │   image-led tile
│ full bleed         │ full bleed         │ full bleed         │
│                    │                    │                    │
│                    │                    │                    │
│ THE CEDARS         │ BAALBEK & ANJAR    │ TYRE & SIDON       │   headline-md, paper
│                    │                    │                    │   over scrim
│ 8h · SUV           │ 9h · Sedan         │ 8h · Sedan         │   label-md, ink-30
│ recommended        │ recommended        │ recommended        │
│                    │                    │                    │
│ [PLAN THIS DRIVE→] │ [PLAN THIS DRIVE→] │ [PLAN THIS DRIVE→] │   button-tertiary-inverse
└────────────────────┴────────────────────┴────────────────────┘
```

**Specifics**

- Container `container-default`. `128px` section padding.
- Heading + lead at the top, 48px below before the grid.
- **Grid:** 3 columns desktop, 1.2 mobile (carousel snap). 24px gutter.
- **Each tile:**
  - `card-image` token. Surface `ink-95`, `rounded.xl` (20px), 0 padding, 4:5 aspect ratio.
  - Full-bleed Lebanese destination photograph fills the card.
  - **Bottom-anchored content** sits over a vertical gradient scrim (`rgba(0,0,0,0)` to `rgba(0,0,0,0.7)`).
  - Inside the scrim area, 24px padding:
    - Headline `headline-md`, paper, uppercase.
    - Meta line `label-md`, `ink-30` ("8h · SUV recommended").
    - CTA `button-tertiary-inverse` "PLAN THIS DRIVE →" (text-only, paper) — links to a curated category + pre-filled booking.
- No shadow. No border.
- Hover: image scales 1.03 (300ms); scrim deepens slightly.

**Mobile adaptation**

- Snap-scroll carousel, 1.2 cards visible (next card peeks 20%).
- Section heading and lead stack normally above.

**Behavior**

- Phase 1 ships 3 hardcoded destinations (CMS-driven from week 1 if backend ready).
- Each "PLAN THIS DRIVE" links to a destination-specific landing (Phase 2) or, in Phase 1, to `/vehicles/[recommended-category]?destination=cedars` etc.

---

## 6. RENTING LONG TERM

A focused inverse promo block selling the long-term offer. Inspired by the Airbnb "Get full flexibility" module — bold colour block with a phone screenshot showing the feature.

**Layout — desktop**

```
┌──────────────────────────────────────────────────────────────────────────┐  full-bleed
│  surface ink-100, paper text                                            │
│                                                                          │
│  ┌────────────────────────────────┬──────────────────────────────────┐  │
│  │ [eyebrow: ONE MONTH +]         │                                  │  │
│  │                                │  ┌──────────────┐                │  │
│  │ DRIVE LONGER.                  │  │              │                │  │
│  │ SAVE MORE.                     │  │  [iPhone     │                │  │
│  │                                │  │  mockup of   │                │  │
│  │ Monthly and multi-month plans  │  │  long-term   │                │  │
│  │ from $XX/day. Insurance,       │  │  flow]       │                │  │
│  │ maintenance, and door delivery │  │              │                │  │
│  │ included.                      │  │              │                │  │
│  │                                │  │              │                │  │
│  │ [   GET A QUOTE   →   ]        │  └──────────────┘                │  │
│  │                                │                                  │  │
│  └────────────────────────────────┴──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Specifics**

- **Section surface:** `ink-100` full-bleed band. `128px` vertical padding desktop / `64px` mobile.
- Container `container-default` centered inside the band.
- **Two columns desktop** (50/50), stacks 1-up on mobile (copy first).
- Left column (copy):
  - Eyebrow `overline`, `ink-40`.
  - Headline `display-xl`, paper, 2 lines.
  - Lead `lead-lg`, `ink-30`, 2-3 short sentences.
  - CTA `button-primary-inverse` "GET A QUOTE →" — links to `/long-term`. Big (size xl, 64px tall) — this is the only large white pill on the page.
- Right column (image):
  - iPhone mockup of the long-term flow. PNG with transparent background. Lit from above, framed against the dark surface for contrast.
  - On mobile, image stacks below the copy and centers, max-width 320px.

**No `signal-red`** in this section — even though it's a strong CTA. Red is reserved for the search bar's `SHOW CARS`. The white pill on black is bold enough.

---

## 7. REVIEWS

Trust strip. Pulled live from Trustpilot/Google.

**Layout — desktop**

```
┌──────────────────────────────────────────────────────────────────────────┐
│  [eyebrow: 4.8 ON GOOGLE · 1,200+ REVIEWS]                               │
│  TRUSTED BY THE PEOPLE WE DRIVE.                                         │  display-md, ink-100
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ ★★★★★        │  │ ★★★★★        │  │ ★★★★★        │   stars in ink-100, full
│              │  │              │  │              │
│ "Smooth      │  │ "Great cars, │  │ "Great team. │   body-md, ink-95
│  pickup at   │  │  even better │  │  Will rent   │
│  BEY. Brand  │  │  service.    │  │  again next  │
│  new car."   │  │  WhatsApp    │  │  visit."     │
│              │  │  was..."     │  │              │
│              │  │              │  │              │
│ — JANE D.    │  │ — KARIM A.   │  │ — MARIE L.   │   label-md, ink-50
│   May 2026   │  │   Apr 2026   │  │   Apr 2026   │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Specifics**

- Container `container-default`. `128px` section padding.
- Section heading and eyebrow at top.
- **Grid:** 3 cards desktop, 1.2 cards mobile (snap-scroll).
- **Each card:**
  - `card-tint` (`ink-10` surface), `rounded.xl` (20px), 24px padding. **No border, no shadow.**
  - Stars at the top (5 filled `star` icons, 16px, `ink-100` — NOT yellow). Star colour stays monochrome on purpose.
  - Body text `body-md`, `ink-95`, max 4 lines (truncate with ellipsis if longer).
  - Reviewer line at the bottom: name in `label-md` uppercase + reviewer initial, color `ink-50`, then date below.
- Hover: card lifts to `elevation-1`.

**No carousel arrows on desktop** — let cards sit static on a desktop view. Mobile uses native snap-scroll.

**Behavior**

- Pulls from `GET /api/reviews?limit=6`. If empty or errors, hide the section silently (don't break layout).
- Refresh every hour (cached server-side).

---

## 8. FOOTER

The page closes with the global inverse footer (per `00_global.md` §5). Reinforced specifics for this page:

- Surface `ink-100` (true black), full-bleed.
- Massive Wheels wordmark top-left in the footer at `display-2xl` (or smaller responsive scale) — the Rivian footer pattern.
- Four columns: Wheels · Help · Contact · Trust & Social.
- Bottom strip: copyright, language switcher (EN active, AR/FR with "Coming soon" badge), social icons.

The footer is one of the page's signature visual moments — let the typography breathe. **This is the only place on the page where `display-2xl` appears outside the hero.**

---

## Module-specific components

The landing page composes existing patterns; only one truly new pattern lives here.

### `<CategoryWordmarkCard />` (NEW, lives here)

The Rivian-pattern category card with the category name set MASSIVE behind/over the vehicle image.

**Props (informational, not a code spec):**
- `categoryName: string`
- `vehicleImage: ImageSrc` (PNG with transparent or context-cut background)
- `description: string`
- `priceFromUSD: number`
- `slug: string` (e.g. `"sedan"`)

**Variants:**
- `desktop` — wordmark at `display-mega`, vehicle overlays the wordmark visually.
- `mobile` — wordmark at `display-2xl`, vehicle stacks below.

### `<HeroSearchTabs />`

The pill-chip tab row above the search bar (Cars / Long-term / Chauffeur / Airport transfer). State-driven — selected chip controls which form shows below.

### `<InversePromoBlock />`

The 60/40 inverse marketing card used both in §1.2 (hero promo) and §6 (long-term). Reusable component with `eyebrow`, `headline`, `lead`, `cta`, `image` slots.

### Reused components (defined elsewhere)

- `<Header />` — global, transparent over hero, switches to solid paper on scroll past 60px.
- `<SearchBar />` — global, used inside the hero (`00_global.md` §4).
- `<VehicleCard />` — dark variant used in §4. Defined in `02_fleet_browse.md`.
- `<DestinationTile />` — image card with bottom-anchored content + scrim. Reused in §5.
- `<ReviewCard />` — light tinted card with stars. Defined in `00_global.md`.
- `<Footer />` — global, inverse, defined in `00_global.md`.
- `<WhatsAppFAB />` — global floating button.

---

## States & edge cases

| Scenario                                          | Behavior                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| First visit, no `wheels.lastSearch`               | Search bar defaults: pickup = Beirut Airport (BEY); pickup date = today + 1 at 10:00; return = today + 4 at 10:00. |
| Returning visit, recent `wheels.lastSearch`       | Pre-fill the search bar from `localStorage` if < 7 days old. Show a small chip above the bar: "PICK UP WHERE YOU LEFT OFF →" linking back to `/book/select-vehicle?...` |
| In-progress booking saved (`wheels.booking.draft`)| Slim banner above the hero: "CONTINUE YOUR BOOKING — TOYOTA YARIS, MAY 20–25 →" with a Resume tertiary button. |
| Promo applied via UTM (`?promo=SUMMER15`)         | Auto-apply the promo, surface a slim banner above the hero: "PROMO SUMMER15 APPLIED — 15% OFF". Pre-fill into the search bar promo field. |
| Reviews API returns empty / errors                | Section §7 hides silently — no broken layout, no skeleton stuck.                                      |
| Featured vehicles API returns < 4                 | Section §4 fills from a static fallback list. Never shows fewer than 4 cards.                         |
| Slow connection                                   | Hero image is text-only (no image to load). Vehicle images and destination photos lazy-load with skeleton placeholders in `ink-10`. |
| User dismisses the inverse promo strip            | Persist dismissal for 7 days (`localStorage` `wheels.heroPromo.dismissedAt`).                         |
| User on prefers-reduced-motion                    | All hover scales (1.02–1.03) disabled. Snap-scroll carousels remain functional.                       |
| User opens with WhatsApp pre-context              | WhatsApp FAB pre-fills its message with "Hi Wheels — I just landed on your site and have a quick question." |

---

## Data requirements

- **Featured vehicles:** `GET /api/vehicles/featured?limit=4` → array `{ id, slug, name, category, fromPriceUSD, image, specs: {seats, transmission, fuel, bags} }`.
- **Categories metadata:** `GET /api/categories` → array `{ slug, name, fromPriceUSD, lead, image }` (CMS-driven).
- **Reviews:** `GET /api/reviews?limit=6` → array `{ id, rating, body, reviewerName, date, source: "google"|"trustpilot" }`.
- **Promo strip content:** `GET /api/site-config` → returns `{ heroPromo: { eyebrow, headline, body, ctaLabel, ctaHref, image } | null }` (admin-controlled).
- **Search criteria persistence:** read/write `localStorage` key `wheels.lastSearch`.
- **Booking draft persistence:** read `sessionStorage` key `wheels.booking.draft` (banner trigger).

Endpoints are exposed through Next.js route handlers. Wheels-owned data delegates
to the public API; website-owned content uses Supabase with explicit seed-data
fallbacks.

---

## SEO & metadata

- **Title:** `WHEELS RENT A CAR — PREMIUM CAR RENTAL IN LEBANON · FREE BEY PICKUP`
- **Description:** "Premium car rental in Lebanon. Free Beirut Airport pickup. WhatsApp support 24/7. Free cancellation up to 7 days. Book in under 90 seconds."
- **OG image:** the inverse promo block's hero image, branded with logomark top-left, headline "DRIVE LEBANON, YOUR WAY." overlaid.
- **JSON-LD:** `Organization` + `WebSite` (with `SearchAction` pointing to the search bar).
- **H1:** the hero headline ("DRIVE LEBANON, YOUR WAY.") — set as a real `<h1>` even though visually it uses `display-2xl`.

---

## Performance budgets (per `00_global.md` §13, reinforced for landing)

- **LCP:** the hero headline (text — fast). Target < 1.5s on mobile 4G.
- **Hero image:** the inverse-promo image. Preloaded, AVIF/WebP, < 180 KB.
- **Featured vehicle images:** lazy-loaded with `loading="lazy"`, `decoding="async"`. Each < 60 KB.
- **Destination photos:** lazy-loaded. Each < 100 KB.
- **No CLS spike:** every image has explicit `width` and `height`.
- **Initial JS payload for the landing page:** < 140 KB (search bar interactivity is the only must-have JS above the fold).

---

## Acceptance criteria

- [ ] Page renders in the order: Hero (search + inverse promo) → Categories → Our Benefits → Featured 4 Cars → Explore Lebanon → Renting Long Term → Reviews → Footer.
- [ ] `SHOW CARS` is the **only red `button-cta` on the entire page**. Nowhere else uses red.
- [ ] All headlines render in **Geist Extra Bold UPPERCASE** (`display-*` and `headline-*` tokens).
- [ ] All leadings (sub-headlines and intro paragraphs) render in **Geist Medium sentence case** (`lead-*` tokens).
- [ ] All body copy renders in **Geist Regular sentence case** (`body-*` tokens).
- [ ] All buttons are pill-shaped (`rounded.pill`).
- [ ] No `box-shadow` on any card outside the search bar (`card-floating`).
- [ ] Vehicle cards in §4 are **dark by default** (`vehicle-card` not `vehicle-card-light`).
- [ ] Category cards in §2 render the category name as a `display-mega` wordmark behind the vehicle image on desktop; scales to `display-2xl` and stacks on mobile.
- [ ] §3 Our Benefits sits on a `surface-subtle` band; the 4 cards have no shadow and no border.
- [ ] §4 Featured 4 Cars is a full-bleed `ink-100` band; cards lift slightly to `ink-90` so they read off the band.
- [ ] §6 Renting Long Term is a full-bleed `ink-100` band with the iPhone mockup right and the white-pill CTA.
- [ ] §5 Explore Lebanon tiles use a bottom-anchored scrim with paper text over the photograph.
- [ ] Footer matches `00_global.md` §5 with a `display-2xl` Wheels wordmark.
- [ ] Returning user with `wheels.lastSearch` (< 7 days) sees the search bar pre-filled.
- [ ] In-progress booking surfaces the resume banner above the hero.
- [ ] Promo UTM auto-applies and surfaces above the hero.
- [ ] Mobile: §2 stacks 1-up; §4 and §5 become snap-scroll carousels with peek; §6 stacks copy-first then image.
- [ ] No CLS spike from any image (explicit dimensions everywhere).
- [ ] Lighthouse mobile: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95 on this page.
- [ ] axe-core: zero serious or critical violations.
- [ ] All interactive elements keyboard-navigable; focus rings visible (`4px ink-10` halo over `2px ink-100` outline on light; inverse on dark).
- [ ] Page passes `prefers-reduced-motion` — all hover scales disabled when set.

---

## Build order suggestion

If breaking this into PRs:

1. **Hero (§1.1)** — hero headline + search bar pre-fill logic + tab chips.
2. **Hero promo (§1.2)** — `<InversePromoBlock />` reusable.
3. **Categories (§2)** — `<CategoryWordmarkCard />` (the new pattern).
4. **Featured 4 Cars (§4)** — wires up the existing `<VehicleCard />` to the featured endpoint.
5. **Our Benefits (§3)** — content static, fastest section to ship.
6. **Reviews (§7)** — wire up reviews API + skeleton + empty state.
7. **Renting Long Term (§6)** — reuse `<InversePromoBlock />` from PR 2.
8. **Explore Lebanon (§5)** — `<DestinationTile />` + scrim pattern.
9. **Footer polish + SEO + JSON-LD pass.**

Each PR ships with screenshots at xs (360px), md (768px), and lg (1280px+) widths.
