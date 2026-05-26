# CLAUDE.md — Wheels Rent A Car

> Project-level memory for Claude Code. Read this first when opening this workspace. It points you to the right specs, the order to read them, the conventions to follow, and the constraints that must hold throughout the codebase.

---

## 1. What this project is

**Wheels Rent A Car (Lebanon)** — a premium, modern, customer-facing car-rental website. Phase 1 ships an English-only customer site fully integrated with Wheels' internal management system.

**Brand positioning:** premium · touristic · lifestyle-oriented. **WHEELS / INK & SIGNAL** — black is the spine, white is the canvas, red and blue are signals used rarely + loudly. One typeface (Geist), monumental type as a layout device, single red CTA per screen.

**UI/UX inspiration:**
- **Rivian** — monumental typography (e.g. category name set behind the vehicle hero), generous voids, monochrome confidence, dark footer with display-scale wordmark.
- **Tripadvisor** — inverse marketing blocks dropped into a clean white page; pill buttons; a single saturated colour that earns the eye.
- **Sixt** — dark vehicle cards, spec chips, single-CTA orange (we use red), inline car-selected expansion in the results grid.

**Audience:** inbound tourists, local Lebanese renters, business travelers.

**Active redesign:** the project is currently mid-flight on the **INK & SIGNAL** redesign. See `docs/Plan/PLAN.md` for the canonical 11-phase roadmap. Phases 1–2 are shipped; phases 3–11 are the in-progress and upcoming work.

---

## 1a. Scope reminder — FRONTEND ONLY

> **This is a frontend-only engagement.** Stratagem Research is building the customer-facing web application. The backend (vehicle inventory, pricing engine, reservation persistence, internal CRM, WhatsApp Business API server, transactional email, PSP webhook handling, ops admin) lives in Wheels' internal management system and is **out of scope for this codebase**.

**What "frontend only" means in practice:**

- Build the Next.js / React app: routes, components, layouts, client interactivity, server components, SEO, accessibility, performance.
- Consume backend APIs from Wheels' internal management system. The `GET /api/...` and `POST /api/...` endpoints referenced in the implementation specs are the frontend's contract with that backend — define expected shapes in `/types/domain.ts` and call them through a thin client in `/lib/api/`.
- Integrate with **client-side SDKs** for: payment (Areeba/Stripe hosted forms or tokenization), WhatsApp `wa.me` deep-links.
- Hand off the WhatsApp Business API server, email service, PSP webhook server, database, ops admin, and any operational infrastructure to Wheels' backend team.
- During development before backend is ready, use the **mock API layer** (MSW in `/lib/api/mocks/`) that returns the shapes defined in `/types/domain.ts`. Mocks are drop-in replaceable with real endpoints once the backend is wired.

**Out of scope for this codebase:**

- Database schema or migrations.
- Server-side business logic (pricing rules, availability calculations, booking state transitions — these belong to Wheels' internal system).
- Sending transactional email or WhatsApp messages directly (the frontend triggers backend endpoints; the backend dispatches).
- PCI handling beyond using a PSP-hosted form (no raw card data ever touches our code).
- Any operations admin panel.
- Native mobile applications.

When a feature requires backend behavior that doesn't yet exist, document the expected API contract in the relevant `/docs/Implementation/NN_*.md` file under "Data requirements" and stub it in the mock layer. **Do not build backend services here.**

**Wheels Public API (Laravel).** The bridge now covers `GET /availability`, `GET /availability/{id}`, `POST /booking-request`, `GET /bookings/{reference}?email=...`, and `GET /booking-status/{public_token}`. Internal booking sync is server-to-server via `POST /api/v1/bookings/{reference}/sync-status` and must never be called from the browser. The frontend consumes the public contract behind `NEXT_PUBLIC_USE_REAL_BOOKING_API`; full contract + adapter behavior lives in [`docs/Implementation/19_backend_public_api.md`](docs/Implementation/19_backend_public_api.md), with remaining clarifications in [`docs/Integration/API_Gap_Analysis.md`](docs/Integration/API_Gap_Analysis.md).

---

## 2. Repository layout

```
Wheels Rent a Car/
├── CLAUDE.md                       ← you are here
├── app/                            ← Next.js App Router
├── components/                     ← shared components
├── lib/                            ← API client, mocks, hooks, motion variants
├── styles/tokens.css               ← design tokens (CSS variables + @theme)
├── public/images/                  ← Car Images, Hero Images, Trips Images, Logo
├── tests/e2e/                      ← Playwright @smoke specs
└── docs/
    ├── Plan/PLAN.md                ← canonical redesign roadmap (read after CLAUDE.md)
    ├── Design/
    │   ├── DESIGN.md               ← INK & SIGNAL design system (source of truth)
    │   ├── Landing Page.png        ← annotated section sketch of the home
    │   └── Design Reference/       ← Rivian / Tripadvisor / Sixt / Airbnb screenshots
    ├── Implementation/
    │   ├── README.md               ← spec library index + cross-references
    │   ├── 00_global.md            ← cross-cutting rules
    │   ├── landingpage.md          ← canonical home spec (supersedes 01_home.md)
    │   ├── 02_fleet_browse.md
    │   ├── 04_booking_flow.md      ← all 5 booking steps
    │   ├── 05_locations.md         ← single Hazmieh branch (5-branch model deprecated)
    │   ├── 06_long_term.md
    │   ├── 09_about.md
    │   ├── 10_help_faq.md
    │   ├── 11_contact.md
    │   ├── 12_account.md
    │   ├── 13_manage_booking.md
    │   ├── 14_auth.md
    │   ├── 15_legal_and_utility.md
    │   ├── 03_vehicle_detail.md    ← DEPRECATED: PDP route removed in Phase 7
    │   ├── 07_chauffeur.md         ← DESCOPED in Phase 1; spec retained for future
    │   └── 08_corporate.md         ← DESCOPED in Phase 1; spec retained for future
    └── Research/                   ← reference screenshots only (Sixt, Avis, Alamo, Kayak)
```

---

## 3. Read order — always

Before generating or modifying any UI:

1. **`docs/Plan/PLAN.md`** — current phase status. Tells you what's shipped, what's next, and which decisions are locked.
2. **`docs/Design/DESIGN.md`** — INK & SIGNAL design tokens (Geist typography, ink/paper colour ramp, pill components, no-shadow rule). Single source of truth for visual decisions.
3. **`docs/Implementation/00_global.md`** — cross-cutting rules (page shell, header, search bar, footer, WhatsApp FAB, modals, toasts, forms, buttons, accessibility, performance budgets, Lebanon-specific globals).
4. **`docs/Implementation/landingpage.md`** for `/` — supersedes the legacy `01_home.md`.
5. **The matching module file** (`docs/Implementation/NN_*.md`) for the route(s) you're building.
6. **`docs/Design/Design Reference/`** — visual references when a spec calls for a Rivian / Tripadvisor / Sixt / Airbnb pattern.

`docs/Implementation/README.md` lists every module file with build order and cross-references — start there if you don't know which file you need.

---

## 4. Non-negotiable brand rules (INK & SIGNAL)

These rules hold across the entire codebase. Violating them is a defect.

- **Geist is the only typeface.** Geist Sans for everything UI (400/500/700/800); Geist Mono for numerics. No second sans, no serif moment.
- **Headlines are UPPERCASE Geist Extra Bold (800)** with tight tracking. Sentence-case lead and body in Medium (500) and Regular (400).
- **Black is the spine.** `ink-100` (`#000000`) is the primary surface and the default `button-primary`. `paper` (`#FFFFFF`) is the canvas.
- **Red is the singular CTA.** `signal-red` (`#C8102E`) is reserved for the **single highest-conversion action per screen** — `SHOW CARS`, `SELECT`, `PAY & CONFIRM`, `NEXT`. **Never two red CTAs in the same view.** If you reach for red twice, demote one.
- **Blue is informational only.** `signal-blue` (`#0E4F94`) paints inline links inside body copy, info banners, and the "selected row" tint. Never a primary action, never decorative.
- **Pill buttons everywhere.** `rounded.pill` (9999px) on all button variants. Cards are `rounded.xl` (20px), inputs `rounded.lg` (16px), modals/sheets `rounded.3xl` (32px). **Never mix radii on the same atom.**
- **No shadow on cards.** Depth comes from **contrast and tonal layers**, not blur. The only default-shadowed card is `card-floating` (search bar, sticky booking summary). Elevation tokens exist for modals, popovers, the FAB.
- **One location.** The brand has a single physical hub: **Hazmieh Gallery Semaan, facing Sea Sweet, next to Lancaster Tamar Hotel, Beirut**. Multi-branch UI is deprecated.
- **No PDP.** The vehicle detail page is removed (Phase 7). On click, the vehicle card expands inline with booking options + WhatsApp CTA.
- **Chauffeur + Corporate are LIVE (restored in Revision 2 / Phase 12).** `/chauffeur` is a full service page with a sample-itineraries carousel that links to `/itineraries`. `/corporate` is a B2B service page with 3 tiers + enquiry form. Their module specs (`07_chauffeur.md`, `08_corporate.md`) are the source of truth.
- **WhatsApp green is locked.** `#25D366` is used only on the WhatsApp FAB and inline WhatsApp affordances. Never restyled.
- **Photography is real Lebanese settings** (Raouché, Cedars, Downtown, coastal road) in natural light. No stock cars on white backgrounds for hero work; product PNGs are acceptable inside `card-tint` containers.

If a stakeholder asks for a brand exception, push back and link them to `docs/Design/DESIGN.md` § "Do's and Don'ts".

---

## 5. Stack

- **Framework:** Next.js 16 (App Router) on TypeScript strict.
- **Styling:** Tailwind v4 with `@theme` block in `styles/tokens.css`. **Numeric spacing scale only** (`p-4`, `gap-8`, `max-w-2xl`) — naming `--spacing-{key}` keys in `@theme` clobbers the size scale (lesson learned the hard way; see Phase 1 commit `6da5bf2`).
- **Typography:** `geist` npm package via `next/font` re-exports (`GeistSans`, `GeistMono`). Drop Plus Jakarta / Inter / JetBrains Mono. Phase 3 of the redesign installs this.
- **Component primitives:** Radix UI (Popover, Dialog, Accordion, Tabs, etc.) — restyled to match INK & SIGNAL. shadcn/ui patterns where convenient.
- **Icons:** Lucide. 24×24 grid, 1.5px stroke, rounded line caps.
- **Forms:** React Hook Form + Zod for client-side validation. Inline validation on blur; submit validation scrolls to the first error.
- **State:** React Server Components for content; client components only where interactivity is needed. The booking-draft model lives in `sessionStorage` (`wheels.booking.draft`) — no global store needed.
- **API client:** thin fetch wrapper in `/lib/api/`, typed against `/types/domain.ts`.
- **Wheels Public API bridge:** `/lib/api/wheels-public/` — Zod-validated client + adapter that maps the Laravel public booking contract (availability, booking-request, lookup, status) plus server-side sync-status payload mapping to the internal contract. Engaged when `NEXT_PUBLIC_USE_REAL_BOOKING_API=true`; full spec in `docs/Implementation/19_backend_public_api.md`.
- **Mocks (dev only):** MSW in `/lib/api/mocks/` with fixtures under `/lib/api/mocks/fixtures/`. The fleet is 11 vehicles with real PNGs under `public/images/Car Images/`.
- **Hosting:** Vercel.
- **Payments (frontend integration):** Areeba primary; Stripe Elements as international fallback. Never collect raw PAN client-side.
- **Analytics:** GA4 + Meta Pixel. Server-side Conversions API is backend's concern — frontend emits `dataLayer` events with consistent names.
- **Error monitoring:** Sentry browser SDK.
- **Animation:** **framer-motion@^12** added in Phase 11 (motion layer). Variants library in `lib/motion/variants.ts`. Honours `prefers-reduced-motion`.
- **Testing:** Vitest + React Testing Library for unit + component tests; Playwright (chromium project gates CI) for end-to-end. Storage state pre-seeds consent so the cookie banner doesn't intercept clicks.

**Languages & i18n:** Phase 1 is English-only. `next-intl` is wired so AR/FR can drop in later. No hardcoded user-facing strings in components — use message catalogs in `messages/en/*`.

---

## 6. Conventions

### File organization
- Routes under `/app/` mirror the sitemap exactly.
- Module-specific components co-located with their route under `_components/`.
- Truly shared components live under `/components/` at the app root.
- Design tokens live in `/styles/tokens.css` (CSS variables + Tailwind v4 `@theme`).
- Types in `/types/`. API client in `/lib/api/`.

### Naming
- Components: `PascalCase` (e.g., `VehicleCard`, `BookingSummaryPanel`).
- Files: `PascalCase.tsx` for components, `kebab-case.ts` for utilities.
- Routes: `kebab-case` (e.g., `/long-term`, `/help/insurance-and-coverage`).
- API endpoints: `/api/{resource}/{action?}` with kebab-case.

### TypeScript
- `strict: true`. No `any` except in third-party glue with a `// TODO: type` comment.
- Prefer `type` over `interface` unless extending.
- Public component props use named exports; default exports for route components only.

### Styling
- Tailwind utility classes only. No styled-components, no CSS-in-JS.
- Use design tokens via Tailwind theme: `bg-ink-100`, `text-paper`, `rounded-xl`. Avoid arbitrary values like `bg-[#000000]`.
- For motion: CSS transitions for hover/focus; framer-motion variants in `lib/motion/variants.ts` for sequenced animations.

### Accessibility
- Semantic HTML always — `<button>`, `<a>`, `<nav>`, `<main>`, `<section>`.
- Every interactive element keyboard-reachable with a visible focus ring (`2px ink-100` outline + `4px ink-10` halo on light; inverse on dark).
- Run `pnpm lint` before every commit (eslint-plugin-jsx-a11y is wired into eslint-config-next).
- Color is never the sole carrier of information — pair red with an icon or text.

### Performance
- Lighthouse mobile targets: Perf ≥ 90, A11y ≥ 95, SEO ≥ 95 on every public route after Phase 11.
- Use `next/image` everywhere with explicit width and height. WebP/AVIF.
- Lazy-load below-the-fold; eagerly load hero LCP element.
- Code-split the booking flow steps and account routes.

### SEO
- Per-page meta + Open Graph + Twitter card.
- JSON-LD per module file's spec.
- Canonical URLs without query parameters except for paginated and category pages.

---

## 7. Lebanon-specific behaviors that must hold

These are global and apply across modules:

- **WhatsApp opt-in checkbox** on `/book/checkout`: default ON for `+961` numbers, OFF for international.
- **Phone country code** defaults to 🇱🇧 +961 if visitor IP is Lebanon; detected country otherwise.
- **Currency:** all prices in **USD**. LBP shown only as a small secondary line on the confirmation screen at the latest daily rate.
- **Cash + bank transfer + OMT/Whish** are first-class payment methods. Cash → Confirmed booking; bank transfer & OMT → Pending state until verified by ops.
- **Booking state machine** includes `pending`. See `docs/Implementation/04_booking_flow.md` for full transitions.
- **Single physical hub: Hazmieh.** Address Delivery in the LocationPicker handles anywhere in Greater Beirut (including the airport).
- **Floating WhatsApp button** is global, context-aware messages per page (templates in `00_global.md` §6).

---

## 8. Booking flow — special attention

The 5-step booking flow is **the conversion engine**. It needs more care than any other module.

- Read `docs/Implementation/04_booking_flow.md` end-to-end before touching it.
- Funnel state survives page refresh via `sessionStorage` keyed `wheels.booking.draft`.
- Pricing is recomputed at every step entry; if it changes by > 1%, surface a non-blocking toast at step 4.
- Vehicle availability is rechecked on every step entry; if the car is gone, redirect to step 1 with a toast.
- The hold timer (24:00 countdown) at step 4 recomputes pricing on expiry.
- Mobile UX uses a sticky bottom action bar showing Total + the singular CTA; the summary panel becomes a bottom sheet.
- Always test the four payment paths: Card, Cash, Bank transfer (with file upload), OMT.

---

## 9. Definition of done (per phase)

A phase is done when:

- [ ] All page sections in the affected specs render correctly at xs (360px), sm, md, lg, xl breakpoints.
- [ ] All states & edge cases listed in the spec behave correctly.
- [ ] Lighthouse mobile: Perf ≥ 90, A11y ≥ 95, SEO ≥ 95.
- [ ] axe-core passes with zero serious or critical violations.
- [ ] All copy comes from i18n message catalogs (no hardcoded strings in components).
- [ ] Components co-located, reused, not duplicated.
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e:smoke --project=chromium` all green.
- [ ] Commit message format `Phase N — <title>`; description includes screenshots at xs and lg widths.

For the booking flow specifically:
- [ ] All 5 steps complete end-to-end with each payment method.
- [ ] Booking state machine transitions correctly (Confirmed for Card/Cash, Pending for Transfer/OMT).
- [ ] State persists across refresh.

---

## 10. Things you should NOT do

- Don't introduce a second typeface. **Geist or nothing.**
- Don't use sentence-case headlines. **Headlines are UPPERCASE.**
- Don't put two red CTAs on the same screen.
- Don't add shadow to cards (except `card-floating`).
- Don't decorate with red or blue — they are signals, not paint.
- Don't write inline styles or arbitrary Tailwind values when a token exists.
- Don't define `--spacing-{name}` keys in Tailwind v4's `@theme` block (it clobbers the `max-w-{key}` scale; see Phase-1 fix `6da5bf2`).
- Don't bypass the booking state machine — Pending bookings exist for a reason.
- Don't hide or remove the floating WhatsApp button on any non-checkout page.
- Don't ship copy in English-only strings hardcoded in components — use the message catalog.
- Don't collect raw card PAN — payments must go through Areeba/Stripe-hosted forms or tokenization.
- Don't change the booking-ref format — it's `WRC-YYMMDD-XXXX`, nothing else.
- Don't introduce a global state manager (Redux, Zustand, etc.) — RSC + the booking-draft `sessionStorage` model is sufficient.
- Don't reintroduce the vehicle detail page (`/vehicles/[slug]`) — it's removed in Phase 7. Clicks expand the card inline.
- Don't reintroduce multi-branch UI — the brand has one location (Hazmieh).
- **Don't ship the admin dashboard (`/admin/*`) to production as-is.** The credential check, session, and persistence layer are all staging-only — see `docs/Implementation/18_admin.md` § "Swap-in path" for what must be replaced first (real auth endpoint, HttpOnly cookie, CSRF, audit logging, real backend store).
- Don't change the hardcoded admin credentials (`admin` / `admin123`) without coordinating with the client — they may be in screenshots / demo decks.
- **Don't build backend services in this codebase.** Database, business logic, webhooks, transactional dispatchers (email, WhatsApp), and the ops admin are out of scope.
- Don't hardcode mock data into components — mocks live in `/lib/api/mocks/`, behind the same client interface as the real API. Admin-managed content (trips, itineraries, FAQs, corporate tiers) goes through `lib/admin/store.ts`.

---

## 11. When you don't know what to do

Order of escalation:

1. **Check `docs/Plan/PLAN.md`.** The canonical redesign roadmap tells you what's shipped, what's next, and the decisions locked.
2. **Check the relevant module spec** in `docs/Implementation/NN_*.md`. Almost every UI question is answered there.
3. **Check `00_global.md`.** Cross-cutting rules live here.
4. **Check `docs/Design/DESIGN.md`.** Visual decisions resolve to tokens.
5. **Check `docs/Design/Design Reference/`.** Visual references when a spec calls for a Rivian / Tripadvisor / Sixt / Airbnb pattern.
6. **Ask Marc** before inventing a new pattern. Consistency matters more than cleverness.

---

## 12. How to update these specs

When the product changes:

- **Token change** (color, type, spacing): edit `docs/Design/DESIGN.md` only. All implementation files reference tokens by name.
- **Module change** (a section added or behavior changed): edit the relevant `docs/Implementation/NN_*.md`. Keep the section template intact (Purpose → Page sections → Components → Edge cases → Data → SEO → Acceptance).
- **Cross-cutting change** (new global modal type, new payment method, new page-shell behavior): edit `docs/Implementation/00_global.md` and update affected modules.
- **New module** (new top-level page): create a new `NN_*.md` following the same template, update `docs/Implementation/README.md` and the sitemap in the PRD.
- **Plan change** (re-phase, scope shift): edit `docs/Plan/PLAN.md` — that's the canonical roadmap.
- **Always update the README index** when you add or remove a module file.

---

## 13. Project metadata

- **Owner:** Stratagem Research — Marc Khamis (`marc@stratagemresearch.co`)
- **Client:** Wheels Rent A Car (Lebanon)
- **Single physical location:** Hazmieh Gallery Semaan, facing Sea Sweet, next to Lancaster Tamar Hotel, Beirut.
- **Phase:** Customer-facing site, English-only. INK & SIGNAL redesign in progress (Phases 1–2 shipped; Phases 3–11 ahead).
- **Brand colours:** `ink-100` (`#000000`) is the spine. `paper` (`#FFFFFF`) is the canvas. `signal-red` (`#C8102E`) used ONCE per screen for the singular CTA. `signal-blue` (`#0E4F94`) for info + selected.
- **Live legacy site (data only, not design):** https://wheelsrentacar.com.lb
- **GitHub:** `marckhamis/wheels-rent-a-car` (private). Push to `main`; CI runs typecheck + lint + unit + smoke chromium.
- **Spec versions:** PRD v1.0 · DESIGN.md (INK & SIGNAL, alpha) · landingpage.md v1.0.

---

**One sentence summary for any new agent reading this file:**

> Build the **frontend** of a bold, sleek, monochrome car-rental website in Next.js 16 + Tailwind v4 + Geist, INK & SIGNAL design system, single red CTA per screen, no shadows on cards except `card-floating`, single Hazmieh location, no PDP, no chauffeur/corporate — by reading `docs/Plan/PLAN.md` for the current phase, then `docs/Design/DESIGN.md` and the matching `docs/Implementation/*.md` module file, and never invent what already exists or build backend services that don't belong here.
