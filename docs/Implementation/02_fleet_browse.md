# 02 — Fleet Browse (Listing & Categories)

> Routes: `/vehicles`, `/vehicles/[category]`
> Depends on: `00_global.md`
> Related: PRD §6.2, sitemap nodes `Vehicles`, `Vehicles/[category]`
> Primary persona: All — discovery flow before any dates are committed

---

## Purpose & success criteria

`/vehicles` is the **discovery surface** for users browsing without dates yet. Its job is to expose the fleet, communicate breadth and quality, and feed the user into either:
1. A vehicle detail page (PDP) → start booking from there, or
2. The persistent search bar at the top → enter dates and switch to `/book/select-vehicle`.

Category pages (`/vehicles/[category]`) are the same page filtered to one category, with category-specific copy.

**Success looks like:**
- Median time on page: 30–60s (browsing, not bouncing).
- ≥ 35% click-through to a PDP from the listing.
- Filter usage: ≥ 25% of sessions apply at least one filter.

---

## Page sections (top to bottom)

### 1. Page header

- **Background:** `colors.primary-95` (very light blue tint), 24px vertical padding.
- **Container:** `container-max`.
- **Breadcrumb (only on category pages):** `Home › Vehicles › Sedan`. `body-sm`, neutral-50, last item neutral-10.
- **Heading:** `headline-xl`. On `/vehicles`: "Our fleet". On `/vehicles/[category]`: "Sedans" (e.g.).
- **Subhead:** `body-md`, neutral-50. One line.
  - Default: "Premium cars across Lebanon. Pick a category or browse the full fleet."
  - Per-category copy lives in the CMS.

### 2. Persistent search bar

The global search bar (see `00_global.md` §4) appears at the top of the listing in its full expanded form, on a white card with `elevation-2`, overlapping the bottom of the page header by 32px (visual lift).

**Behavior:**
- If the user enters dates and clicks "Show cars", the page transitions to `/book/select-vehicle?...`. The listing stays for browsing-without-dates flows.

### 3. Category chips strip

Horizontal pill-chip filters that switch the category instantly without a full page reload.

- **Layout:** single row, horizontally scrollable on overflow.
- **Chips:** All · Economy · Compact · Sedan · SUV · Luxury · 4×4 · 7-Seater · Convertible.
- **Style:** uses the `chip` token. Active chip uses `chip-selected` (deep blue background, white text).
- **Behavior:** clicking a chip updates the URL (`/vehicles/[category]`) without a full reload. Active state syncs to the URL.

### 4. Two-column layout — filters + grid

```
┌────────────────┬─────────────────────────────────────────┐
│  FILTERS       │   Sort ▾ Recommended    24 cars         │
│  (sticky)      │   ┌─────┐ ┌─────┐ ┌─────┐               │
│                │   │card │ │card │ │card │               │
│  Category      │   └─────┘ └─────┘ └─────┘               │
│  Transmission  │   ┌─────┐ ┌─────┐ ┌─────┐               │
│  Fuel          │   │card │ │card │ │card │               │
│  Seats         │   └─────┘ └─────┘ └─────┘               │
│  Price range   │   ... 24 per page, paginated ...        │
│  Features      │                                         │
└────────────────┴─────────────────────────────────────────┘
```

#### Filter sidebar — desktop

- **Position:** sticky, top offset 96px (header + 24px breathing). Scrolls independently when the page scrolls.
- **Width:** 280px fixed.
- **Background:** white, `rounded-lg`, 24px padding, `border` 1px.
- **Sections** (each a collapsible group, defaults open):

| Group           | Type           | Options                                                     |
| --------------- | -------------- | ----------------------------------------------------------- |
| Category        | Multi-select   | Economy, Compact, Sedan, SUV, Luxury, 4×4, 7-Seater, Conv.  |
| Transmission    | Toggle group   | Automatic · Manual · Any                                    |
| Fuel type       | Multi-select   | Petrol · Diesel · Hybrid · Electric                         |
| Seats           | Toggle group   | 2 · 4–5 · 6–7 · 8+                                          |
| Price per day   | Range slider   | $0–$200+, $5 step                                           |
| Features        | Multi-select   | Bluetooth · GPS · Cruise control · Sunroof · Apple CarPlay  |

- **Chip preview:** at the top of the sidebar, show active filters as removable pill chips ("× Sedan", "× Auto").
- **Reset:** "Reset all" tertiary button bottom of the sidebar; visible only when ≥1 filter is applied.

#### Filter — mobile

- Sticky bottom action bar with two pill buttons: `Filters (3)` (left, opens a bottom sheet) and `Sort ▾` (right, opens a small sheet).
- Filter sheet: full-screen, same groups as desktop, `Apply (24 cars)` button anchored at the bottom.

#### Right column — grid header + cards

Above the grid:
- **Sort dropdown** (left): Recommended (default) · Price low → high · Price high → low · Newest · Largest car.
- **Result count** (right): `24 cars` in `label-md`, neutral-60.

#### Vehicle card — the central component

This card is **shared with the homepage carousel and the search results page**. Build it once.

**Layout:**

```
┌─────────────────────────────────┐
│                                 │
│     [Vehicle photo, 4:3]        │
│                                 │
│   [BEST DEAL badge top-left]    │
├─────────────────────────────────┤
│  Toyota Yaris  or similar       │  ← title-md, neutral-10
│  Economy Sedan                  │  ← label-md, neutral-50
│                                 │
│  ⛽ Petrol · 🔁 Auto · 👥 5 · 💼 3 │  ← spec strip, label-sm, neutral-40
│                                 │
│  ───────────────────────────    │
│  from           $25 / day       │  ← price-lg right-aligned
│                                 │
│  [   View & book   ]            │  ← button-primary (blue) full width
└─────────────────────────────────┘
```

**Tokens:**
- Card uses `vehicle-card` from DESIGN.md.
- Hover state: lift `elevation-1` → `elevation-2`, image subtle 1.03 scale (300ms).
- Selected state (used in `/book/select-vehicle`, not here): `vehicle-card-selected`.

**Content:**
- **Image:** real photo of the actual Wheels-owned car if possible, else a high-quality manufacturer shot. WebP, lazy-loaded.
- **"or similar"** caveat in italic next to the model name.
- **Spec strip:** 4 icon+label pairs separated by `·` on desktop; wraps to 2-line on mobile.
- **Badge area** (top-left of image): one of `Best Deal` (red), `New` (green), `Popular` (blue), or none.
- **Price:** `price-lg`, prefix `from`, suffix `/ day`. Numbers in tabular figures.
- **CTA:** primary blue button (NOT red — red is reserved for the actual conversion action on the PDP/search). Full width on mobile.

**Behavior:**
- Whole card is a link to `/vehicles/[slug]`. Clicking the CTA goes to PDP, not directly into booking (no dates yet).
- Image lazy-loads; placeholder is a soft `colors.neutral-95` block while loading.

#### Grid layout

- 3 columns desktop (≥1024px), 2 columns tablet, 1 column mobile.
- 24px gutter desktop, 16px mobile.
- 24px row gap.
- Skeleton state: 6 vehicle-card-shaped placeholders with shimmer.

### 5. Pagination

- 24 cards per page.
- Pattern: numbered pages with prev/next chevrons, max 5 numbered pages visible (with ellipsis as needed).
- URL reflects page (`?page=2`) for shareable links.
- Mobile alternative: infinite scroll with "Load more" fallback button after 3 auto-loads to preserve battery.

### 6. Bottom CTA strip

- Background `colors.primary-95`, 64px vertical padding.
- Centered text + tertiary CTA:
  - Headline (`headline-md`): "Need help choosing?"
  - Subhead (`body-md`, neutral-50): "Tell us where you're going. We'll suggest the right car."
  - Two side-by-side buttons:
    - `button-secondary` blue outline: "Chat on WhatsApp" (opens WhatsApp with the listing context message).
    - `button-tertiary`: "Browse by category →" (scrolls to the chip strip).

### 7. Footer

Global footer per `00_global.md` §5.

---

## Module-specific components

### `<VehicleCard />`

The central reusable card defined in §4 above. **This component is used in 4 places:**
1. Home featured carousel (01_home.md §5)
2. Fleet listing grid (this file §4)
3. Search results in /book/select-vehicle (04_booking_flow.md)
4. PDP "Similar vehicles" row (03_vehicle_detail.md)

Variants:
- `default` — as described.
- `selected` — used only in /book/select-vehicle, expands to show the rate-selector (defined in `04_booking_flow.md`).
- `compact` — used in cross-sell rows; same content but image is 16:9 and CTA collapses to an inline arrow icon.

### `<FilterSidebar />`

The collapsible sticky filter group in §4. URL-aware — every filter change updates the URL query string and triggers a soft data refetch (no full reload). Filter state must be shareable via URL.

### `<CategoryChips />`

Horizontal scrollable chip filter that switches `/vehicles/[category]` routes. Uses the `chip` and `chip-selected` tokens.

---

## States & edge cases

| Scenario                                          | Behavior                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| No vehicles match the filter combination          | Empty state in the grid: illustration + "No cars match these filters." Primary CTA "Reset filters". Sidebar stays. |
| Internal management system unreachable            | Show cached results with a banner: "Showing yesterday's fleet. Live availability is unavailable — chat on WhatsApp to confirm." |
| Category in URL doesn't exist (`/vehicles/foo`)   | 404 page with category chips visible to redirect.                                                     |
| User scrolls beyond filter sidebar end            | Sidebar releases stickiness at the bottom of the grid (does not float past the footer).               |
| Category page subhead missing in CMS              | Fall back to default "Browse our [category] vehicles" copy.                                           |
| Image fails to load                               | Replace with a generic vehicle silhouette in `colors.neutral-90` background.                          |

---

## Data requirements

- **Vehicles list:** `GET /api/vehicles?category=&trans=&fuel=&seats=&minPrice=&maxPrice=&features[]=&sort=&page=` → paginated list, with totals.
- **Category metadata:** `GET /api/categories/[slug]` → name, hero copy, hero image (Phase 2 may localise).
- **Filter facets:** counts per option (e.g., "Sedan (12)") returned alongside results so the sidebar can show counts on each filter option. Counts update with each applied filter.

---

## SEO & metadata

- **Title (`/vehicles`):** "Our Fleet — Premium Cars in Lebanon · Wheels Rent A Car"
- **Title (per category):** "[Category] for Rent in Lebanon · Wheels Rent A Car"
- **Description:** category-specific 1-line, ≤ 155 chars.
- **JSON-LD:** `BreadcrumbList` + `ItemList` of products (vehicle slugs).
- **Pagination meta:** `<link rel="next">` / `<link rel="prev">` for paged routes.
- **Canonical:** category pages canonical to themselves; filter combinations are noindex.

---

## Acceptance criteria

- [ ] `/vehicles` and every `/vehicles/[category]` route render with the correct heading, breadcrumb, and chip-strip active state.
- [ ] Filter changes update the URL and refetch results without a full page reload.
- [ ] All filter facets show live counts that update as filters apply.
- [ ] The vehicle card is visually identical across home, listing, search results, and similar-vehicles row.
- [ ] Pagination URL reflects page state.
- [ ] No CLS when images load (explicit dimensions).
- [ ] Empty-state illustration + "Reset filters" CTA appears when no results.
- [ ] Filter sidebar is sticky on desktop, bottom-sheet on mobile.
- [ ] All cards are keyboard-navigable; Enter triggers the CTA.
- [ ] Lighthouse mobile performance ≥ 85 on this page.
