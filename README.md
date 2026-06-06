# Wheels Rent A Car — frontend

Customer-facing Next.js application for [Wheels Rent A Car (Lebanon)](https://wheelsrentacar.com.lb). Phase 1, English-only, backend.

> **Specs are the contract.** Before changing anything UI, read `/docs/Implementation/00_global.md` and the matching module file. Tokens come from `/docs/Design/DESIGN.md`. The sprint plan that built this codebase lives at `/docs/Plan/PLAN.md`.

## Stack

| Layer       | Choice |
| ----------- | --------------------------------------------- |
| Framework   | Next.js 16 (App Router, Turbopack) |
| Runtime     | React 19, TypeScript 6 (`strict`) |
| Styling     | Tailwind v4 + design-token CSS variables |
| Primitives  | Radix UI + custom restyles |
| Forms       | React Hook Form + Zod |
| State       | RSC + `sessionStorage` booking-draft (no Redux/Zustand) |
| i18n        | next-intl (single locale in Phase 1) |
| Mocks       | MSW v2 (browser worker) |
| Tests       | Vitest + React Testing Library + Playwright + axe-core |
| Errors      | Sentry (`@sentry/nextjs`) — env-gated |

## Quickstart

```bash
# Node 22+ required (Vercel build target)
pnpm install
pnpm dev                # → http://localhost:3000
```

The first dev boot installs the MSW service worker into `/public/mockServiceWorker.js`. All `fetch('/api/...')` calls are intercepted by handlers in `lib/api/mocks/handlers.ts` against fixtures in `lib/api/mocks/fixtures/`.

## Useful scripts

| Command              | What it does |
| -------------------- | ---------------------------------------- |
| `pnpm dev`           | Dev server with Turbopack + MSW |
| `pnpm build`         | Production build |
| `pnpm start`         | Serve the production build |
| `pnpm typecheck`     | `tsc --noEmit` |
| `pnpm lint`          | ESLint (flat config, eslint-config-next + a11y) |
| `pnpm test`          | Vitest run (unit + component tests) |
| `pnpm test:watch`    | Vitest watch |
| `pnpm test:e2e`      | Playwright full suite |
| `pnpm test:e2e:smoke`| Playwright `@smoke` tests only |
| `pnpm format`        | Prettier write |
| `pnpm format:check`  | Prettier check (CI gate) |

## Environment variables

Copy `.env.example` → `.env.local`. None are strictly required for local dev (the app degrades gracefully when keys are missing).

| Var                                | Purpose |
| ---------------------------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`             | Sitemap + canonical URLs. Defaults to `http://localhost:3000`. |
| `NEXT_PUBLIC_MOCK_API`             | Set `"false"` to bypass MSW and hit the real backend at `NEXT_PUBLIC_API_BASE_URL`. Default ON in dev. |
| `NEXT_PUBLIC_API_BASE_URL`         | Prefix for real backend calls when mocks are off. |
| `NEXT_PUBLIC_WHEELS_API_BASE_URL`  | Wheels Laravel public API base. Defaults to the test URL. |
| `NEXT_PUBLIC_USE_REAL_BOOKING_API` | `"true"` makes booking handlers delegate to the real Laravel public API (availability/submit/lookup/status) via the integration layer. |
| `NEXT_PUBLIC_SUPABASE_URL`         | Supabase project URL (public). |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable anon key (public). |
| `WHEELS_INTERNAL_API_BASE_URL`     | Server-only base URL for Wizard internal sync endpoint (`/api/v1/...`). |
| `WHEELS_INTERNAL_API_TOKEN`        | Server-only bearer token for internal sync endpoint. |
| `SUPABASE_SERVICE_ROLE_KEY`        | Server-only Supabase service role key for trusted backend jobs. |
| `DATABASE_URL`                     | Website-owned Postgres connection URL (Supabase). |
| `WHISH_CHANNEL`                    | Whish merchant channel id (server-only). |
| `WHISH_SECRET`                     | Whish merchant secret (server-only). |
| `WEBSITE_URL`                      | Canonical base URL used for callback/redirect URLs. |
| `RUN_LIVE_API_TESTS`               | `"1"` un-skips `tests/integration/wheels-public.live.test.ts`. Off by default. |
| `NEXT_PUBLIC_MAINTENANCE_MODE`     | `"true"` routes every request to `/maintenance` (admin cookie `wheels.admin=1` bypasses). |
| `NEXT_PUBLIC_SENTRY_DSN`           | Browser Sentry DSN. Empty = no error reporting. |
| `SENTRY_DSN`                       | Server Sentry DSN. |
| `SENTRY_AUTH_TOKEN`                | For source-map upload in CI. |
| `NEXT_PUBLIC_GA4_ID`               | GA4 measurement ID. Empty = no analytics. |
| `NEXT_PUBLIC_META_PIXEL_ID`        | Meta pixel id. |

## Project layout

```
app/
  (marketing)/    customer-facing routes (home, /vehicles, locations, trips, itineraries, services, content)
  (booking)/      slim funnel shell — /book/* steps + confirmation
  (auth)/         centred-card login/register/forgot/reset
  (account)/      gated dashboard + bookings + profile + documents + saved
  admin/          staging CMS (trips, itineraries, FAQs, corporate tiers) — harden before production
  dev/components  internal QA route (every primitive in every state; not linked from the site)
  api/            Route handlers (auth, leads, Whish payments, wizard sync, notifications)
  sitemap.ts      Next metadata sitemap
  robots.ts       Next metadata robots
  global-error.tsx, error.tsx, not-found.tsx, maintenance/

components/
  ui/             primitives (Button, Card, Modal, Sheet, Input, Select, Chip, DatePopover…)
  shell/          Header, Footer, PromoStrip, WhatsAppFab, AuthCluster
  search/         SearchBar, LocationPicker, HeroSearchTabs
  vehicle/        VehicleCard, VehicleCardExpanded, FilterSidebar (filter sheet — wire-up pending)
  booking/        Stepper, FlowSummaryPanel, AddOnRow, ProtectionTierCard, HoldTimer,
                  PaymentMethodSelector, ConfirmationStatusBlock, SaveAndExitModal
  account/        AuthCard, BookingHistoryRow, BookingDetailPanel, BookingActionModals,
                  BookingLookupForm, DocumentVaultCard, PasswordStrengthIndicator
  landing/        CategoryWordmarkCard, InversePromoBlock, DestinationTile, ReviewCard, ItineraryCard
  locations/      LocationsMap, HowItWorksRow
  marketing/      TierCardLongTerm, TierCardCorporate, ServiceCategoryCard, ItineraryCard,
                  ValuePropTile, ComparisonTable
  leads/          EnquiryFormLongTerm, EnquiryFormChauffeur, EnquiryFormCorporate, SuccessState
  help/           TocSidebar, LegalArticleLayout, LegalArticle, HelpSearchBar, FaqAccordion
  about/          StatStrip, TeamCard
  contact/        ChannelCard, ContactForm
  consent/        CookieBanner, NewsletterPopup
  admin/          AdminSidebar, AdminPageShell, AdminDataTable, AdminFormShell, TripForm, ItineraryForm
  motion/         Reveal (framer-motion wrapper; honours prefers-reduced-motion)

lib/
  api/            typed fetch wrapper + endpoint catalog
  api/mocks/      MSW worker + handlers + fixtures
  api/wheels-public/  Laravel public booking client + adapters (when real API is on)
  admin/          server-session auth helpers + Supabase-backed store + useAdminStore hooks
  auth/           session helpers + Supabase user mapping
  booking/        pricing engine, calendar helpers, .ics generator, ref helpers
  search/         search criteria types + persistence
  vehicles/       filter logic + category labels
  motion/         framer-motion variants + useMotionGate
  content/        about + help + legal article copy (TypeScript modules)
  analytics/      dataLayer push + event constants + consent gating
  supabase/       browser + server + admin Supabase clients
  whatsapp.ts     wa.me deep-link helpers + per-page context messages
  utils.ts        cn() className helper

hooks/            useBookingDraft, useSession, useLastSearch
types/domain.ts   single source of truth for every API shape
messages/en.json  i18n catalog (wired; most UI copy still inline until migration)
proxy.ts          auth gating + maintenance-mode rewrite + admin noindex
```

## Mock backend

The "API" is MSW. Handlers live in `lib/api/mocks/handlers.ts` and bind fixtures from `lib/api/mocks/fixtures/`. To make the app talk to a real backend:

1. Set `NEXT_PUBLIC_MOCK_API=false`.
2. Set `NEXT_PUBLIC_API_BASE_URL=https://your-backend.example.com`.
3. The typed client in `lib/api/client.ts` prefixes every request path — no code changes elsewhere.

Toggle failure modes during development by appending `?mock-error=500` (or `404`) to any URL.

## Real backend wiring (Wheels Public + Internal Sync)

The Laravel public contract now includes `availability`, `availability/{id}`, `booking-request`, booking lookup by reference+email, and booking status by public token. When `NEXT_PUBLIC_USE_REAL_BOOKING_API=true`, the booking handlers in `lib/api/mocks/handlers.ts` delegate to that API through `lib/api/wheels-public/`. Internal `sync-status` is server-to-server only and uses `WHEELS_INTERNAL_API_BASE_URL` + `WHEELS_INTERNAL_API_TOKEN`. Full spec, adapter rules, and runbook are in `docs/Implementation/19_backend_public_api.md`. Use `./scripts/wheels-api-smoke.sh` for ad-hoc curl probes and `RUN_LIVE_API_TESTS=1 pnpm test -- tests/integration/wheels-public.live.test.ts` for live integration tests.

## Secret safety

- Treat all credentials as compromised once shared in chat/email; rotate immediately.
- Keep populated `.env*` files out of git.
- Never expose server-only keys in client code:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `WHEELS_INTERNAL_API_TOKEN`
  - `WHISH_SECRET`

## Testing

- **Unit**: `pnpm test` — runs Vitest across `components/`, `lib/`, `app/`. Spec files end with `.test.ts(x)`.
- **E2E**: `pnpm test:e2e` (full) or `pnpm test:e2e:smoke` (the `@smoke` subset). Chromium + Pixel 7 projects. Playwright auto-boots `pnpm dev` for you.
- **A11y**: axe-core is wired into the Playwright dependency tree; module-level scans land in Sprint-11 polish.

## CI

`.github/workflows/ci.yml` runs on every PR + push to `main`:

1. `quality` job — format check → lint → typecheck → unit tests.
2. `e2e` job — build → install Chromium → run `@smoke` Playwright specs.

Pnpm version comes from `package.json#packageManager`; do **not** also pass `version:` to `pnpm/action-setup` (the action errors on duplicates).

## Deployment

Built for Vercel. Push to `main` → Vercel deploys. Required environment in Vercel project settings:

- `NEXT_PUBLIC_SITE_URL` — production origin (`https://wheels.example.com`).
- `NEXT_PUBLIC_MOCK_API` — `false` once the real backend is live.
- `NEXT_PUBLIC_API_BASE_URL` — the real backend URL.
- Sentry envs as documented above.

## Conventions

- **One red CTA per screen.** The `cta` Button variant is reserved for the highest-conversion action on the route.
- **Tokens, not hex.** Every visual decision resolves to `styles/tokens.css`. No `bg-[#…]` arbitrary values.
- **No external Wizard backend services in this repo.** Website-owned persistence/auth/services live here; Wizard-owned booking internals stay external.
- **Definition of done** per `CLAUDE.md §9` applied before every merge.

## License

Private — Stratagem Research build for Wheels Rent A Car SAL.
