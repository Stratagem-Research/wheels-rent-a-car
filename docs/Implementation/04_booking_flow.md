# 04 — Booking Flow

> Routes: `/book`, `/book/select-vehicle`, `/book/extras`, `/book/protection`, `/book/checkout`, `/book/confirmation/[ref]`
> Depends on: `00_global.md`, `03_vehicle_detail.md` (booking summary panel)
> Related: PRD §6.4, §7 (Lebanon-specific features), sitemap node `Booking flow`
> Primary persona: All — the conversion engine

---

## Purpose & success criteria

The booking flow is the **conversion engine of the site**. Every other module exists to feed it.

It's a 5-step linear funnel with:
- A persistent **stepper** at the top (always visible, click-back enabled for steps 1–4).
- A persistent **sticky booking summary panel** on the right (desktop) or expandable bottom sheet (mobile).
- A **single sticky search summary bar** at the top of step 1, allowing date/location edits without losing the funnel state.

**Success looks like:**
- ≤ 55% drop-off across the entire funnel.
- Median time from step 1 to step 5: < 90 seconds on a typical mobile connection.
- 100% of bookings (Card, Cash, Bank, OMT) reach a Confirmed or Pending state with a unique `WRC-YYMMDD-XXXX` reference.

---

## Funnel-wide UX rules

### Stepper

```
●────────●────────○────────○────────○
1. Vehicle  2. Extras  3. Protection  4. Checkout  5. Confirmation
```

- Visible on every step at the top of the page.
- Active step: dot + label in `colors.primary-40`.
- Completed steps: dot + label in `colors.success` with a tick icon.
- Future steps: dot + label in `colors.neutral-60`.
- Steps 1–4 are clickable to navigate back. Step 5 is read-only.
- On mobile, the stepper collapses to a slim "Step 2 of 5" indicator + progress bar.

### Sticky booking summary panel (right rail)

- **Position:** sticky on desktop, anchored to the right column. 360px wide.
- **Mobile:** collapses to a bottom action bar showing "Total $X · See details ▾". Tap expands to a bottom sheet showing the full summary.
- **Contents:**
  - Vehicle thumbnail (left) + model name + "or similar" (right).
  - Pickup: location + date + time.
  - Return: location + date + time.
  - Booking option: rate type (Best Price / Flexible) and mileage.
  - "What's included" checkmark list (collapsed by default beyond step 1; expands on click).
  - Add-ons list (appears once any add-on is selected).
  - Protection tier (appears once selected).
  - Divider, then **Total** in `price-lg`, with "Price details" expander.
  - Total updates live (200ms ease) as the user toggles add-ons or changes protection tier.

### Modal patterns

- "Edit search" opens a modal containing the full search bar (location, dates, times). Save → recomputes pricing for all funnel state.
- "Price details" opens a modal listing every line item (base, extras, protection, taxes, fees, deposit). Always show the deposit clearly even though it's not part of the total.

### Save-and-exit

- Top-right "Save & exit" link visible at every step.
- Click → confirmation modal: "We'll save your booking for 24 hours. Sign up to easily resume."
- Saves the `BookingDraft` (per `00_global.md` §20) under `wheels.booking.draft` in `sessionStorage` for 24h.
- Resume-link email is deferred until a backend `/api/booking/resume-link` endpoint exists.

---

## /book — entry redirect

Not a real page. Logic only:
- If `query.dates` and `query.location` present → redirect to `/book/select-vehicle?...`
- Otherwise redirect to `/vehicles`.

---

## Step 1 — /book/select-vehicle (Search Results)

The fleet listing, scoped to the selected dates and location, with rate selection inline.

### Layout

```
┌── Sticky Search Bar Summary ────────────────────────────────────┐
│  📍 Beirut Airport · 📅 May 20 10:00 → May 25 10:00 · 5 days    │
│                                                       ✏ Edit    │
└─────────────────────────────────────────────────────────────────┘
┌── Stepper ──────────────────────────────────────────────────────┐
│  ● 1 Vehicle  — 2 Extras  — 3 Protection  — 4 Checkout  — 5 ✓   │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────┬───────────────────────────┐
│  Sort ▾ Recommended                 │  YOUR BOOKING (sticky)    │
│  [Mini] [Sedan] [SUV] [Auto only]   │  (empty until selection)  │
│                                     │  📅 May 20 10:00 →        │
│  ┌──────────────────────────────┐   │      May 25 10:00         │
│  │  [VehicleCard, expanded]     │   │  📍 Beirut Airport (BEY)  │
│  │  Inline rate selector below  │   │  ─────────────────────    │
│  │  ◉ Best Price  ○ Flexible    │   │  Vehicle: not selected    │
│  │  ◉ 200 km/day ○ Unlimited    │   │  Total —                  │
│  │  [   Next →   ]              │   │                           │
│  └──────────────────────────────┘   │                           │
│  ┌──────────────────────────────┐   │                           │
│  │  [VehicleCard]      [Select] │   │                           │
│  └──────────────────────────────┘   │                           │
└─────────────────────────────────────┴───────────────────────────┘
```

### Sticky search summary bar

- Sits at the top of the page, beneath the global header.
- Background `colors.surface`, 1px bottom border.
- Single line on desktop. Mobile: 2 lines (location, dates).
- "Edit" link opens the global search bar in modal mode. Updates change pricing for the whole step.

### Sort + filter chips

- Sort dropdown (left): Recommended (default), Price low→high, Price high→low, Newest, Largest car.
- Quick-filter chips (right): All · Mini · Sedan · SUV · Auto only.

### Vehicle card (expanded / rate-selector pattern)

Inspired by Sixt's inline rate selector. When the user clicks `Select` on a card, the card expands inline to reveal rate options. The user must choose, then click `Next →`.

**Resting state (default):** Standard `<VehicleCard />` from `02_fleet_browse.md` with `Select` button (blue primary).

**Expanded state:**

- Card grows in height (animated 250ms).
- Below the spec strip, two grouped option panels appear:

**Booking option panel:**

| Option        | Price hint                          | Description                                         |
| ------------- | ----------------------------------- | --------------------------------------------------- |
| ◉ Best Price  | Included (default)                  | Pay now. Non-refundable.                            |
| ○ Flexible    | +$X/day                             | Free cancellation up to 24h before pickup.          |

**Mileage panel:**

| Option              | Price hint                | Description                                  |
| ------------------- | ------------------------- | -------------------------------------------- |
| ◉ 200 km/day        | Included                  | Includes 1,000 km over 5 days.               |
| ○ Unlimited         | +$Y/day                   | No mileage limit.                            |

- Below the panels: total price recap (`price-lg`) and `Next →` `button-cta` (red, full-width on mobile).
- Cancel: clicking another card collapses this one.

**Selected card state (after Next):** the card stays in the list but greyed out with a "Selected ✓" badge. Funnel proceeds to /book/extras.

### Behavior

- Cards lazy-load images (above-the-fold cards eagerly).
- "Recommended" sort puts the lowest priced popular categories first.
- If no cars match: empty state — "No cars for these dates. Try a wider window." with `Try ±2 days` and `Edit search` buttons.

### Mobile

- Filter and sort live in a sticky bottom bar (Filters | Sort).
- Card expansion is full-width.
- Booking summary panel is the bottom action bar; tap → bottom sheet.

---

## Step 2 — /book/extras

Optional add-ons. Inspired by Sixt's clean toggle list and Advanced's "Add" rows.

### Layout

```
┌── Stepper ──────────────────────────────────────────────────────┐
│  ✓ 1 Vehicle  ● 2 Extras  — 3 Protection  — 4 Checkout  — 5 ✓   │
└─────────────────────────────────────────────────────────────────┘
┌── Page heading ─────────────────────────────────────────────────┐
│  WHICH ADD-ONS DO YOU NEED?                                     │
│  All optional. Add as many as you like.                         │
└─────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────┬──────────────────────┐
│  DRIVER & ACCESS                         │  YOUR BOOKING        │
│  ┌────────────────────────────────────┐  │  (sticky panel)      │
│  │ 🧑 Additional driver  $5/day [+]   │  │                      │
│  │ Add a second driver to share the   │  │  Total $XXX          │
│  │ wheel. Details ▾                   │  │  [   Continue →   ] │
│  └────────────────────────────────────┘  │                      │
│  ┌────────────────────────────────────┐  │                      │
│  │ 🧑‍🦱 Underage driver  $10/day [+] │  │                      │
│  └────────────────────────────────────┘  │                      │
│                                          │                      │
│  COMFORT                                 │                      │
│  ... baby seat, booster, child seat ...  │                      │
│                                          │                      │
│  CONNECTIVITY                            │                      │
│  ... 4G WiFi hotspot ...                 │                      │
│                                          │                      │
│  CONVENIENCE                             │                      │
│  ... refuelling, roadside+ ...           │                      │
│                                          │                      │
│  SUSTAINABILITY                          │                      │
│  ... CO₂ offset $5/rental ...            │                      │
│                                          │                      │
└──────────────────────────────────────────┴──────────────────────┘
```

### Add-on row

- Each row is a `card` with `border` 1px, 16px padding, `rounded-md`.
- **Left:** icon (32px, blue), name (`title-md`), short description (`body-sm`, neutral-50), "Details" link (opens modal).
- **Right:** price (`label-lg`) + add control:
  - Single quantity (e.g., extra driver): on/off switch.
  - Multi-quantity (e.g., baby seats): qty stepper (`-` / number / `+`).

### Categories (in order)

| Category         | Items                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| Driver & access  | Additional driver, Underage driver fee, Cross-border permit (Syria/Jordan)                     |
| Comfort          | Baby seat (0–13 kg), Booster seat (15–36 kg), Child seat (9–18 kg), GPS unit                   |
| Connectivity     | 4G WiFi hotspot                                                                                 |
| Convenience      | Refuelling service, Roadside assistance Plus                                                    |
| Sustainability   | CO₂ offset ($5/rental), Plant a Cedar ($20/rental — partnership with Lebanon Reforestation)    |

### Sticky panel updates

- As each toggle/qty changes, total updates live in the right panel and at the page bottom.
- Selected add-ons appear in the panel under a "Add-ons" subsection with a remove × icon.

### Continue & back

- Right panel `Continue` `button-cta` red, full width.
- Top-left "← Back to vehicles" tertiary link.

---

## Step 3 — /book/protection

Insurance tiers presented as a 3-up card comparison.

### Layout

```
┌── Stepper ──────────────────────────────────────────────────────┐
│  ✓ 1 Vehicle  ✓ 2 Extras  ● 3 Protection  — 4 Checkout  — 5 ✓   │
└─────────────────────────────────────────────────────────────────┘
┌── Page heading ─────────────────────────────────────────────────┐
│  CHOOSE YOUR PROTECTION                                         │
│  Drive with peace of mind. You can change this at the counter.  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐ ┌─────────────────────┐ ┌─────────────┐
│   BASIC     │ │      SMART          │ │  ALL INCL.  │
│  Included   │ │ [POPULAR badge]     │ │             │
│             │ │  +$X/day            │ │ +$Y/day     │
│ Deductible  │ │  Reduced deductible │ │ Zero excess │
│   $XXX      │ │   $XX               │ │  $0         │
│             │ │                     │ │             │
│ ✓ ...       │ │ ✓ ...               │ │ ✓ ...       │
│ ✓ ...       │ │ ✓ ...               │ │ ✓ ...       │
│             │ │ ✓ ...               │ │ ✓ ...       │
│             │ │                     │ │ ✓ ...       │
│ [ Select ]  │ │ [ Select ] (filled) │ │ [ Select ]  │
└─────────────┘ └─────────────────────┘ └─────────────┘

What does "deductible" mean? →  /help/insurance-and-coverage
```

### Tier card

- 3 columns desktop, 1-up stacked mobile (`Smart` first on mobile).
- White card, `rounded-lg`, 24px padding, `border` 1px. The `Smart` tier sits in `card-elevated` with `colors.primary-40` 2px border and a `badge-popular` ribbon at the top.
- Content top-to-bottom: tier name (`headline-md`), price line (`label-lg`), deductible block (large number with "deductible" label), divider, included items checklist (icon ✓, `body-sm`), `button-primary` (blue) `Select`.
- Selected tier: button label switches to `Selected ✓`, card border becomes 2px `colors.primary-40`. Continue CTA becomes the right-rail button.

### FAQ + link

Below the cards: 3 short Q&A inline (`title-md` question, `body-sm` answer) + link "Read full insurance terms →".

### Continue

Sticky panel `Continue` `button-cta` red. If no tier selected, button is disabled until selection.

---

## Step 4 — /book/checkout

Customer info, payment method, terms. Single page. Avis pattern.

### Layout

```
┌── Stepper ──────────────────────────────────────────────────────┐
│  ✓ 1 Vehicle  ✓ 2 Extras  ✓ 3 Protection  ● 4 Checkout  — 5 ✓   │
└─────────────────────────────────────────────────────────────────┘

┌── Sub-banner ───────────────────────────────────────────────────┐
│  ⏱ Your booking is held for 23m 50s        [   Save & exit  ]   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────┬──────────────────────┐
│  YOUR INFORMATION                       │  YOUR BOOKING        │
│  First name *  | Last name *            │  (sticky panel)      │
│  Email *       | Mobile * (+961 ▾)      │                      │
│  Date of birth *  Country *             │  Vehicle, dates, ... │
│  ☐ Send updates via WhatsApp            │  Total $XXX          │
│                                         │                      │
│  DRIVER'S LICENCE                       │  Deposit $XXX held   │
│  Licence # *  Issue date *  Expiry *    │  (refundable)        │
│  Issuing country ▾                      │                      │
│                                         │                      │
│  PICKUP DETAILS  (conditional)          │                      │
│  Flight number (BEY only)               │                      │
│  Delivery address (Address Delivery)    │                      │
│                                         │                      │
│  HOW WOULD YOU LIKE TO PAY?             │                      │
│  ◉ Credit/Debit card                    │                      │
│  ○ Cash on pickup                       │                      │
│  ○ Bank transfer (OMT/Whish/Bank)       │                      │
│  [conditional sub-form per method]      │                      │
│                                         │                      │
│  PROMO CODE (optional) ▾                │                      │
│                                         │                      │
│  ☐ I agree to the Terms & Conditions *  │                      │
│  ☐ Send me promotions                   │                      │
│                                         │                      │
│  [    Pay & confirm   $XXX  →    ]      │                      │
└─────────────────────────────────────────┴──────────────────────┘
```

### Sub-banner — booking hold timer

- Background `colors.warning-bg`, text `colors.warning`, slim 36px tall.
- Shows a countdown (24-minute hold). If timer expires, recompute pricing on submit.
- Right side: `Save & exit` link.

### Driver information section

- Section heading `headline-md`: "Your information".
- Fields (per global form rules in `00_global.md` §9):
  - First name * | Last name *
  - Email * | Mobile * (phone input with 🇱🇧 +961 default)
  - Date of birth * (DD/MM/YYYY format input or popover)
  - Country * (dropdown)
- WhatsApp opt-in checkbox under the mobile field — checked by default for `+961` numbers.

### Driver's licence section

- Section heading `headline-md`: "Driver's licence".
- Fields: Licence number *, Issue date *, Expiry date *, Issuing country *.
- Helper text: "We'll verify at pickup. Foreign licences must be in Latin script — bring your passport."

### Pickup details (conditional)

- Section heading `headline-md`: "Pickup details" — visible only when needed.
- **Flight number** field appears only if pickup type is `Beirut Airport`.
- **Delivery address** field (Google Places autocomplete) appears only if pickup type is `Address Delivery`. Below: estimated delivery fee shown live in the right panel.

### Payment method radio + reveal

The full Lebanon-localized payments section (per PRD §7.2).

#### Card option

```
◉ Credit / Debit card
   [Visa] [MC] [Amex]
   Card number ____  Expiry MM/YY  CVV ___
   Cardholder name __________________
   ─ We never store your card details. ─
```

- Inline card form (or PSP-hosted iframe — Areeba primary).
- Validates Luhn, expiry, CVV format.

#### Cash option

```
○ Cash on pickup (USD or LBP)
   Bring your payment in USD or LBP at pickup.
   A refundable security deposit is required at the counter.
   Booking is confirmed instantly; we'll WhatsApp to verify 24h before pickup.
```

- No additional fields. Booking goes to **Confirmed** state immediately.
- Note in panel: "Pay $X at pickup. Deposit $XXX required (refunded on return)."

#### Bank transfer option

```
○ Bank transfer
   Send full payment by transfer.
   ─ Bank: Bank of Beirut SAL
   ─ IBAN: LB00 ...
   ─ Reference: WRC-260520-9KQ4 (your booking ref)
   Upload proof of transfer below.
   [ Drag a file or browse ]
   Booking is held as PENDING until we confirm receipt (within 24h).
```

- File upload required to submit (PDF, JPG, PNG max 5 MB).
- Booking goes to **Pending** state until ops verify.

#### OMT / Whish option

```
○ OMT / Whish / Bob Finance
   Pay in cash at any OMT, Whish, or Bob Finance branch.
   ─ Code: ALWHEELS
   ─ Reference: WRC-260520-9KQ4
   Booking is held as PENDING until we confirm receipt (within 4h).
```

- Optional file upload of receipt.

### Promo code

Collapsible expander. Once expanded: text input + Apply button. On apply: green inline confirmation + line item appears in the right panel.

### Terms & marketing checkboxes

- T&C checkbox (required) with link to `/terms`.
- Marketing consent (optional, default off).

### Final CTA

`button-cta` red, full width on mobile, label varies by method:
- Card: `Pay & confirm $XXX`
- Cash: `Confirm reservation`
- Transfer / OMT: `Submit booking — pending verification`

### Mobile

- All sections stack.
- Sticky bottom bar shows total + the final CTA. The sticky panel becomes a bottom sheet expandable.

---

## Step 5 — /book/confirmation/[ref]

Successful booking screen. Email + WhatsApp also sent.

### Layout

```
┌── Slim header (logo + Sign in) ────────────────────────────────┐
└────────────────────────────────────────────────────────────────┘

✓  YOUR BOOKING IS CONFIRMED
   Reference  WRC-260520-9KQ4   [📋 Copy]

   (For Pending bookings, replace headline:
    ⏱ YOUR BOOKING IS PENDING — we'll confirm within 24h)

┌─────────────────────────────────────┬──────────────────────────┐
│  YOUR CAR                           │  TOTAL                   │
│  [Vehicle thumbnail]                │  $XXX paid via Card      │
│  Toyota Corolla or similar          │                          │
│  ─                                  │  Deposit $XXX held       │
│  Pickup                             │  (released after return) │
│  Beirut Airport (BEY)               │                          │
│  Sat, May 20  10:00                 │  [ Add to calendar ]     │
│  ─                                  │  [ View invoice ]        │
│  Return                             │                          │
│  Beirut Airport (BEY)               │  Need to change?         │
│  Wed, May 25  10:00                 │  [ Modify ] [ Cancel ]   │
└─────────────────────────────────────┴──────────────────────────┘

NEXT STEPS
✓  Bring your driver's licence and the credit card used.
✓  Have your booking reference ready.
✓  We'll WhatsApp you 24h before pickup with the meeting point.

─────────────────────────────────────────────────────────────────

CREATE AN ACCOUNT IN ONE CLICK
Use the same email — we'll save your booking and licence for next time.
[ Create account ]                      [ No thanks, continue ]

─────────────────────────────────────────────────────────────────

CROSS-SELL (only if relevant)
Need a chauffeur for an evening out? → /chauffeur
```

### Header

- Slim header with just the logo (left) and `Sign in` link (right). No primary nav.

### Hero / status block

- Centered, 64px top padding.
- Status icon (40px) + headline (`headline-xl`).
  - Confirmed: green check icon, "Your booking is confirmed".
  - Pending (cash transfer / OMT): amber clock icon, "Your booking is pending".
- Reference line: "Reference" label + ref in `mono-lg` + copy-to-clipboard icon button.

### Two-column body

Same structure as the booking summary but read-only and richer.

**Left column ("Your car"):**
- Vehicle thumbnail + model.
- Pickup block: location (with address), date + time.
- Return block: same.
- "Driver" sub-section with name + email + phone.
- "Add-ons" sub-section.
- "Protection" sub-section.

**Right column:**
- Total paid (or "Awaiting payment" for Pending).
- Payment method.
- Deposit info if applicable.
- Buttons:
  - `Add to calendar` (downloads .ics with both pickup and return events).
  - `View invoice` (opens PDF).
  - `Modify` (opens edit modal).
  - `Cancel` (opens cancellation flow with refund preview).

### Next steps checklist

- 3–4 items relevant to the booking (always include licence + WhatsApp note).
- For BEY: include "Meet our agent at the BEY arrivals hall, exit B" with a small map.
- For Address Delivery: include the delivery address and time window.
- For Cash: include "Bring USD or LBP at pickup".

### Account upsell

- Only if the user is NOT signed in.
- "Create an account in one click" banner with `Create account` (primary) and `No thanks` (tertiary).
- Account creation prefills email; user only sets a password.

### Cross-sell (optional)

- One row: chauffeur if not selected, or insurance upgrade if Basic was chosen.

### Footer

Minimal footer (legal links only).

---

## Module-specific components

### `<Stepper />`

- 5-step horizontal stepper with click-back. WAI-ARIA `progressbar` semantics.

### `<RateSelectorCard />`

The vehicle card expanded inline with rate options. Reused only in step 1.

### `<AddOnRow />`

Single-row add-on with name, description, price, qty stepper or toggle.

### `<ProtectionTierCard />`

3-up tier comparison card. Variants: default, popular (with badge), selected.

### `<BookingSummaryPanel />`

The sticky right rail. Reused from PDP (`03_vehicle_detail.md`) but in `flow` mode — read-only fields, total updates live, "Edit search" opens a modal.

### `<PaymentMethodSelector />`

Radio group with conditional reveal panels for each method. Each method has its own sub-form.

### `<HoldTimer />`

Top sub-banner countdown. On expiry, recompute pricing on submit.

### `<ConfirmationStatusBlock />`

Centered status hero with icon + headline + ref + copy button.

---

## Booking state machine

| State                  | Trigger                                | User-visible label             | Allowed transitions                          |
| ---------------------- | -------------------------------------- | ------------------------------ | -------------------------------------------- |
| `draft`                | Funnel started                         | (not shown)                    | → confirmed, → pending, → expired, → cancelled |
| `confirmed`            | Card paid OR Cash booking submitted    | "Confirmed"                    | → cancelled, → completed                     |
| `pending`              | Bank/OMT submitted, awaiting verification | "Pending verification"      | → confirmed, → cancelled                     |
| `expired`              | Pending booking unverified after 24h   | "Expired"                      | (terminal)                                   |
| `cancelled`            | User cancellation                      | "Cancelled"                    | (terminal)                                   |
| `completed`            | Vehicle returned                       | "Completed"                    | (terminal)                                   |

---

## States & edge cases

| Scenario                                                | Behavior                                                                                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Vehicle becomes unavailable after step 1                | Soft redirect to `/book/select-vehicle` with toast: "That car was just booked — here are similar options." Funnel state preserved (extras / protection re-applied if applicable).  |
| Price changes between funnel steps                      | Recompute on each step entry. If total changes by > 1%, show a non-blocking toast on step 4: "Your total has been updated." Highlight the changed line.   |
| Hold timer expires                                      | On submit, recompute. If pricing changed, show a confirm modal: "Prices have changed. New total $XXX. Continue?"  |
| Card payment fails                                      | Inline error on the card form. Suggest retry; surface alternative methods (cash, transfer) more prominently.        |
| Bank transfer proof not uploaded                        | Submit button stays disabled until file uploaded.                                                                   |
| Bank transfer not verified after 24h                    | Auto-cancel; email + WhatsApp notice with re-book link.                                                             |
| Internal management system unreachable                  | Disable funnel; banner: "Online booking is temporarily unavailable. Reach us on WhatsApp +961…" The user keeps a session-saved draft to retry later.  |
| User abandons checkout (idle 30s)                       | WhatsApp assistance prompt slides in: "Need help completing your booking? Chat with our team." (Advanced pattern.)  |
| User refreshes a step                                   | Funnel state restored from `sessionStorage` (`wheels.booking.draft`).                                              |
| Returning to step 1 from step 4                         | Booking summary panel keeps add-ons and protection; user can re-select a vehicle.                                  |
| Network drops on step 4 submit                          | Show retry banner; do NOT charge the card; on success, the booking goes through.                                   |
| Pending booking expired by the time the user opens email link | Confirmation page reads "This booking expired" with a CTA to re-book (pre-filled from saved draft).        |

---

## Data requirements

- **Available vehicles for criteria:** `POST /api/booking/availability` body `{ pickup, return, location, returnLocation? }` → list with rates.
- **Rate detail for selected vehicle:** `POST /api/booking/rate` body `{ vehicleId, rateType, mileage }` → daily price + total.
- **Add-ons catalog:** `GET /api/addons` → list with prices.
- **Protection tiers:** `GET /api/protection-tiers` → list with deductibles + included items.
- **Pricing recalculation:** `POST /api/booking/quote` body `{ draft }` → full breakdown.
- **Submit booking:** `POST /api/booking/submit` body `{ draft }` → returns the booking and state. Hosted payment providers use their own tokenized/redirect flow and must never send raw card data through this endpoint.
- **Confirmation detail:** `GET /api/booking/[ref]?email=` → full booking details (no auth needed when accessed directly post-confirmation; later requires auth or manage-booking lookup).
- **Cancellation policy preview:** `POST /api/booking/cancel-preview` → expected refund amount.

---

## SEO & metadata

The booking flow pages are `noindex, nofollow` — these are private funnel URLs. Confirmation page also `noindex` (contains booking ref).

---

## Acceptance criteria

- [ ] Stepper visible and accurate on every step; back navigation preserves all funnel data.
- [ ] Sticky booking summary visible on desktop steps 1–4; mobile bottom-sheet works smoothly.
- [ ] Step 1: clicking `Select` expands the card inline with rate options; `Next →` is disabled until both rate and mileage are chosen.
- [ ] Step 2: each add-on toggle/qty change updates the total in the right panel within 200ms.
- [ ] Step 3: tier cards visually distinct; `Smart` carries the `Popular` badge; selected tier outlined.
- [ ] Step 4: payment method radio reveals correct sub-form per method; only relevant ones (e.g., flight number on BEY pickup) appear.
- [ ] Step 4: card form is PCI-compliant (PSP-hosted or tokenized via Areeba/Stripe).
- [ ] Step 4: bank transfer requires file upload before submit; OMT submit is allowed without file (but encouraged).
- [ ] Booking hold timer counts down from 24:00 and recomputes on expiry.
- [ ] Step 5: booking ref `WRC-YYMMDD-XXXX` is unique, copy-to-clipboard works, displayed in `mono-lg`.
- [ ] Confirmation email sent within 30s; WhatsApp message within 60s if opted in.
- [ ] State machine: card pay → Confirmed; cash → Confirmed; transfer/OMT → Pending.
- [ ] WhatsApp assistance prompt appears at 30s idle on step 4 only.
- [ ] All steps pass axe-core AA on every form field.
- [ ] On mobile, the sticky bottom action bar is always reachable above the device safe area.
- [ ] Funnel state survives page refresh during steps 1–4.
- [ ] Vehicle availability is rechecked on entry to each step; user gets a clean redirect with toast if the car is gone.
