# Booking Self-Service — QA Checklist (Fatema)

Date: 2026-07-20  
Environment: `http://localhost:3000` (or staging when deployed)

## Prerequisites

- Apply migration `supabase/migrations/20260720_000001_guest_booking_index.sql` on Supabase (required for guest → account booking claim).
- Demo Wizard API reachable (`.env` `NEXT_PUBLIC_WHEELS_API_BASE_URL`).
- Use **far-future dates** (e.g. Jun 2027) and a **fresh email** each run to avoid demo API rate limits (429).

---

## Guest flow

1. Clear `sessionStorage` → key `wheels.booking.draft`
2. Search with dates → pick vehicle → extras → protection → **cash checkout**
3. **Pass:** confirmation page shows booking ref (`WRC-...`)
4. Click **View invoice** → **Pass:** `/manage-booking?ref=...&email=...` with both pre-filled; lookup succeeds
5. Click **Modify** → **Pass:** modal opens (not a toast); submit change request → success message
6. Click **Cancel** → **Pass:** two-step modal; submit cancellation request → success message
7. Register with same email → **Pass:** booking appears on `/account/bookings`

## Account flow (logged in)

1. Sign in → complete cash checkout
2. **Pass:** booking appears immediately on `/account/bookings`
3. Open booking detail → **Modify/Cancel** modals work
4. **View invoice** → **Pass:** stays on account detail page, scrolls to payment section (does not redirect to manage-booking)

## Error cases

| Symptom | Expected |
|---------|----------|
| Wrong email on lookup | Generic “couldn't find that booking” (404) |
| 429 on submit | “Too many requests” toast — wait 1–2 min, new email |
| 409 on submit | Redirect to vehicles with dates preserved |

## Automated tests

```bash
# Unit tests (new)
pnpm vitest run lib/booking/__tests__/manage-booking-url.test.ts \
  lib/supabase/__tests__/user-bookings-repository.test.ts \
  lib/server/__tests__/booking-service.test.ts \
  app/api/payments/whish/create/__tests__/route.test.ts

# E2E (mocked + UI; no live Wizard)
pnpm exec playwright test tests/e2e/booking-self-service.spec.ts \
  tests/e2e/account-booking-lifecycle.spec.ts --project=chromium

# E2E with live Wizard checkout (optional; avoid rate limits)
RUN_LIVE_E2E=1 pnpm exec playwright test tests/e2e/booking-self-service.spec.ts \
  tests/e2e/account-booking-lifecycle.spec.ts --project=chromium --workers=1
```

## Manual run result (2026-07-20)

| Check | Result |
|-------|--------|
| Guest cash checkout → confirmation | **Pass** (Marc: `WRC-260720-ZX3C`) |
| Unit tests (10 new/updated) | **Pass** |
| E2E mocked flows (lookup prefill, modals, signed-in redirect, account detail) | **Pass** |
| E2E live Wizard checkout | **Skipped by default** (`RUN_LIVE_E2E=1`); subject to demo API 429 when run in batch |
