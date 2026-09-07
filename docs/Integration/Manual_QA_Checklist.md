# Manual QA Checklist — Staging / Pre-Go-Live

Status: Ready to execute on staging URL  
Owner: Website Team  
Last updated: 2026-07-27

Run after staging deploy.

## Local automated coverage (2026-07-27)

The following were verified locally before staging; check off on staging URL after deploy:

- [x] Cash / transfer / OMT checkout (live E2E vs demo Wizard)
- [x] Guest claim on login (`account-booking-lifecycle` @live)
- [x] Modify/cancel modals (mocked API)
- [x] i18n catalogs aligned (`pnpm i18n:check`)
- [ ] Full matrix below on staging URL

## Booking funnel

- [ ] Home → search → `/vehicles` with dates
- [ ] Inline vehicle expansion → Next → extras → protection → checkout
- [ ] Draft survives browser refresh mid-funnel
- [ ] Cash checkout → confirmation + email queued in `notification_outbox`
- [ ] Bank transfer → pending confirmation
- [ ] OMT → pending confirmation

## Self-service

- [ ] `/manage-booking` lookup with ref + email
- [ ] Confirmation page → modify modal → request submitted
- [ ] Confirmation page → cancel modal → request submitted
- [ ] Invalid ref shows generic error (no enumeration)

## Account

- [ ] Register → email confirm → login
- [ ] Logged-in checkout appears in `/account/bookings`
- [ ] Guest checkout → login same email → booking claimed
- [ ] Documents upload / replace / delete (if enabled)

## Content & i18n

- [ ] `/` all 8 landing sections render
- [ ] AR locale: RTL + translated hero
- [ ] FR locale: translated marketing copy
- [ ] `/long-term`, `/chauffeur`, `/corporate`, `/car-wash` forms submit

## Admin

- [ ] `/admin` login with env credentials
- [ ] Fleet sync from Wizard demo
- [ ] CMS edit (trips, FAQs, promotions) persists

## Ops

- [ ] `/api/health` → 200
- [ ] `/api/site-config` includes `paymentMethods` array
- [ ] Cron invokes `/api/notifications/process` (Vercel dashboard)
- [ ] Sentry receives test error (if DSN configured)

## Sign-off

| Role | Name | Date | Pass? |
| --- | --- | --- | --- |
| Website | | | |
| Wheels  | | | |
