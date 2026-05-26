# 03 — Vehicle Detail Page (PDP)

> Route: `/vehicles/[slug]` (e.g. `/vehicles/toyota-yaris`)
> Depends on: `00_global.md`, `02_fleet_browse.md` (vehicle card pattern)
> Related: PRD §6.3, sitemap node `Vehicles/[slug]`
> Primary persona: All — the deal-closer page

---

## Purpose & success criteria

The PDP **sells the vehicle and starts the booking**. Reachable from listing, search results, the home featured carousel, and direct links (SEO + paid ads).

**Success looks like:**
- ≥ 25% of PDP sessions click "Continue to book".
- "What's included" tabs are interacted with by ≥ 30% of users (signal of trust-building working).
- The sticky booking summary stays visible throughout scroll.

---

## Page sections (top to bottom)

### 1. Breadcrumb

- `Home › Vehicles › Sedan › Toyota Corolla`. `body-sm`. Last item neutral-10.
- 24px top padding, 16px bottom padding.
- Container: `container-max`.

### 2. Two-column body — gallery + booking summary

```
┌─────────────────────────────────────┬──────────────────────────────┐
│                                     │  BOOK THIS CAR (sticky)      │
│   ┌───────────────────────────┐     │  from $32 / day              │
│   │                           │     │  ─────────────────────────── │
│   │     [Hero photo]          │     │  Pickup  📅 ▾   10:00 ▾      │
│   │                           │     │  Return  📅 ▾   10:00 ▾      │
│   └───────────────────────────┘     │  Pickup location ▾           │
│   [thumb][thumb][thumb][thumb]      │  ─────────────────────────── │
│                                     │  Estimated total       $160  │
│   Toyota Corolla                    │  5 days · taxes incl.        │
│   or similar                        │                              │
│   ⛽ Petrol  🔁 Auto  👥 5  💼 3 ❄  │  [   Continue to book   ]    │
│                                     │  ── or ──                    │
│   [What's included] [Mileage] [...] │  🟢 Ask about this car       │
│   ...tab content...                 │     on WhatsApp              │
│                                     │                              │
│   Description...                    │  Free cancellation up to 24h │
│                                     │                              │
└─────────────────────────────────────┴──────────────────────────────┘
```

#### Left column — gallery

**Width:** 60% on desktop (≥1024px), full on tablet/mobile.

**Hero image:**
- 4:3 aspect ratio, `rounded-lg` corners.
- Click → opens lightbox (full-screen).
- Background fallback `colors.neutral-95` while loading.

**Thumbnails:**
- 4 thumbs in a horizontal row below the hero, each 80×80, `rounded-md`, 2px gap.
- Active thumb has a 2px `colors.primary-40` border.
- Click swaps the hero image (no page reload).

**Vehicle title block:**
- Model name `headline-lg`. "or similar" inline `body-md`, italic, neutral-50.
- Below: spec strip — same as the vehicle card spec strip, but larger (`label-lg`).

**Specs detail strip (icons + labels):**
- 6–8 specs in a row that wraps:
  - Fuel type, Transmission, Seats, Bags, Air Conditioning, Doors, Year, Engine.
- Each: small icon (24px) + label (`label-md`).
- Background `colors.surface-subtle`, `rounded-md`, 16px padding, 16px gap.

#### Right column — sticky booking summary

**Width:** 40% on desktop, full-width below the gallery on tablet/mobile.

**Behavior:**
- `position: sticky; top: 96px;` on desktop. Stays visible as the user scrolls the description.
- Releases stickiness at the bottom of the gallery column, never overlapping the footer.

**Container:**
- White card, `rounded-lg`, 24px padding, `elevation-2`, `border` 1px.

**Content (top to bottom):**

1. **Heading row:** "Book this car" (`title-lg`).
2. **Price block:** `from $32 / day` using `price-lg`.
3. Divider (1px, neutral-90).
4. **Mini search bar (compact):**
   - Pickup date + time (single row).
   - Return date + time (single row).
   - Pickup location dropdown (single row).
   - Pre-filled from `wheels.lastSearch` if available; otherwise defaults (today + 1 / today + 4, BEY).
5. Divider.
6. **Estimated total block:**
   - "Estimated total" label (`label-md`, neutral-50) on the left.
   - Total amount on the right (`price-lg`, neutral-10).
   - Below in `body-sm`, neutral-50: "5 days · taxes and basic insurance included".
7. **Primary CTA:** `button-cta` (red), full width, label "Continue to book". Tapping → goes to `/book/select-vehicle?...` with the vehicle pre-selected.
8. Divider with "or" text in the middle.
9. **WhatsApp option:** `button-secondary` styled with WhatsApp green text + icon: "Ask about this car on WhatsApp". Pre-fills the PDP-context message.
10. **Trust line:** "✓ Free cancellation up to 24h" in `label-md`, color `colors.success`.

**Edge case:** if dates are not yet set (user landed directly), the price shows as `from $32/day` without the total. The total appears once both dates are filled.

### 3. "What's included" tabs

Below the gallery + summary section, full-width within `container-max`.

- Tab labels: **What's included · Mileage · Insurance · Driver requirements · Cancellation**.
- Tab style: uses `tab` and `tab-active` tokens — text-only with a 2px bottom underline on active.
- Tab panel content: simple two-column with icon + label rows.

**Sample content for "What's included" tab:**

```
✓  Unlimited kilometers (or 200 km/day depending on rate selection)
✓  Roadside assistance 24/7
✓  Basic insurance with $X deductible
✓  Free Beirut Airport pickup
✕  Fuel (return with the same level you received)
✕  Tolls and fines
✕  Additional drivers (add-on at booking)
```

**"Mileage" tab:**
Two-up cards explaining capped vs unlimited rates, with a "Choose at booking" line.

**"Insurance" tab:**
Brief explainer of the 3 protection tiers with a link to `/help/insurance-and-coverage`.

**"Driver requirements" tab:**
Bulleted list — minimum age (per category), valid licence held ≥ 1 year, ID required at counter, etc.

**"Cancellation" tab:**
Two-row table: ≥ 24h before pickup → free cancellation; < 24h → first-day rate fee.

### 4. Description

Free-form CMS-driven prose about the vehicle. 2–3 short paragraphs in `body-md`. 720px max line length.

Optional bullet feature list (separate from spec strip): "Why drivers love this car" — 4–6 lifestyle bullets.

### 5. Similar vehicles

A horizontal carousel of 6 cards using the standard `<VehicleCard />` (compact variant per `02_fleet_browse.md`).

- Section heading `headline-md`: "You might also like".
- Pulls from `/api/vehicles/similar?slug=` (server-side recommendation).

### 6. PDP-specific FAQ

Accordion of 4–6 questions specific to renting this category. Default questions:

1. What's the minimum age to rent this car?
2. Is fuel included?
3. Can I take this car across the border?
4. Do I need a credit card?
5. Can I add an extra driver?

Each answer ≤ 3 sentences. Below: link to `/help/faq`.

### 7. Footer

Global footer per `00_global.md` §5.

---

## Module-specific components

### `<PdpGallery />`

Hero + thumbnails + lightbox. Keyboard-navigable (←/→ arrows in lightbox, Esc to close, Tab order through thumbs).

### `<BookingSummaryPanel />`

The sticky right-column card. Reused on the PDP (this file) and inside the booking flow's right rail. Two states:
- **PDP state:** has the mini search bar inside (date/time/location editable inline).
- **Booking flow state:** read-only summary, edits go through the search bar (see `04_booking_flow.md`).

### `<TabGroup />`

Generic tab pattern with keyboard arrow navigation (per WAI-ARIA). Used by "What's included" tabs.

### `<SimilarVehiclesCarousel />`

Reuses `<VehicleCard compact />`. Snap-scroll on mobile.

---

## States & edge cases

| Scenario                                                     | Behavior                                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Vehicle is unavailable for the selected dates                | Sticky panel CTA flips to "Not available — see similar cars" (button-secondary) which scrolls to §5. |
| Dates not selected (direct landing)                          | Sticky panel shows "from $X/day" only, no total. CTA still says "Continue to book" → goes to /book/select-vehicle without a pre-selected vehicle. |
| Price changes between PDP load and booking start             | On entering /book/select-vehicle, show a non-blocking toast: "Prices were updated. Total now shown."  |
| Image fails to load                                          | Hero falls back to a `colors.neutral-95` block with a centered car silhouette icon. Thumb missing → hidden. |
| Slug doesn't exist                                           | 404 page with link to `/vehicles` and category chips visible.                                     |
| Vehicle is "On order" / not currently available at all       | Banner above breadcrumb: "This model is currently unavailable. Browse alternatives →" (link to category page). |
| User on a slow connection                                    | Hero image renders progressively; sticky panel renders immediately with skeleton shimmer for the price. |

---

## Data requirements

- **Vehicle detail:** `GET /api/vehicles/[slug]` → full vehicle object incl. images, specs, description, daily rate, category, included features, restrictions.
- **Pricing for selected dates:** `POST /api/pricing` body `{ vehicleId, pickupDate, returnDate, pickupLocationId }` → daily rate, total, breakdown.
- **Similar vehicles:** `GET /api/vehicles/similar?slug=` → 6–10 vehicle summaries.
- **PDP FAQ content:** comes from CMS keyed to the category, with vehicle-specific overrides where set.

---

## SEO & metadata

- **Title:** "Rent a [Make Model] in Lebanon · from $X/day · Wheels"
- **Description:** "Rent a [Make Model] in Lebanon. Auto, 5 seats, $X/day. Free Beirut Airport pickup, 24/7 WhatsApp support."
- **OG image:** the vehicle hero photo with logo overlay.
- **JSON-LD:**
  - `Product` with `Offer` (`price`, `priceCurrency: "USD"`, `availability`).
  - `BreadcrumbList`.
- **Canonical:** the PDP URL without query parameters.

---

## Acceptance criteria

- [ ] Sticky booking summary stays visible while the user scrolls the description and tabs on desktop.
- [ ] Mini search bar inside the panel pre-fills from `wheels.lastSearch`.
- [ ] "Continue to book" is the singular red CTA; "Ask on WhatsApp" is secondary.
- [ ] Lightbox opens on hero/thumbnail click; closes on Esc and on backdrop click; arrows navigate.
- [ ] Spec strip + "What's included" tabs match the data returned from the API; missing fields hide gracefully.
- [ ] Similar vehicles row scrolls smoothly on mobile (snap to card).
- [ ] PDP passes Lighthouse SEO ≥ 95 with valid Product JSON-LD.
- [ ] If vehicle is unavailable for selected dates, CTA visibly changes to "See similar".
- [ ] All images have meaningful alt text (e.g., "Toyota Corolla 2024 in white, side view").
- [ ] No layout shift when images load (explicit dimensions).
