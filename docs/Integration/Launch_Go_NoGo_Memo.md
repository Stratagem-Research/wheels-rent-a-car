# Launch Go/No-Go Memo

Date: 2026-08-10 (updated; originally 2026-06-06)
Prepared by: Website Team
Decision status: **Go for payment-deferred launch pending staging deploy + Adam sign-off. No-Go for payment-enabled launch (Whish credentials pending).**

## Scope

Payment-deferred launch: cash, bank transfer, OMT. Online modules (Whish, NEO) built but env-disabled until merchant credentials. See `Payment_Deferred_Track.md`.

## Checklist summary

| Area | Status | Notes |
| --- | --- | --- |
| Core implementation | **Complete** | All 5 payment modules, SMTP notifications + request/approval email split, admin Supabase Storage uploads, NEO sandbox scaffold |
| Quality checks | **Complete** | `typecheck`, `build`, `test` (211 pass), `test:e2e:smoke` (28/28 pass) as of 2026-07-27 |
| Wizard demo integration | **Complete** | `wheels-api-smoke.sh` 7/7; `RUN_LIVE_API_TESTS=1` integration suite pass (retry after 429) |
| Live checkout E2E | **Partial** | Cash + transfer pass; OMT selector fixed; account/self-service `@live` need isolated re-run |
| Security gate | **Pass (dev/staging DB)** | RLS negative tests pass 2026-07-27; dedicated prod project RLS via `pnpm supabase:production-preflight` |
| Payment gate | **Partial** | Whish idempotency + amount mismatch implemented + unit tested; sandbox E2E blocked on creds |
| Operations gate | **Partial** | Cron in `vercel.json`; staging deploy + Sentry/backup drills pending |
| Production Supabase | **Ready to provision** | Runbook + `scripts/supabase-production-preflight.mjs` |
| Adam external sign-off | **Partial** | Offline payments / fleet / images / SMTP / WhatsApp answered Aug 9. Still need: staging URL review, deploy path, prod SMTP creds. Tracker: `Adam_Response_Tracker.md` |

## Residual risks

1. Whish / NEO merchant credentials not provided — online payments remain disabled at launch.
2. Notifications: Adam requires Wheels SMTP (not Resend/SendGrid); prod SMTP credentials still pending. Formal confirmation email after approval.
3. Production Wizard must not be tested until Adam issues prod token and grants go-live approval.
4. Real bank transfer IBAN still placeholder in checkout copy.

## Recommendation

**Go** for payment-deferred launch after:
1. Dedicated production Supabase provisioned (`Supabase_Production_Setup.md`)
2. Staging deploy + `Manual_QA_Checklist.md` pass
3. Staging URL + test checklist shared with Adam/Elie (Adam asked Aug 9 for Monday-night Lebanon try)

**No-Go** for payment-enabled launch until Whish sandbox E2E passes with real credentials.
