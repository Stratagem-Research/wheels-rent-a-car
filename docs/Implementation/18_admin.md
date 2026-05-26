# 18 — Admin Dashboard

> Routes: `/admin/*`
> Depends on: `16_trips.md`, `17_itineraries.md`, `10_help_faq.md`, `08_corporate.md`
> Related: PRD §6.15, `lib/admin/auth.ts`, `lib/admin/store.ts`
> Status: **Staging only.** Replace before production.

## Purpose & success criteria

The admin dashboard added in Revision 2 (Phase 12) gives Wheels a self-serve content-management surface for the four dynamic content surfaces on the customer site:

1. **Trips** (self-drive blog) — articles surfacing on the homepage Explore Lebanon carousel and `/trips`.
2. **Itineraries** (chauffeur-led tours) — items on the `/chauffeur` sample-itineraries carousel and `/itineraries`.
3. **FAQs** — sections + questions on `/help/faq` (and the central source for any other FAQ touchpoints).
4. **Corporate** — tier comparison + inclusions on `/corporate`.

This is **demo-grade**:
- Authentication is a hardcoded `admin / admin123` checked client-side against constants in `lib/admin/auth.ts`. The session lives in `sessionStorage`.
- Persistence is `localStorage` via `lib/admin/store.ts`. There is no real database.
- Public pages read from the same store via `useAdminStore` hooks, so admin writes reflect live with no reload.
- Middleware adds `X-Robots-Tag: noindex, nofollow` on every `/admin/*` route so crawlers never see the editor.

Before production launch, replace the auth + store layer with the real backend (see "Swap-in path" below).

## Routes

| URL | Purpose |
| --- | --- |
| `/admin/login` | Sign-in form. Hardcoded `admin / admin123`. Already-signed-in visitors auto-redirect to `/admin`. |
| `/admin` | Dashboard home. 4 quick-action tiles + live counts from each resource. |
| `/admin/trips` | List view with table + actions (Edit / Delete) + "New trip" + "Reset to defaults". |
| `/admin/trips/new` | Empty `<TripForm />`. |
| `/admin/trips/[slug]` | `<TripForm />` pre-loaded with the existing trip. Slug field disabled on edit. |
| `/admin/itineraries` | List view, same shape as Trips. |
| `/admin/itineraries/new` | Empty `<ItineraryForm />`. |
| `/admin/itineraries/[slug]` | `<ItineraryForm />` pre-loaded. |
| `/admin/faqs` | Two-pane editor: sections (left) + questions inside the active section (right). Inline add / rename / delete on both. |
| `/admin/corporate` | Multi-tier editor with per-tier inclusions repeater. Save / Discard / Reset to defaults. |

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
| Unauthenticated visit to any `/admin/*` (other than `/admin/login`) | Client-side redirect to `/admin/login`. |
| Wrong credentials | Inline `ErrorText` on the login form: "Invalid username or password." |
| Duplicate slug on create | Inline form error: "That slug already exists. Choose another." |
| Slug edit on existing record | Slug input is `disabled` to prevent breaking inbound links. |
| Delete confirmation | Native `confirm()` prompt. (Replace with `<Modal />` in production.) |
| Reset to defaults | `confirm()`-gated; clears the localStorage key so the next read falls back to the seeded fixture. |
| Local storage full / disabled | Writes silently no-op; demo recommendation is to use a regular browser profile, not in-private. |
| Cross-tab admin edits | `storage` event fires on the other tab; public pages and admin lists re-render with the new value. |

## Data requirements

All four resources share the same store wrapper in `lib/admin/store.ts`:
```
readTrips() / writeTrips() / resetTrips()
readItineraries() / writeItineraries() / resetItineraries()
readFaqs() / writeFaqs() / resetFaqs()
readCorporateTiers() / writeCorporateTiers() / resetCorporateTiers()
resetAll()
```

localStorage keys:
```
wheels.admin.trips
wheels.admin.itineraries
wheels.admin.faqs
wheels.admin.corporate
```

Each `read*()` falls back to its seeded fixture from `lib/api/mocks/fixtures/{content,catalog}.ts` if the key is empty.

## Swap-in path (production)

Replace, in order:

1. **`lib/admin/auth.ts`** — `signIn()` calls real `POST /api/admin/sessions`; server issues HttpOnly cookie; `signOut()` calls `DELETE /api/admin/sessions`; `isSignedIn()` becomes server-side via `cookies()` in a server component / middleware.
2. **`middleware.ts`** — extend the `/admin` block to enforce auth at the edge (redirect to `/admin/login` when the session cookie is missing).
3. **`lib/admin/store.ts`** — replace each `read*()` with a typed `fetch()` against the backend, `write*()` with POST/PUT, `reset*()` with admin-only DELETE.
4. **`useAdminStore.ts`** — swap the `storage` event subscription for React Query (or SWR) cache invalidation.
5. **CSRF protection** on every write.
6. **Audit logging** on every admin mutation.
7. **Modal-based confirmation** instead of native `confirm()`.
8. **Rich-text editor** (TipTap or Lexical) on the Body field in TripForm — Markdown is fine for staging, but a WYSIWYG is friendlier for non-technical authors.

## Acceptance criteria

- [ ] `/admin/login` accepts `admin / admin123`; everything else fails inline.
- [ ] Sign-out clears sessionStorage and bounces to `/admin/login`.
- [ ] `/admin` dashboard shows live counts (trips, itineraries, FAQ sections + total questions, corporate tiers).
- [ ] Creating, editing, deleting a Trip from `/admin/trips` reflects on the homepage Explore Lebanon carousel + `/trips` listing + `/trips/[slug]` without a reload.
- [ ] Creating, editing, deleting an Itinerary reflects on the `/chauffeur` carousel + `/itineraries` listing + `/itineraries/[slug]`.
- [ ] FAQ section + question CRUD reflects on `/help/faq`.
- [ ] Corporate tier CRUD reflects on `/corporate`.
- [ ] `View page source` on `/admin` shows `X-Robots-Tag: noindex, nofollow` in the response headers (test via `curl -I`).
- [ ] Resetting any resource brings back the seeded fixture.
