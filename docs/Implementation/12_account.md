# 12 — Account

> Routes: `/account`, `/account/bookings`, `/account/bookings/[ref]`, `/account/profile`, `/account/documents`, `/account/saved-vehicles`
> Depends on: `00_global.md`, `04_booking_flow.md`, `14_auth.md`
> Related: PRD §6.12
> Primary persona: Returning users (frequent renters, business travelers)

---

## Purpose & success criteria

The Account area lives **only behind authentication**. It accelerates repeat bookings (pre-filled driver info, saved licence) and gives users a single place to manage existing reservations.

Account creation is optional throughout the funnel — no one is forced into an account. But returning users save real time.

**Success looks like:**
- ≥ 25% of confirmed bookings convert to an account (1-click create).
- Returning-user checkout time < 60s (vs guest 90s).
- Booking management actions (modify, cancel) ≥ 80% completed self-serve.

---

## Layout — account shell

All account pages share a 2-column layout on desktop.

```
┌── Header (with avatar dropdown when signed in) ────────────────┐
└────────────────────────────────────────────────────────────────┘
┌──────────────────┬─────────────────────────────────────────────┐
│  ACCOUNT NAV     │   PAGE CONTENT                              │
│  ⓘ Dashboard    │                                             │
│  📅 My bookings │                                             │
│  👤 Profile     │                                             │
│  📄 Documents   │                                             │
│  ❤ Saved cars   │                                             │
│                  │                                             │
│  ───────────     │                                             │
│  Sign out        │                                             │
└──────────────────┴─────────────────────────────────────────────┘
```

- **Left rail:** sticky nav, 240px wide. List items use the `list-item` token. Active route uses `colors.primary-95` background + `colors.primary-40` text.
- **Right column:** page-specific content, max-width 880px.
- **Mobile:** left rail collapses to a horizontal pill nav at the top of the page; sticky on scroll.

---

## /account — Dashboard

The landing page after sign-in.

### Page sections

#### 1. Greeting

`headline-lg`: "Hi, [First name]." Subhead `body-md`: "Here's what's coming up."

#### 2. Upcoming booking card (if any)

- Large card, `card-elevated`, 24px padding.
- Vehicle thumbnail + model + ref + countdown ("Pickup in 2 days").
- Pickup location + date + time.
- 3 quick actions: `View details` (primary), `Modify` (secondary), `Add to calendar` (tertiary).

#### 3. Quick actions

3-up row of small cards:
- "Browse cars" → `/vehicles`.
- "Manage documents" → `/account/documents`.
- "Update profile" → `/account/profile`.

#### 4. Recent bookings

A short list of the 3 most recent past bookings (compact rows). "View all" link → `/account/bookings`.

#### 5. Footer

Global footer.

### Empty state

If no upcoming bookings:
- Illustration + headline "No upcoming trips."
- Body: "Ready for your next drive?"
- CTA: `Browse cars` (primary).

---

## /account/bookings — Booking history

### Page sections

#### 1. Heading + filter

- `headline-lg`: "My bookings".
- Filter chips: All · Upcoming · Pending · Completed · Cancelled.

#### 2. Booking list

Each row is a card with:
- Status badge (left): `Confirmed` · `Pending` · `Completed` · `Cancelled`.
- Vehicle thumbnail + model.
- Pickup → Return summary line.
- Reference (`mono-md`).
- Total.
- Actions (right): `View details` (tertiary).

#### 3. Pagination

10 per page.

### Empty state

"No bookings yet." → `Browse cars`.

---

## /account/bookings/[ref] — Booking detail

The most-used page in the account area. Full booking detail with all actions.

### Page sections

#### 1. Status block

- Large status badge + headline ("Confirmed", "Pending verification", "Completed", "Cancelled").
- Reference + copy button.
- Countdown if upcoming ("Pickup in 2 days, 4 hours").

#### 2. Vehicle + itinerary

Same layout as the confirmation page (`04_booking_flow.md`):
- Left: vehicle thumbnail + pickup + return + add-ons + protection + driver.
- Right: total, payment method, deposit info.

#### 3. Actions

Sticky bottom bar (or right rail):
- `Add to calendar`
- `View invoice` (PDF)
- `Modify booking` (opens modify flow)
- `Cancel booking` (opens cancellation flow with refund preview)
- `Chat on WhatsApp` (links to a thread tagged with this ref)

#### 4. Important info / damages

- Section showing important rental terms specific to this booking.
- For Completed bookings: any damage records (read-only) with photos.
- For Pending bookings: clear next steps ("Upload your transfer proof", "Pay at OMT before [date]").

### Edit / cancel modals

#### Modify modal

- Allows changing pickup/return time (within policy: free up to 7 days before pickup).
- Recomputes pricing live; user confirms before applying.
- Adding/removing add-ons or changing protection requires re-checkout for differential payment.

#### Cancel modal

- Shows refund preview based on policy (`/help/cancellation-policy`).
- 2-step confirm: warning, then explicit confirm.
- On confirm: status flips to Cancelled; refund is initiated; email sent.

---

## /account/profile — Profile

Single-column form, max-width 560px.

### Sections

- **Personal info:** First name, Last name, Email (with verify badge), Mobile (with WhatsApp opt-in).
- **Date of birth:** read-only after first save (used for driver-age validation).
- **Country of residence.**
- **Password:** "Change password" tertiary link → opens modal.
- **Marketing preferences:** toggles for product updates and promotions.
- **Delete account:** danger-style tertiary link at the bottom → opens confirm modal with email verification.

Submit: `Save changes` `button-primary` blue.

---

## /account/documents — Documents

A vault for the driver's licence and ID. Once uploaded, all future bookings pre-fill from here.

### Sections

#### 1. Driver's licence

Card with current licence on file (number, issue date, expiry, issuing country, scan thumbnail). Edit and Replace buttons.

If no licence on file: empty state with `Upload licence` CTA, opens upload modal.

#### 2. ID / Passport

Same pattern. Lebanese residents (`country === LB`) see **National ID card** (front + back). Other nationalities see **Passport** (photo page). Checkout at `/book/checkout` uses the same rule and pre-fills from this vault.

#### 3. Verification status

Each document has a status badge: `Pending review` (amber), `Verified` (green), `Expired` (red).

#### 4. Upload modal

- Drop-zone (per global form rules) for image/PDF.
- File preview with remove option.
- Form fields under: doc number, issue date, expiry, issuing country.
- `Save document` `button-primary`.

---

## /account/saved-vehicles — Saved cars

Wishlist for vehicles the user wants to come back to.

### Page sections

- Heading + count.
- Grid of `<VehicleCard />` (default variant).
- Each card has a small "Remove" tertiary button under the price.

### Empty state

"You haven't saved any cars yet." + `Browse cars` CTA.

---

## Module-specific components

### `<AccountSidebar />`

The left-rail navigation. URL-aware active state.

### `<BookingHistoryRow />`

Compact booking row for the bookings list.

### `<BookingDetailPanel />`

Full booking detail layout, reused on the confirmation page (`04_booking_flow.md`) and the manage-booking page (`13_manage_booking.md`).

### `<DocumentVaultCard />`

Card for displaying a stored document with status badge and edit/replace actions.

### `<ModifyBookingModal />`, `<CancelBookingModal />`

Action modals for booking changes.

---

## States & edge cases

| Scenario                                       | Behavior                                                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| User accesses /account without auth            | Redirect to /login with `?redirect=/account`.                                                          |
| Session expired mid-action                     | Show inline modal: "Your session ended. Sign in to continue." Action retries on success.              |
| Booking ref not owned by current user          | 404 page with link back to /account/bookings.                                                         |
| User tries to cancel within penalty window     | Cancel modal shows the refund amount honestly (e.g., "Refund: $0 — within 24h of pickup"). Still allow cancel.  |
| Booking is in Pending state and user is editing| Limit edits to non-payment fields (driver info, flight number). Payment changes require ops contact.  |

---

## Data requirements

- **Account profile:** `GET /api/account` → user object.
- **Bookings:** `GET /api/account/bookings?status=&page=` → paginated list.
- **Booking detail:** `GET /api/account/bookings/[ref]` → full booking.
- **Modify booking:** `PATCH /api/account/bookings/[ref]` body `{ ...changes }` → updated booking.
- **Cancel booking:** `POST /api/account/bookings/[ref]/cancel` → cancellation result with refund summary.
- **Documents:** `GET /api/account/documents`, `POST /api/account/documents` (with file upload), `DELETE /api/account/documents/[id]`.
- **Saved vehicles:** `GET /api/account/saved`, `POST /api/account/saved/[vehicleId]`, `DELETE /api/account/saved/[vehicleId]`.

---

## SEO & metadata

All `/account/*` routes are `noindex, nofollow`. No public meta is necessary.

---

## Acceptance criteria

- [ ] All `/account/*` routes are gated; unauthenticated users are redirected to /login with redirect param.
- [ ] Sidebar nav active state matches the URL.
- [ ] Dashboard shows the upcoming booking card or empty state.
- [ ] Booking list filters work (Upcoming, Pending, etc.) and update the URL.
- [ ] Booking detail page supports modify and cancel actions with correct policy enforcement.
- [ ] Documents can be uploaded, replaced, and deleted; verification status displays correctly.
- [ ] Saved-cars list displays standard `<VehicleCard />` and supports remove.
- [ ] All forms follow global form rules and are keyboard-accessible.
- [ ] Mobile: sidebar collapses to a top pill nav.
