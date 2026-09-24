# 18 — Admin Dashboard

> Routes: `/admin/*`
> Depends on: `16_trips.md`, `17_itineraries.md`, `10_help_faq.md`, `08_corporate.md`
> Related: PRD §6.15, `lib/admin/auth.ts`, `lib/admin/store.ts`
> Status: **Production-track.** Auth is server-session based (signed HttpOnly
> cookies, CSRF, audit logging) and storage is Supabase-backed — neither is a
> placeholder. See "Remaining hardening before production" for the punch list
> that's still open.

## Purpose & success criteria

The admin dashboard added in Revision 2 (Phase 12) gives Wheels a self-serve content-management surface for the four dynamic content surfaces on the customer site:

1. **Trips** (self-drive blog) — articles surfacing on the homepage Explore Lebanon carousel and `/trips`.
2. **Itineraries** (chauffeur-led tours) — items on the `/chauffeur` sample-itineraries carousel and `/itineraries`.
3. **FAQs** — sections + questions on `/help/faq` (and the central source for any other FAQ touchpoints).
4. **Corporate** — tier comparison + inclusions on `/corporate`.

Current implementation:
- Authentication is server-session based via `/api/admin/sessions` and signed cookies from `lib/server/admin-auth.ts`.
- Password and session secret are environment-driven (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`) with no fallback defaults.
- Persistence is Supabase-backed via `lib/admin/store.ts` -> `/api/cms/*` routes.
- Public pages read from `useAdminStore` hooks and reflect writes after CMS events/refetch.
- `proxy.ts` adds `X-Robots-Tag: noindex, nofollow` on every `/admin/*` route so crawlers never see the editor.

The auth and store layers above are already real — there is no separate backend swap-in required. Before production launch, work through the punch list in "Remaining hardening before production" below.

## Routes

| URL | Purpose |
| --- | --- |
| `/admin/login` | Sign-in form. Credentials validated server-side via `/api/admin/sessions`. Already-signed-in visitors auto-redirect to `/admin`. |
| `/admin` | Dashboard home. 4 quick-action tiles + live counts from each resource. |
| `/admin/trips` | List view with table + actions (Edit / Delete) + "New trip" + "Reset to defaults". |
| `/admin/trips/new` | Empty `<TripForm />`. |
| `/admin/trips/[slug]` | `<TripForm />` pre-loaded with the existing trip. Slug field disabled on edit. |
| `/admin/itineraries` | List view, same shape as Trips. |
| `/admin/itineraries/new` | Empty `<ItineraryForm />`. |
| `/admin/itineraries/[slug]` | `<ItineraryForm />` pre-loaded. |
| `/admin/faqs` | Two-pane editor: sections (left) + questions inside the active section (right). Inline add / rename / delete on both. |
| `/admin/corporate` | Multi-tier editor with per-tier inclusions repeater. Save / Discard / Reset to defaults. |
| `/admin/contact` | Site-wide contact channels: the phone and WhatsApp numbers used by every `tel:` link, `wa.me` deep-link, booking email footer, and JSON-LD `telephone` on the customer site. Singleton settings row; `GET`/`PUT /api/admin/contact`. |

## Page sections

### Shell

Every authenticated admin page is wrapped in `app/admin/(authenticated)/layout.tsx`:
- Left sidebar (`<AdminSidebar />`) on lg+: ink-100 surface, Wheels / Admin lock-up at top, nav pills below (Dashboard · Trips · Itineraries · FAQs · Corporate), sign-out at the bottom.
- Mobile top bar (`<AdminMobileBar />`) on sm/md: section name + icon nav + sign-out icon.
- Main content area `bg-ink-05` for subtle contrast from the paper cards.

### Page shell

`<AdminPageShell />` provides the standard header for each page:
- Optional back link.
- Eyebrow + title + description.
- Right-side `actions` slot for primary buttons.

### Data table

`<AdminDataTable />` is a thin typed table primitive (paper card + 1px border, no shadow). Columns declared per-row; right-aligned `rowActions` slot for icon buttons.

### Form shell

`<AdminFormShell />` is the standard paper card with title + helper + children + sticky-footer action row.

### Form components

- `<TripForm />` — fields: slug · title · region · suggested-vehicle-category · meta · tags · excerpt · cover-image (src + alt) · published-date · body (Markdown). Saves to `writeTrips()`.
- `<ItineraryForm />` — fields: slug · title · category · vehicle-class · duration · price-from-USD · excerpt · cover-image · highlights (repeater) · schedule (repeater with time + title + body). Saves to `writeItineraries()`.

## States & edge cases

| Scenario | Behaviour |
| --- | --- |
| Unauthenticated visit to any `/admin/*` (other than `/admin/login`) | Proxy redirect to `/admin/login`. |
| Missing admin env (`ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET`) | Login/session calls fail until env is populated. |
| Duplicate slug on create | Inline form error: "That slug already exists. Choose another." |
| Slug edit on existing record | Slug input is `disabled` to prevent breaking inbound links. |
| Delete confirmation | Native `confirm()` prompt. (Replace with `<Modal />` in production.) |
| Reset to defaults | `confirm()`-gated; clears CMS table rows and reseeds fixture defaults server-side. |
| API/store failure | Route handlers return structured 4xx/5xx responses surfaced in form errors. |
| Cross-tab admin edits | `wheels:cms-updated` + refetch path keeps pages in sync. |

## Data requirements

All four resources share the same client wrapper in `lib/admin/store.ts`, backed by API routes:
```
fetchTrips() / writeTrips()
fetchItineraries() / writeItineraries()
fetchFaqs() / writeFaqs()
fetchCorporateTiers() / writeCorporateTiers()
```

Contact settings are a singleton rather than a list, so they sit outside that
wrapper: `getContactSettings()` / `replaceContactSettings()` in
`lib/supabase/admin-repository.ts`, table `contact_settings` (row id
`default`), seeded by `supabase/migrations/20260924_000001_contact_settings.sql`.
The customer site reads them through `getPublicContactSettings()` in
`lib/server/public-content.ts`, which falls back to
`DEFAULT_CONTACT_SETTINGS` (`lib/contact/settings.ts`) if the table is
missing or Supabase is unreachable.

Data persistence/repository layer:
- API routes: `app/api/cms/{trips|itineraries|faqs|corporate}/route.ts`
- Supabase repository: `lib/supabase/cms-repository.ts`
- Admin audit logging: `lib/supabase/admin-repository.ts`

## Remaining hardening before production

1. Enforce secure admin env provisioning in deployment (`ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`) and rotate regularly.
2. Keep CSRF validation mandatory on every mutating admin route.
3. Add rate limiting and lockout policy on `/api/admin/sessions`.
4. Replace native `confirm()` with modal confirmations for destructive actions.
5. Add richer admin audit logs (request IDs, IP/UA attribution, mutation diff payloads).
6. Execute and archive staging RLS negative tests (`scripts/rls-negative-tests.sql`).
7. Add content backup/export workflow before bulk replace operations.

## Acceptance criteria

- [ ] `/admin/login` validates via `/api/admin/sessions` and sets a signed session cookie.
- [ ] Sign-out clears server session cookies and bounces to `/admin/login`.
- [ ] `/admin` dashboard shows live counts (trips, itineraries, FAQ sections + total questions, corporate tiers).
- [ ] Creating, editing, deleting a Trip from `/admin/trips` reflects on the homepage Explore Lebanon carousel + `/trips` listing + `/trips/[slug]` without a reload.
- [ ] Creating, editing, deleting an Itinerary reflects on the `/chauffeur` carousel + `/itineraries` listing + `/itineraries/[slug]`.
- [ ] FAQ section + question CRUD reflects on `/help/faq`.
- [ ] Corporate tier CRUD reflects on `/corporate`.
- [ ] `curl -I /admin/login` shows `X-Robots-Tag: noindex, nofollow`.
- [ ] Reset flows restore seeded fixture rows through the CMS repository layer.
