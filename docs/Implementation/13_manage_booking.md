# 13 — Manage Booking (no-login lookup)

> Route: `/manage-booking`
> Depends on: `00_global.md`, `12_account.md` (reuses booking detail panel)
> Related: PRD §6.12
> Primary persona: Guest-checkout users, users who lost the confirmation email

---

## Purpose & success criteria

`/manage-booking` lets a user retrieve a booking **without signing in**, using `booking ref + email` as the lookup key. Critical for guest bookings.

**Success looks like:**
- Lookup latency < 2s.
- ≥ 60% of guest users who use this page successfully reach their booking detail.
- Lookup endpoint is rate-limited and resilient to abuse.

---

## Page sections (top to bottom)

### 1. Page header

- Background `colors.primary-95`. Heading `headline-lg`: "Manage your booking".
- Subhead: "Look up your reservation with your booking reference and email."

### 2. Lookup form

Centered card, max-width 560px, white, `rounded-lg`, 32px padding, `elevation-2`.

```
LOOK UP YOUR BOOKING

Booking reference *
[ WRC-XXXXXX-XXXX ]
Helper: Find this in your confirmation email or WhatsApp.

Email used at booking *
[ name@domain.com ]

[   Find my booking   →   ]
```

- Both inputs use the standard `input` token.
- Booking ref input uses `mono-md` font for easy reading.
- Submit posts to `POST /api/booking/lookup`.

### 3. After successful lookup

Replace the lookup form with the full booking detail layout (the same `<BookingDetailPanel />` from `12_account.md`), including:

- Status block (Confirmed / Pending / Completed / Cancelled).
- Vehicle + itinerary.
- Total, payment method.
- Actions: `Add to calendar`, `View invoice`, `Modify`, `Cancel`, `Chat on WhatsApp`.

### 4. "Want easier access?" footer banner

Below the booking detail when shown:
- Card: "Create an account to easily manage future bookings."
- `button-primary` blue: "Create account" (pre-fills email from the lookup).

### 5. Footer

Global footer.

---

## Module-specific components

### `<BookingLookupForm />`

Two-field form with strict validation:
- Booking ref pattern: `^WRC-\d{6}-[A-Z0-9]{4}$`.
- Email validation per RFC 5322 (simplified).

Errors:
- "We couldn't find that booking. Check the reference and email." (generic to avoid enumeration).
- Rate-limit feedback after 5 failed attempts: "Too many attempts. Try again in a few minutes."

### `<BookingDetailPanel />`

Reused from `12_account.md`.

---

## States & edge cases

| Scenario                                          | Behavior                                                                                       |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Booking not found                                 | Generic error message (per security: don't reveal whether ref or email is wrong).              |
| Booking is Cancelled                              | Show detail but actions limited to `View invoice` and `Chat on WhatsApp`.                      |
| Booking is Pending                                | Show clear next steps in a banner ("Upload proof of transfer" or "Pay at OMT before X").       |
| Multiple rate-limit failures                      | Block IP for 15 minutes; show explanation.                                                     |
| User authenticated and accesses this page         | Redirect to `/account/bookings` with a small toast: "You're signed in — view all your bookings." |

---

## Data requirements

- **Lookup:** `POST /api/booking/lookup` body `{ ref, email }` → booking detail or 404.
- **Modify / cancel:** same endpoints as `12_account.md` but with a short-lived token returned from the lookup.

---

## Security

- Endpoint is rate-limited: 5 attempts per IP per 15 minutes.
- Generic error messages on failure (no booking-existence enumeration).
- Modify/cancel actions require the lookup token; tokens expire 10 minutes after issuance.
- No PII is logged on failed lookups.

---

## SEO & metadata

- **Title:** "Manage Your Booking · Wheels Rent A Car"
- **Description:** "Look up, modify, or cancel your Wheels booking. Enter your reference and email."
- `noindex` after lookup succeeds (page state contains booking details).

---

## Acceptance criteria

- [ ] Lookup form validates booking ref pattern and email format inline.
- [ ] Successful lookup replaces the form with the booking detail panel.
- [ ] Failed lookup shows a generic error (no enumeration).
- [ ] Rate-limited after 5 failed attempts with a clear message.
- [ ] Modify and cancel actions work identically to the authenticated account flow.
- [ ] Authenticated users are redirected to `/account/bookings`.
