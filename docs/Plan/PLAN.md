# Wheels — Full Overhaul Plan (INK & SIGNAL)

> **Canonical source of truth.** Maintained in-repo so anyone can pick up
> the redesign by reading this file.

---

## Context

We executed an 11-sprint Phase-1 build (commit `e464915`) and started a Sixt-aesthetic redesign across two phases (`4fe2c25`, `668d836`). The user has since published a **completely new design system** — **`/docs/Design/DESIGN.md` (WHEELS / INK & SIGNAL)** — and a **dedicated landing-page spec** — **`/docs/Implementation/landingpage.md`** — that supersede the old Mediterranean-Modern direction.

**The new direction in one line:**
> Premium product page (Rivian) × travel marketplace (Tripadvisor inverse blocks) × car rental (Sixt dark cards). One typeface (Geist), two signal colours, no decorative shadows, monumental type as a layout device, single red CTA per screen.

**Key gaps between what shipped (Phases 1–2) and the new direction:**
1. **Typography is wrong family + scale.** We use Plus Jakarta / Inter / JetBrains Mono with a `wheels-*` token set. The new system uses **Geist** at three weights (400/500/800) plus Geist Mono, with `display-mega → label-sm` tokens (uppercase headlines, sentence-case body).
2. **Hero is image-backed.** New direction is a **paper canvas** — headline IS the hero. No image behind the search bar (TravelPerk pattern, screenshot the user shared).
3. **Search bar has no tab row.** Spec calls for a pill-chip tab row above the card (Cars / Long-term in our trimmed scope).
4. **Landing page is the old structure.** Landing-page spec (`landingpage.md`) defines a new 8-section ordering with patterns we haven't built (CategoryWordmarkCard, InversePromoBlock, DestinationTile).
5. **Whole-site UI is "soft Mediterranean."** New direction is **bold, sleek, daring** — pill buttons everywhere, no card shadows outside `card-floating`, inverse blocks as first-class signatures, uppercase headlines.

**This plan reworks Phases 3 onwards** to deliver the new direction across the full site, step by step, with each phase a coherent commit. Phases 1–2 are kept where they still hold (single Hazmieh location, real car photos, chauffeur/corporate descoped, true-grey neutrals); we **replace** the parts the new direction supersedes (typography, hero composition, search bar tabs, primitives).

---

## Already done (do not redo)

### Phase 1 (commit `4fe2c25`) — kept
- True-grey neutral scale + drop of elevation shadows (compatible with INK & SIGNAL).
- Single Hazmieh branch fixture, all multi-branch UI cleaned.
- Chauffeur + Corporate pages deleted; nav/footer/sitemap/cross-sells trimmed.
- Real car photos wired into the vehicle fixtures (11 cars).
- DualCtaStrip refocused on long-term only.

### Phase 2 (commit `668d836`) — partially kept
- **Keep:** 3-month range DatePopover (react-day-picker v10 classNames), 2-column TimePicker pill grid, LocationPicker with history + station details panel. These match the new spec.
- **Replace in Phase 6:** image-backed Hero (new spec is paper canvas + no hero photo) and the WhyWheels dark strip (new spec defines a different 4-benefit pattern on tinted band).
- **Replace in Phase 5:** SearchBar layout (no tab row today; new spec needs `<HeroSearchTabs />` chips above + paper canvas + `card-floating` shadow).

### Phase 3 (commit `d656f61`) — shipped
- Installed `geist` npm package; replaced Plus Jakarta / Inter / JetBrains Mono with `GeistSans` + `GeistMono` via `next/font` re-exports.
- Rewrote `styles/tokens.css` to INK & SIGNAL: full ink ramp (`ink-100` → `ink-05`), `paper`, `signal-red*`, `signal-blue*`, semantic alias layer (`surface`, `on-surface`, `border`, etc.), 4-step elevation tokens, container widths, new radius scale (xl=20px, 2xl=24px, 3xl=32px).
- Replaced all `wheels-*` typography utilities with the INK & SIGNAL set (display-mega → display-md, headline-lg → headline-xs uppercase Geist 800, lead-xl → lead-sm Geist Medium, body-lg → body-xs, button-lg → button-sm, label-lg → label-sm, overline, field-label/helper/error, mono-md/lg, price-xl → price-sm).
- Swept ~115 components and pages: `wheels-*` classes renamed (`wheels-title-lg` → `headline-sm`, `wheels-title-md` → `headline-xs`); legacy colour tokens (`neutral-*`, `primary-*`, `secondary-*`, `tertiary-*`) renamed to the ink/paper/signal-red/signal-blue scale.
- Header logo and active nav on the new scale; skip-link rebuilt as a pill (ink-100 + paper).
- **Button.tsx left untouched** per the Phase 3 contract — it still consumes `bg-primary-40` / `bg-secondary-50` / `bg-neutral-*`. The legacy tokens stay defined in `tokens.css` as aliases over the new hexes so Button.tsx renders identically until Phase 4 rebuilds the variant set.

### Phase 4 (commit `ee2274e`) — shipped
- **Button** rebuilt to the 9-variant spec: primary (black pill), primary-inverse, cta (red pill, 56px), secondary (outline → inverts on hover), secondary-inverse, tertiary (text 40px — replaces `ghost`), tertiary-inverse, icon (44px round), whatsapp (locked green). Sizes sm/md/lg/xl per DESIGN.md; `cta` is always 56px regardless of size. Dropped `black`, `ghost`, `size="cta"`, `size="icon"`. Callsites swept (11 `size="cta"` → `size="lg"`; 1 `ghost` → `tertiary`).
- **Chip** gains `inverse` + `inverse-selected` for the upcoming HeroSearchTabs and dark filter rows.
- **Card** five variants: default (paper + 1px border, no shadow), tint (ink-10), inverse (ink-100 / paper, 32px pad), image (ink-95, no pad, image bleeds), floating (paper + elevation-3 + rounded.2xl — only default-shadowed card). Legacy `elevated` / `outline` / `muted` retained as aliases.
- **Input** 56px default, rounded.lg. New `variant="search"` (64px pill, body-lg) for the hero search bar. New `variant="inverse"` for dark sections.
- **Modal + Sheet** rounded.3xl (32px), elevation-4, backdrop rgba(0,0,0,0.72), pill-rounded close button.
- **Toast** rounded.lg (16px), variants info / success / warning / error (red); elevation-3.
- **Header** adds `inverse` variant (ink-100 / paper) alongside default + overlay.
- **Footer** restructured to the Rivian pattern: massive `display-2xl` WHEELS wordmark top-left (responsive clamp 72→192px), four link columns, bottom strip with copyright + language switcher + social icons.
- **Stepper** repainted: label-md typography, monochrome states (future ink-50, active + complete ink-100), check icon on complete.
- **VehicleCard** rewritten to the Sixt spec — DARK by default (ink-95 / paper), 4:3 photo, ghosted-paper spec chips, price-md, primary-inverse "Select" CTA. Adds `light` variant; drops `compact`. Three callsites swept to `variant="light"`.

### Phase 5 (commit `7c89ee9`) — shipped
- **HeroSearchTabs** new component — pill-chip tab row above the search card. Tabs: `cars` (default, drives search) + `long-term` (routes to `/long-term`). Chauffeur + Airport-transfer dropped.
- **SearchBar** rewritten to the TravelPerk pattern. Expanded card uses card-floating (paper + rounded.2xl + elevation-2 + 24px padding) — the only floating element on the page. Pickup location is full-width with the `+ Different return location` ghost link inline. Date range + pickup-time + return-time pickers. Promo code collapsible. `Show cars` red CTA full-width on mobile, anchored right on desktop. Mobile trigger is a single compact pill with elevation-2. DatePopover, TimePicker, LocationPicker unchanged.

### Phase 6 (commit `6c72613`) — shipped
- **Landing page (`/`) rewritten** to match `docs/Implementation/landingpage.md`. 8 sections in spec order: Hero → HeroPromo → Categories → OurBenefits → Featured4 → ExploreLebanon → LongTermPromo → Reviews.
- **New shared components** under `components/landing/`: `InversePromoBlock` (Tripadvisor 60/40 dark card), `CategoryWordmarkCard` (Rivian display-mega wordmark behind vehicle photo), `DestinationTile` (4:5 image card with bottom scrim), `ReviewCard` (tinted card with monochrome stars).
- **New section components** under `app/(marketing)/_components/`: `Hero` (rewrite — paper canvas, display-2xl headline, no image), `HeroPromo`, `Categories`, `OurBenefits`, `Featured4`, `ExploreLebanon`, `LongTermPromo`, `Reviews`.
- **Deleted** the legacy sections: `DualCtaStrip`, `FeaturedCategories`, `FeaturedVehicles`, `HomeFaq`, `ReviewsCarousel`, `WhyWheels`.
- **JSON-LD** added on `/`: `Organization` + `WebSite` with `SearchAction` pointing at the search bar.
- **Tests** — `tests/e2e/home.spec.ts` updated to assert the four new category cards and the long-term tab routing.

### Phase 7 (commit `9694cdc`) — shipped
- **`/vehicles` rewritten** as the canonical results page. Sticky compact SearchBar band, `display-md` heading "Which car do you want to drive?", toolbar of pill chips (Lowest price · Filter · Guaranteed model · Auto only). 3-up dark VehicleCard grid; FilterSidebar opens inside a right Sheet via the Filter chip.
- **`VehicleCardExpanded` new** — Sixt-style inline panel (ink-95, spans 2 cols on lg). Photo left; booking option + mileage + total + Red Next + WhatsApp on the right. Replaces the deleted PDP.
- **Inline expansion** driven by `?selected=<slug>`; clicking any card pushes the param and auto-expands. `?step=1` renders the booking Stepper above the toolbar; Next routes to /book/extras with the draft updated.
- **`/book/select-vehicle`** shrinks to a thin redirect — forwards any query string to `/vehicles?step=1&...`.
- **Removed**: `/vehicles/[slug]` route + `Pdp.tsx` + `FleetListing.tsx` + `FleetPagination.tsx` + `SortSelect.tsx` + `CategoryChips.tsx`. `CATEGORY_LABELS` moved to `lib/vehicles/labels.ts`.
- **Swept**: `VehicleCard` default href, `WhatsAppFab` path detection, `sitemap.ts` per-category routes.
- **Tests** — `fleet.spec.ts` rewritten for inline expansion + `/book/select-vehicle` redirect; `booking-funnel.spec.ts` follows the new entry flow.

### Phase 8 (commit `81544f3`) — shipped
- **FlowSummaryPanel** — desktop right rail becomes `card-floating` (paper + rounded-2xl + elevation-3). Mobile sticky bottom bar inverts to ink-100/paper with the singular red CTA at the right.
- **ProtectionTierCard** — `card` surface + rounded.xl, inner max-liability box switches to `card-tint`. Popular tier keeps `badge-popular` (black ribbon). Inclusions list checkmark goes monochrome (ink-100, not green).
- **AddOnRow** — drops the blue-tint active state; active row gets a 2px ink-100 outline. Icon swatch inverts to ink-100/paper when on.
- **PaymentMethodSelector** — each method row uses a 2px ink-100 outline on selected (was signal-blue-bg). Inner method panels (Card, Cash, Bank, OMT) consume `<Card variant="tint" />`.
- **HoldTimer** — expired state drops the red error palette; banner stays warning-orange so red remains reserved for the singular CTA.
- **Removed** (subsumed by Phase 7): `BookingSummaryPanel.tsx` (PDP sidebar) and `RateSelectorCard.tsx` (replaced by `VehicleCardExpanded`).

### Phase 9 (commit `03d9419`) — shipped
- **`/long-term`** — inverse hero band (display-xl "Drive longer. Save more.", paper sub-text, white pill CTA). Tier cards switch to `card-tint` (popular tier outlines 2px ink-100 with `badge-popular` ribbon). Get-a-quote buttons are primary (black) on every tier; the lone red lives on the enquiry-form submit.
- **`/about`** — editorial inverse hero (display-2xl "We pick you up. / We wait for you."). Story narrows to 720px in body-lg. `StatStrip` repainted to `bg-ink-10` with display-md numerals. `TeamCard` rounded-xl photo + monochrome quote border.
- **`/help`** — inverse hero with display-xl "How can we help?" + search bar. Topic tiles become `card-tint`. `TocSidebar` rebuilt: label-md pill-rounded ink-100 active state, hover lifts on ink-10.
- **`/contact`** — inverse hero, channel cards as `<Card variant="default" />` (WhatsApp keeps the locked green border; phone collapses to a warning-orange "Closed — message us on WhatsApp." outside business hours). Branch list selected card swaps from blue-tint to a 2px ink-100 outline.
- **`/manage-booking`** — inverse hero "Find my booking." Lookup card on paper; submit CTA promoted to red (`variant="cta"`, 56px) — the singular red on the page. Booking-found upsell becomes a `card-inverse` with a primary-inverse CTA.

### Phase 10 (commit `43bbdc9`) — shipped
- **`/locations`** — inverse hero "Visit us in Hazmieh." Inlined leaner address/hours/contact stack (card-tint, rounded.xl) replacing the deleted `BranchHeroCard`. Browse-cars button is primary (black) so the SearchBar keeps the singular red.
- **Account shell** — new `<AccountNav />` (label-md uppercase pill-rounded nav; active route fills with ink-100, hover lifts on ink-10). Sticky on lg.
- **`/account` dashboard** — time-of-day greeting in headline-lg. Upcoming card becomes `card-floating`. Quick-action cards are ink-10 → paper-on-hover with ink-100 border. Recent rows rounded-xl on paper.
- **`/account/bookings`** + `[ref]` — heading rhythm (overline + headline-lg + lead-md). `<BookingHistoryRow />` rounded-xl on paper; `<BookingDetailPanel />` switches to `card-floating`. Empty + pagination polished with pill-rounded buttons.
- **Account sub-pages** — profile / documents / saved-cars normalized to `card-default` (was elevated/outline) and `card-tint` (was muted). Profile danger-zone moves to the explicit `signal-red` token.
- **Auth** — layout drops to `bg-ink-10`. `<AuthCard />` rebuilt as paper + rounded-2xl + 48px padding (headline-lg ink-100 title). Submit CTAs promoted to red (`variant="cta"`, 56px) — singular red per screen.

### Phase 11 (commit `c8526b5`) — shipped
- **Legal / utility surfaces** — `/not-found`, `/error`, `/maintenance` repainted to paper canvas with display-lg headlines + red singular CTAs. `<CookieBanner />` flips to ink-100 / paper-text bar with primary-inverse + secondary-inverse pills (preferences rows on `bg-ink-10` rounded-xl). `<NewsletterPopup />` headline-lg "Get weekly deals." + red Subscribe CTA.
- **Motion layer** — installed `framer-motion@^12`. New `lib/motion/variants.ts` (fadeUp, staggerContainer/Item, popoverOpen, routeFade, cardExpand, inViewOnce) and `useMotionGate()` for `prefers-reduced-motion`. New `<Reveal />` client wrapper wraps every non-hero landing section.
- **Results grid motion** — `/vehicles` uses `LayoutGroup` + `motion.ul` with stagger reveal and `AnimatePresence` so the inline expansion to `VehicleCardExpanded` animates smoothly. Reduced-motion gated to `duration: 0`.
- **Tests** — new `tests/e2e/landing.spec.ts` (8-section structure, category links, Featured-4 routing, Long-term CTA) and `tests/e2e/search-bar.spec.ts` (Hero tabs default state, Pickup popover, Show-cars submit).

### Phase 12 (Revision 2) — shipped — FINAL
- **Hero redesigned with cinematic Lebanon photo.** `app/(marketing)/_components/Hero.tsx` swaps the two-tone grey/paper canvas for a full-bleed `next/image` (`/public/images/Hero Images/ramy-kabalan-mF4_MHgp4ps-unsplash.jpg`) under a 4-stop dark linear-gradient overlay. Headline + lead + trust chips repaint to paper; the SearchBar card-floating still lifts off the photo. `Header` auto-promotes to `overlay` on `/` (transparent until scroll, paper after) so the navbar sits on the photo.
- **`/corporate` un-descoped.** New route `app/(marketing)/corporate/page.tsx` follows the `/long-term` + `/chauffeur` rhythm: inverse hero, 4-up value props, 3-tier comparison (Starter / Growth / Enterprise) via new `components/marketing/TierCardCorporate.tsx`, how-it-works row, inclusions strip, FAQ, and an enquiry form (`components/leads/EnquiryFormCorporate.tsx`). Singular red CTA = the form submit. Corporate added to header nav, footer Wheels column, and `app/sitemap.ts`. Test in `tests/e2e/service-pages.spec.ts` updated from 404 expectation to 200.
- **Trips / blog surface added.** Homepage `ExploreLebanon` converts to a horizontal snap-scroll carousel that pulls from the admin store. New `/trips` listing page with region filter chips. New `/trips/[slug]` article template (client component for live admin reflection). New `Trip` + `TripRegion` types in `types/domain.ts` and a default `TRIPS` fixture seeding 6 articles. Sitemap entry added.
- **Sample Itineraries enhanced.** The `/chauffeur` Sample Itineraries section converts from a 3-up grid to a horizontal snap-scroll carousel with a "See all itineraries →" link. New `/itineraries` listing with category filter chips. New `/itineraries/[slug]` detail page with highlights + schedule timeline. New `Itinerary` + `ItineraryCategory` + `ItineraryScheduleItem` types. New `ItineraryCard` editorial component. Default `ITINERARIES` fixture seeds 6 itineraries.
- **Admin dashboard at `/admin`.** Shipped this phase as a demo-grade client-side gate (`lib/admin/auth.ts`, hardcoded credentials, sessionStorage/localStorage) — since upgraded to server-session auth and Supabase-backed storage; see the note below. `lib/admin/useAdminStore.ts` exposes `useTrips()`, `useItineraries()`, `useFaqs()`, `useCorporateTiers()` hooks so admin writes reflect live on public pages with no reload. Routes: `/admin/login`, `/admin` dashboard, `/admin/trips` (+ `/new`, `/[slug]`), `/admin/itineraries` (+ `/new`, `/[slug]`), `/admin/faqs` (two-pane sections + questions), `/admin/corporate` (multi-tier editor). Shared admin primitives under `components/admin/`: `AdminSidebar`, `AdminPageShell`, `AdminDataTable`, `AdminFormShell`, `TripForm`, `ItineraryForm`. Middleware adds `X-Robots-Tag: noindex, nofollow` to every `/admin/*` route so crawlers ignore it.
- **Public pages wired to the store.** `ExploreLebanon`, `/trips`, `/trips/[slug]`, `/itineraries`, `/itineraries/[slug]`, `/chauffeur`, `/corporate`, and `/help/faq` all read from `useAdminStore` hooks now (with fixture fallback). Editing a trip, itinerary, FAQ section/question, or corporate tier in the admin reflects immediately on the corresponding public surface.
- **Sitemap updated.** `app/sitemap.ts` adds `/corporate`, `/trips`, `/itineraries`.
- **Docs synced.** PRD v2, Sitemap v2 SVG, this PLAN file, `docs/Implementation/README.md`, and the revision walkthrough all updated. New module specs `docs/Implementation/16_trips.md`, `17_itineraries.md`, `18_admin.md`. Specs `07_chauffeur.md` and `08_corporate.md` un-deprecated.

> **Update: the admin gate has since been upgraded off the demo implementation above.** Auth is now server-session based via `/api/admin/sessions` (`lib/server/admin-auth.ts`: env-driven password, HMAC-signed HttpOnly session cookie, CSRF token on mutations, Supabase-backed audit log), and storage runs through `/api/cms/*` against Supabase (`lib/admin/store.ts`), not localStorage. What's still open — login rate limiting/lockout, richer audit fields, confirm-dialog polish — is tracked in `docs/Implementation/18_admin.md` § "Remaining hardening before production."

---

## Stack additions

- **`geist` npm package** (Vercel-maintained) for Geist Sans + Geist Mono. Self-hosted woff2 via `next/font/local` is the fallback if licensing requires it.
- **`framer-motion@^12`** in Phase 11 (motion layer).
- Everything else stays: Next.js 16 + Tailwind v4 + Radix + Vitest + Playwright.

---

## Phase 3 — Typography & token system (INK & SIGNAL)

**Goal:** install Geist, replace `wheels-*` typography tokens with the new `display-*`, `headline-*`, `lead-*`, `body-*`, `button-*`, `label-*`, `overline`, `mono-*`, `price-*` set from DESIGN.md, repaint the colour ramp to the `ink-100 → paper` scale, apply across every existing component (component-by-component pass).

**Critical files:**
- `app/layout.tsx` — swap the three `next/font/google` loaders for `geist/font/sans` + `geist/font/mono`. Drop the `--font-jakarta` / `--font-inter` / `--font-mono` variables; expose `--font-sans` + `--font-mono`.
- `styles/tokens.css` — full rewrite to INK & SIGNAL:
  - **Colours:** replace `--color-primary-*` and `--color-neutral-*` blocks. Add `--color-ink-100 → ink-05` ramp (14 steps), `--color-paper`, `--color-signal-red*`, `--color-signal-blue*`. Drop `--color-tertiary-*` (no olive sand in new system). Keep `--color-whatsapp`.
  - **Typography utilities:** delete every `@utility wheels-*` and replace with `display-mega`, `display-2xl`, `display-xl`, `display-lg`, `display-md`, `headline-lg/lg/md/sm/xs`, `lead-xl/lg/md/sm`, `body-lg/md/sm/xs`, `button-lg/md/sm`, `label-lg/md/sm`, `overline`, `field-label`, `field-helper`, `field-error`, `mono-md/lg`, `price-xl/lg/md/sm`. Match the px/weight/lineHeight/letterSpacing exactly from DESIGN.md frontmatter.
  - **Spacing & containers:** keep numeric Tailwind defaults (per the lesson learned earlier); just add the `--container-narrow: 880px`, `--container-default: 1280px`, `--container-wide: 1440px`, `--container-full: 1600px` block.
  - **Elevation:** add `--shadow-elevation-1..4` back, scoped narrowly. The system uses them for `card-floating`, popovers, FAB, and modals only — never on cards.
- `app/globals.css` — keep the print stylesheet + reduced-motion media query; drop the focus-ring CSS variable usage and rebuild against `--color-focus-ring: var(--color-ink-100)`.

**Component sweep (search-and-replace, one PR commit):**
- Every component using `wheels-headline-lg` → `headline-lg`, `wheels-body-md` → `body-md`, `wheels-display-2xl` → `display-2xl`, etc. The token names map 1:1 in most cases.
- `text-primary-40` / `bg-primary-40` callsites → semantic tokens: `text-signal-blue` for info, `text-ink-100` for primary, etc.
- `bg-neutral-95` → `bg-ink-10` (or `bg-surface-subtle`).
- The `Header.tsx` nav link `text-primary-40` for active state → `text-ink-100` + 2px underline (already 80% there from Phase 1).
- `Button.tsx` — rewrite per Phase 4 (don't touch in this phase; just leave it consuming `bg-primary-40` for now, Phase 4 will rebuild the variant set).

**Verification:**
- `pnpm typecheck` + `pnpm lint` clean.
- Visit `/`, `/vehicles`, `/locations`, `/book/select-vehicle`, `/about`, `/help`, `/privacy`. Confirm all text renders in Geist; no font fallback visible; uppercase headlines render with tight tracking.
- `pnpm test:e2e:smoke --project=chromium` still green (selectors are role/text-based, font swap doesn't affect them).

---

## Phase 4 — Primitives overhaul

**Goal:** rebuild the core UI primitives to match the new component spec in DESIGN.md. After this phase every primitive is pill-shaped where it should be, shadow-free where it should be, and on-token.

**Critical files (all rewrites, signatures preserved):**
- `components/ui/Button.tsx` — variants:
  - `primary` (BLACK pill, 48px, `button-md`)
  - `cta` (RED pill, 56px, `button-lg`)
  - `primary-inverse` (WHITE pill on dark)
  - `secondary` (outline pill, inverts on hover)
  - `secondary-inverse` (outline white on dark)
  - `tertiary` (text pill, 40px)
  - `tertiary-inverse`
  - `icon` (44px round)
  - Sizes: `sm` (36px), `md` (48px default), `lg` (56px), `xl` (64px — used only on the long-term CTA).
  - Drop the `black` and `ghost` variants added in Phase 1; `primary` IS black now, `tertiary` covers ghost.
- `components/ui/Chip.tsx` — new component. `filter-chip` (ink-10 default, ink-100 selected), `inverse-chip` (ink-80 default, paper selected). Used by the new HeroSearchTabs and filter chip rows.
- `components/ui/Card.tsx` — variants:
  - `card` (paper + 1px border, no shadow, `rounded.xl`)
  - `card-tint` (ink-10, no border, no shadow)
  - `card-inverse` (ink-100, paper text, 32px padding)
  - `card-image` (ink-95, 0 padding, image bleeds)
  - `card-floating` (paper + elevation-3, `rounded.2xl`) — the ONLY default-shadowed card.
- `components/ui/Input.tsx` — 56px tall, `rounded.lg` (16px) by default. Add `variant="search"` that's 64px tall + pill-rounded for the hero search bar.
- `components/ui/Switch.tsx` / `Slider.tsx` / `Checkbox.tsx` — already moved to neutral-10 in Phase 1; double-check sizes match spec (Switch 44×24, Checkbox 20px square `rounded.xs`).
- `components/ui/Modal.tsx` / `Sheet.tsx` — `rounded.3xl` (32px) per spec, backdrop `rgba(0,0,0,0.72)`, paper surface, elevation-4. The largest radii in the system.
- `components/ui/Toast.tsx` — ink-100 background, paper text, `rounded.lg` (16px). Variants: `info` (default), `success` (success colour), `error` (signal-red).
- `components/shell/Header.tsx` — paper background by default, 72px tall, 1px border bottom. Variant `transparent` overlays dark hero pages (the landing page hero is paper so this variant rarely applies after redesign). New variant `inverse` for fully dark sections.
- `components/shell/Footer.tsx` — restructured to the Rivian footer pattern (massive `display-2xl` wordmark top-left, four columns to its right, bottom strip with copyright + language switcher + social icons).
- `components/booking/Stepper.tsx` — keep horizontal layout, switch type tokens to `label-md`, active step `text-ink-100`, completed step `text-ink-100` with check icon (success colour optional).
- `components/vehicle/VehicleCard.tsx` — **rewrite to the new Sixt-style spec.** DARK by default (ink-95 surface, paper text):
  - Photo bleeds top, 4:3, `rounded.xl` cropping
  - Title row: `headline-sm` uppercase ("TOYOTA YARIS"), "or similar" body-sm italic ink-40
  - Spec chips: `vehicle-card-spec-chip` ghosted paper (rgba(255,255,255,0.1)), 4 chips ([seats][trans][fuel][bags])
  - Price: `price-md`, paper
  - CTA: `button-primary-inverse` "SELECT →" full-width
  - Light variant exists for grid contexts where a sea of dark cards would be heavy.
  - Drop `variant="compact"` (collapse to one variant).

**Verification:**
- New `/dev/components` route renders every primitive in every state (light + dark contexts). Manual a11y walk: focus rings, keyboard nav, axe-clean.
- Smoke tests still green after primitive swap.

---

## Phase 5 — New SearchBar (TravelPerk pattern, paper canvas, no image)

**Goal:** rebuild the SearchBar to match the TravelPerk reference + DESIGN.md `search-bar` token + `landingpage.md` §1.1. No background image — the search bar sits on a paper canvas and the bar itself is the only floating element with a shadow on the page.

**Critical files:**
- `components/search/HeroSearchTabs.tsx` (new) — pill-chip tab row above the search card. Tabs: **CARS** (default, wired) + **LONG-TERM** (wired — routes to `/long-term`). Chauffeur and Airport-transfer tabs **dropped** because both backing pages were descoped in Phase 1. Structure-ready for future tabs without breaking the layout.
- `components/search/SearchBar.tsx` — rewrite:
  - Outer card: `card-floating` (paper, `rounded.2xl`, `elevation-2`, 24px padding). The **only** card-style element on the page with a shadow.
  - Field layout:
    1. Pickup location (LocationPicker) — full-width on its own row, with `+ Different return location` ghost link inline
    2. Date range pair (DatePopover, range mode) — paired with pickup-time and return-time pickers
    3. Promo code collapsible (tertiary link expands to input)
    4. `SHOW CARS` CTA — full-width red pill on mobile, anchored right on desktop, 56px tall, the **only** red on the page
  - Mobile: same fields stack inside a bottom sheet; the home trigger is a single compact pill ("Hazmieh · 16 May 10:00 → ... · Edit").
- `components/ui/DatePopover.tsx` — keep Phase-2 implementation (3-month range, v10 classNames, black-filled selected). Already on spec.
- `components/ui/TimePicker.tsx` — keep Phase-2 implementation (2-column pill grid). Already on spec.
- `components/search/LocationPicker.tsx` — keep Phase-2 implementation (history + station details). Already on spec.

**Phase-2 hero unwind happens here:**
- Hero.tsx still uses an image background. Phase 6 rebuilds the Hero around the new SearchBar. **Don't ship Phase 5 without Phase 6** — the search bar's design assumes no image behind it.

**Verification:**
- Search submission still routes to `/book/select-vehicle?…` (or `/vehicles?…` after Phase 7).
- All field popovers (date / time / location) open and close on keyboard + click.
- Mobile bottom-sheet still works.

---

## Phase 6 — Landing page rebuild (per landingpage.md)

**Goal:** rebuild `/` to match `docs/Implementation/landingpage.md` exactly. Eight sections, four new component patterns, no hero image.

**Section build order (per landingpage.md §"Build order suggestion"):**

1. **Hero (§1.1)** — paper canvas + headline + tabs + search bar.
   - `app/(marketing)/_components/Hero.tsx`: drop image background, drop overlay, set `bg-paper`. Headline `display-2xl` ink-100 ("DRIVE LEBANON, / YOUR WAY."). Sub-headline `lead-lg` ink-60 (max 540px). 48px gap to search bar. Trust chips below the search card in `label-md` ink-50.
   - Header `variant="overlay"` no longer needed here — header is solid paper.
2. **Hero promo strip (§1.2)** — `<InversePromoBlock />` new component.
   - Inverse card (ink-100, paper text, `rounded.xl`, 64px padding desktop). 60/40 split: copy left (eyebrow + `display-lg` headline + `lead-md` sub + `button-primary-inverse` CTA), image right (Lebanese vehicle/landscape, full-bleed inside the card column with matching radius).
   - Phase-1 default copy: "TRAVELERS' CHOICE — THE CARS YOU TRUST AT HAZMIEH" with "Free pickup. Brand-new fleet. WhatsApp support." + "BROWSE FLEET →".
   - Surface lives inside `container-default`, below the hero search card, above the categories section.
3. **Categories (§2)** — `<CategoryWordmarkCard />` new component (the daring section).
   - 2-column grid desktop, 1-up mobile. Card surface `card-tint` (ink-10), `rounded.xl` (20px), 48px padding, min-height 480px.
   - Category name set MASSIVE as `display-mega` (144px) **behind** the vehicle image — Rivian pattern. Vehicle photo overlays the wordmark visually.
   - 4 categories Phase 1: SEDAN, SUV, LUXURY, 7-SEATER. Map to existing fixture vehicles (one hero vehicle photo per category).
   - Below image: 2-line lead, `price-sm` "From $X / day", `button-secondary` "EXPLORE" + `button-primary` "BOOK" pair. Whole card clickable → `/vehicles/[category]`.
   - Mobile: wordmark scales to `display-2xl` (112px), vehicle stacks below.
4. **Featured 4 Cars (§4)** — full-bleed `ink-100` band.
   - Band runs edge-to-edge. 128px vertical padding desktop. Eyebrow + `display-lg` heading "THE FOUR YOU SHOULD BOOK." (paper).
   - 4 dark `<VehicleCard />`s (from Phase 4 rewrite) on a horizontal row. On the dark band the card surface lifts to ink-90 so it reads off the band.
   - Mobile: horizontal snap-scroll, 1.2 cards visible. Section heading stacks above.
   - Below the row: `button-secondary-inverse` "VIEW THE FULL FLEET →" centred, routes to `/vehicles`.
5. **Our Benefits (§3)** — `surface-subtle` band, 4-up grid.
   - Band background ink-10 full-bleed, 128px vertical padding. Section heading `display-md` "THE BASICS, COVERED." + `lead-lg` sub.
   - 4 paper cards on the tinted band (no border, no shadow — the band's tint defines edges). 32px padding. Top icon → `headline-sm` title → `body-md` body.
   - The 4 benefits per spec, **with the BEY → Hazmieh swap from Phase 1**:
     1. FREE PICKUP AT HAZMIEH (was "FREE BEY PICKUP")
     2. FREE CANCELLATION UP TO 24H
     3. WHATSAPP 24/7
     4. PAY HOW YOU WANT
6. **Reviews (§7)** — 3 tinted cards, `card-tint`, stars in ink-100 (monochrome on purpose, not yellow).
   - `<ReviewCard />` new component. `body-md` quote ink-95, `label-md` name uppercase ink-50 + date below.
   - 3 cards desktop, 1.2 cards mobile snap-scroll. Hide section silently if reviews API empty.
7. **Renting Long Term (§6)** — full-bleed `ink-100` band with iPhone mockup.
   - 50/50 desktop. Eyebrow + `display-xl` "DRIVE LONGER. / SAVE MORE." (paper) + `lead-lg` ink-30 sub + 64px-tall `button-primary-inverse` "GET A QUOTE →".
   - Right column: iPhone mockup image (placeholder PNG in Phase 1; can refine later). On mobile stacks below copy.
   - **No red** — the white pill carries the action; red is reserved for the search bar's SHOW CARS.
   - Reuses `<InversePromoBlock />` from §1.2 with a `size="large"` prop.
8. **Explore Lebanon (§5)** — 3 editorial tiles with bottom-anchored scrim.
   - `<DestinationTile />` new component. `card-image` ink-95 surface, 4:5 aspect, full-bleed Lebanese photo. Bottom scrim (rgba(0,0,0,0) → rgba(0,0,0,0.7)).
   - Inside scrim: `headline-md` paper title, `label-md` ink-30 meta ("8h · SUV recommended"), `button-tertiary-inverse` "PLAN THIS DRIVE →".
   - 3 destinations Phase 1: THE CEDARS, BAALBEK & ANJAR, TYRE & SIDON. Photos from `public/images/Trips Images/`.
   - 3 cards desktop, 1.2 cards mobile snap-scroll.
9. **Footer polish + SEO/JSON-LD pass.**
   - Footer rebuilt as the Rivian pattern: massive `display-2xl` "WHEELS" wordmark top-left as the visual anchor. Four columns to its right (Wheels / Help / Contact / Trust). Bottom strip: copyright + language switcher with "Coming soon" badges + social icons.
   - JSON-LD: `Organization` + `WebSite` with `SearchAction` pointing to the search bar.

**New components introduced in Phase 6:**
- `components/landing/HeroSearchTabs.tsx` (Phase 5 dependency, lives here logically)
- `components/landing/CategoryWordmarkCard.tsx`
- `components/landing/InversePromoBlock.tsx`
- `components/landing/DestinationTile.tsx`
- `components/landing/ReviewCard.tsx`

**Files modified:**
- `app/(marketing)/page.tsx` — section order updated per spec, drop FeaturedCategories / FeaturedVehicles / ExploreLebanon / DualCtaStrip / ReviewsCarousel / HomeFaq imports and replace with new section components.
- `app/(marketing)/_components/Hero.tsx` — rewrite (no image, paper canvas).
- `app/(marketing)/_components/WhyWheels.tsx` — rewrite to "Our Benefits" 4-up tinted band.
- New: `app/(marketing)/_components/HeroPromo.tsx`, `Categories.tsx`, `Featured4.tsx`, `ExploreLebanon.tsx`, `LongTermPromo.tsx`, `Reviews.tsx`.

**Verification:**
- Visual QA at 360 / 768 / 1280 / 1440 widths.
- New Playwright test: `tests/e2e/landing.spec.ts` — section order, tab selection, search submit, category card click, "VIEW THE FULL FLEET" routes to `/vehicles`.
- Lighthouse mobile: Perf ≥ 90, A11y ≥ 95, SEO ≥ 95 on `/`. CLS = 0.

---

## Phase 7 — Unified `/vehicles` + drop PDP + inline car-selected

**Goal:** one results page. Sixt-style inline expansion replaces the PDP.

**Critical files:**
- `app/(marketing)/vehicles/page.tsx` — rewrite as the canonical results page.
  - Sticky top band: compact search summary + Modify pencil (uses `<SearchBar variant="compact" />`).
  - Toolbar row of filter chips: "LOWEST PRICE | FILTER | GUARANTEED MODEL | AUTO ONLY".
  - 3-up grid of dark `<VehicleCard />` on lg, 2 on md, 1 on sm. Heading "WHICH CAR DO YOU WANT TO DRIVE?" `display-md` ink-100.
- `components/vehicle/VehicleCardExpanded.tsx` (new) — Sixt's "car selected" panel.
  - Card grows to span 2 cols on lg. Photo left, booking-option + mileage + total + 2 CTAs right.
  - Red `cta` "NEXT" → pushes vehicle into booking-draft + routes to `/book/extras`.
  - Black `button-tertiary` "Ask on WhatsApp" → `wa.me` deep link with pre-filled message.
  - Close × collapses.
- `app/(booking)/book/select-vehicle/page.tsx` — convert to a thin redirect: read query → push `/vehicles?step=1&...`. Stepper keeps step 1 labelled "VEHICLE".
- Delete `app/(marketing)/vehicles/[slug]/page.tsx` + `app/(marketing)/vehicles/_components/Pdp.tsx`.
- Rewrite every `Link href={`/vehicles/${slug}`}` to `Link href={`/vehicles?selected=${slug}`}`. Files: `VehicleCard.tsx`, `FeaturedCategories.tsx` (delete in P6), `ExploreLebanon.tsx` (delete in P6), `WhatsAppFab.tsx`, `Pdp` test files.
- `app/sitemap.ts` — drop per-vehicle slug URLs (already removed `vehicleRoutes` block in P1, double-check).
- `components/vehicle/FilterSidebar.tsx` — render inside a `<Sheet>` triggered by the "FILTER" chip. Bottom sheet on mobile, right sheet on desktop.

**Verification:**
- `tests/e2e/fleet.spec.ts` — replace PDP-related assertions with "click card → expanded panel appears with NEXT button" + "NEXT routes to /book/extras with vehicle in draft".
- `?selected=toyota-yaris` auto-expands the matching card on page load.

**Push checkpoint:** push to `origin/main` after Phase 7 lands.

---

## Phase 8 — Booking funnel restyle

**Goal:** apply INK & SIGNAL across all 5 booking steps. No structural changes — just visual + token + primitive swaps.

**Critical files:**
- `app/(booking)/book/extras/page.tsx`, `protection/page.tsx`, `checkout/page.tsx`, `confirmation/[ref]/page.tsx`.
- `components/booking/Stepper.tsx` — repaint with new tokens (already neutral in Phase 1, fine-tune).
- `components/booking/BookingSummaryPanel.tsx` + `FlowSummaryPanel.tsx` — convert to `card-floating` (the only shadowed card). Mono prices via `price-md`.
- `components/booking/RateSelectorCard.tsx`, `ProtectionTierCard.tsx`, `AddOnRow.tsx` — repaint:
  - Cards switch to `card` or `card-tint` per context.
  - Selected state: 2px ink-100 outline (was primary blue).
  - "Popular" ribbon on protection: `badge-popular` (black, not red) per spec.
- `components/booking/PaymentMethodSelector.tsx` — chips for the 4 methods, selected = black filled.
- `components/booking/HoldTimer.tsx` — warning colour from semantic `--color-warning` (orange), not signal-red.
- Mobile sticky bottom bar at checkout: "TOTAL $X · SEE DETAILS ▾" — black surface, paper text, single red CTA "PAY & CONFIRM" at the right.

**Verification:**
- `tests/e2e/checkout.spec.ts` — 4 payment paths still pass on chromium.
- Visual: every step at 360px + 1280px, single red CTA per screen, stepper monochrome.

---

## Phase 9 — Long-term, About, Help, Contact, Manage Booking restyle

**Goal:** repaint each remaining marketing/utility surface to INK & SIGNAL.

**Per-page rewrites (one commit per page or one commit for the batch):**

- **`app/(marketing)/long-term/page.tsx`** — new inverse hero band with `display-xl` "DRIVE LONGER. / SAVE MORE." Tier comparison: 4 `card-tint` tiles for 1/3/6/12 months, the 6-month one outlined 2px ink-100 with `badge-popular` ribbon (black). `<EnquiryFormLongTerm />` lives below in a `card` with `rounded.xl`. Single red CTA on the form submit.
- **`app/(marketing)/about/page.tsx`** — editorial structure. Hero with `display-2xl` "WE PICK YOU UP. / WE WAIT FOR YOU." (or similar). Founding story in `body-lg` narrow container. `<StatStrip />` 4 stat tiles `display-md` numbers. Team grid: `<TeamCard />` paper cards with photo + role. Find-us section linking to `/locations` (single Hazmieh branch already from P1).
- **`app/(marketing)/help/page.tsx`** + sub-articles — `card-tint` category tiles for the hub, `LegalArticleLayout` already exists (P5 of original build); restyle its TOC sidebar to `label-md` uppercase, active section pill-rounded ink-100.
- **`app/(marketing)/contact/page.tsx`** — 3 channel cards (WhatsApp / Phone / Email). WhatsApp card uses locked green, others use paper + 1px border. Phone card collapses to a "CLOSED — MESSAGE US ON WHATSAPP" state outside business hours.
- **`app/(marketing)/manage-booking/page.tsx`** — paper-canvas lookup form, single red CTA "FIND MY BOOKING". On match, render `<BookingDetailPanel />` (reused from account).

**Verification:**
- Smoke tests updated for new headlines if locators were heading-based.
- Manual: each page renders well at 360 / 1280, single red CTA per screen.

---

## Phase 10 — Locations + Account + Auth restyle

**Goal:** the rest of the surfaces — locations detail, the authenticated experience, and the auth pages.

**Critical files:**
- **`app/(marketing)/locations/page.tsx`** — single-Hazmieh page restyled. Inverse hero band with `display-xl` "VISIT US IN HAZMIEH." Address + hours + parking notes in `card-tint`. Replace `BranchHeroCard` with a leaner address/hours stack.
- **`app/(account)/account/page.tsx`** — dashboard. Greeting `headline-lg` "GOOD MORNING, TONI." + upcoming-booking `card-floating` + quick-action chips + recent-bookings list rows.
- **`app/(account)/account/bookings/page.tsx`** + `[ref]/page.tsx` — filter chips, paper rows on `card` surfaces, `<BookingDetailPanel />` restyled with `card-floating` right rail.
- **`app/(account)/account/profile/page.tsx`** + `documents/page.tsx` + `saved-vehicles/page.tsx` — repaint with new tokens.
- **`app/(account)/layout.tsx`** — left sidebar with `label-md` uppercase nav, active route pill-rounded ink-100.
- **`app/(auth)/login/page.tsx`** + register / forgot-password / reset-password — `<AuthCard />` paper surface, `rounded.2xl`, 48px padding. `headline-lg` "SIGN IN." `<PasswordStrengthIndicator />` keeps colour bars but on monochrome track. Single red CTA "SIGN IN" / "CREATE ACCOUNT".

**Verification:**
- `tests/e2e/auth.spec.ts` — login flow still passes.
- Manual: account dashboard reads as premium-product, not soft-friendly.

---

## Phase 11 — Legal + Motion + Polish + Push

**Goal:** the long tail and the final integration.

### 11A. Legal + utility pages

- **`app/(marketing)/privacy/page.tsx`** + `terms/` + `cookies/` — repaint `<LegalArticleLayout />` to INK & SIGNAL. TOC sidebar uses `label-md` uppercase, sticky on lg.
- **`app/not-found.tsx`** — restyled "WRONG TURN." `display-lg` headline, `button-cta` "BROWSE OUR FLEET", `button-secondary` "BACK TO HOME".
- **`app/error.tsx`** + `app/global-error.tsx` — same paper canvas, "SOMETHING WENT WRONG." `display-lg`.
- **`app/maintenance/page.tsx`** — paper canvas, big wrench icon, "WE'LL BE RIGHT BACK." display-lg, WhatsApp escape.
- **`components/consent/CookieBanner.tsx`** — restyle pill: black surface bottom bar, paper text, two pill buttons (Reject / Accept) + "Manage preferences" link.
- **`components/consent/NewsletterPopup.tsx`** — restyle as a `modal` with `rounded.3xl`, headline `headline-lg` "GET WEEKLY DEALS.", `input` + `button-cta` row.

### 11B. Motion layer

- Install `framer-motion@^12`.
- New file `lib/motion/variants.ts`:
  - `fadeUp` — `{opacity:0,y:12}` → identity, 320ms ease-out. For section scroll-in (`whileInView`, once).
  - `staggerContainer` (children 60ms apart) + `staggerItem` — for results grid, Featured4Cars, Categories.
  - `popoverOpen` — `{opacity:0,scale:0.96,y:-4}` → identity, 180ms. For DatePopover / TimePicker / LocationPicker content portals.
  - `cardExpand` — `layout` + `AnimatePresence` for VehicleCardExpanded.
  - `searchBarMorph` — `useScroll` + `useTransform`: hero search bar shrinks into a 56px sticky band when user scrolls past 480px on `/` and `/vehicles`.
  - `routeFade` — 200ms fade + 8px lift between routes. Mounted in `app/layout.tsx`.
- `lib/motion/useMotionGate.ts` — re-exports `useReducedMotion()` from framer-motion; every animated component gates `duration: 0` when reduced motion is on.
- Apply to: every home section (`motion.section variants={fadeUp}`), results grid (stagger), card hover (CSS only — `transition-transform duration-150 hover:-translate-y-0.5`), popover open (variant), card expand (AnimatePresence + layout), hero → sticky search morph, route transitions.
- Perf budget: framer-motion adds ~30 KB gzipped. Landing page initial JS still under 140 KB. If we tip over: lazy-import framer in interactive components only.

### 11C. Final polish + tests

- Update + add Playwright tests:
  - `tests/e2e/landing.spec.ts` (new) — 8-section structure, tab toggle, category card click, featured cars scroll, long-term CTA route.
  - `tests/e2e/fleet.spec.ts` — replace PDP assertions with card-expansion assertions.
  - `tests/e2e/booking-funnel.spec.ts` — step 1 lives at `/vehicles` (already accepting via the shim from Phase 7).
  - `tests/e2e/search-bar.spec.ts` (new) — opens calendar (range select), time picker (slot select), location picker; submit lands on `/vehicles` with query.
  - `tests/e2e/utility-pages.spec.ts` — `/chauffeur` + `/corporate` still 404, sitemap unchanged.
- Lighthouse mobile on every public route: Perf ≥ 90, A11y ≥ 95, SEO ≥ 95.
- axe-core: zero serious/critical violations.

### 11D. Final push

- `git push origin main` after Phase 11C green.

---

## Cross-phase conventions

- **One phase = one commit on `main`.** No long-lived branches. Each commit message follows the format `Phase N — <title>` (matches the Phase 1 + 2 cadence so the history is scannable).
- **CI gate before each commit:** `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e:smoke --project=chromium`.
- **Tokens-only rule still applies** — no arbitrary Tailwind values; everything resolves to a token. Add ESLint rule for `bg-\[#` if not already there.
- **One red CTA per screen.** Lint-spike: search for `variant="cta"` per route file; max 1.
- **No shadow on cards** except `card-floating`. Grep `shadow-elevation-` outside `card-floating` and the FAB/modal/popover/sheet primitives.
- **Push cadence:** after Phase 7 (mid-point) and Phase 11 (final). Skip pushes between to keep CI noise low.
- **Visual QA per phase:** screenshot at 360 / 768 / 1280 / 1440 widths. Include in PR description.

---

## Reusable patterns from existing code (don't rebuild)

- **Radix UI primitives** (Popover, Dialog, Accordion, Tabs) — base for everything; the rewrite is contents + styling, not the trigger/portal plumbing.
- **`useBookingDraft` hook** — Phase 7's expanded-card "NEXT" CTA pushes through this.
- **`whatsAppHref()` helper** — reuse for "Ask on WhatsApp" in expanded card.
- **`useLastSearch` + `readLastSearch`** — already in `lib/search/persistence.ts`; powers the SearchBar prefill + LocationPicker history.
- **Seed/fallback fixtures** — vehicle photos and branch seed data remain shared by repositories and tests.
- **Playwright `storageState`** — already seeds `wheels.consent` + newsletter dismissal; no change needed.
- **Phase-2 DatePopover, TimePicker, LocationPicker** — keep as-is; they're already on the new spec.

---

## Locked decisions

1. **HeroSearchTabs scope** — **2 tabs: Cars + Long-term.** Chauffeur and Airport-transfer dropped (descoped in Phase 1). Component structure can hold more later without breaking layout.
2. **Phase-2 hero image** — **removed as part of Phase 6** (no transition state). The image-backed hero stays until Phase 6 swaps it for the paper-canvas hero in a single coherent visual change.
3. **Geist hosting** — **Vercel's `geist` npm package** via `next/font` re-exports. `import { GeistSans, GeistMono } from 'geist/font/*'`. Smallest setup, automatic preload.
4. **Vehicle photos on Category cards** — ship with current white-background PNGs in Phase 6. Refine to transparent-bg cuts in a follow-up if visual review requires it.
5. **Animation library** — `framer-motion@^12`.
6. **Push cadence** — after Phase 7 (mid) and Phase 11 (final). Two pushes total during the redesign.

---

## Verification (end-to-end)

After Phase 11:
1. `pnpm dev` → home renders in Geist, no hero image, paper canvas with the centred search bar floating in `card-floating`. Tab row above the search card.
2. `display-2xl` headline "DRIVE LEBANON, / YOUR WAY." reads in uppercase Extra Bold.
3. Scroll: 8 sections in order (hero · hero-promo · categories · benefits · featured 4 · explore Lebanon · long-term · reviews · footer).
4. Categories show `display-mega` category names behind vehicle photos (Rivian pattern).
5. Featured 4 Cars sits on a full-bleed black band with dark vehicle cards.
6. Footer top-left shows the massive "WHEELS" wordmark.
7. Click a featured car → `/vehicles` opens with that card auto-expanded (Sixt panel).
8. Click NEXT → `/book/extras` with vehicle in draft.
9. Complete a booking via the Cash path → Confirmation screen still works.
10. `/chauffeur` and `/corporate` still 404. `/locations` shows the single Hazmieh branch.
11. `pnpm test:e2e:smoke --project=chromium` → all green.
12. Lighthouse mobile on `/`: Perf ≥ 90, A11y ≥ 95, SEO ≥ 95.

CI: typecheck + lint + unit + smoke chromium green on every commit.

---

## How to resume in a new session

1. Read this file (`docs/Plan/PLAN.md`) end to end.
2. Read `docs/Design/DESIGN.md` (INK & SIGNAL) — the design system and the brand rules.
3. Read `docs/Implementation/00_global.md` — cross-cutting rules and read order.
4. Read `docs/Implementation/landingpage.md` for the home spec; other module specs live alongside in `docs/Implementation/NN_*.md`.
5. **Redesign + Revision 2 complete.** Phases 1–12 all shipped. Last phase: **Phase 12 — Revision 2 (Hero photo, Corporate restored, Trips/Itineraries, Admin)**. Future work picks up post-launch.
6. Before any phase: run `git pull origin main` to make sure you have the latest. Run `pnpm install` to pick up any deps changes (Phase 3 installed `geist`; Phase 11 installed `framer-motion`; Phase 12 added no new deps).
7. Each phase ends with `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e:smoke --project=chromium` green + a single commit on `main`.
