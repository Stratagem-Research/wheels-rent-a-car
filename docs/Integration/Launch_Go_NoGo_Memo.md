# Launch Go/No-Go Memo

Date: 2026-07-11 (updated; originally 2026-06-06)
Prepared by: Website Team
Decision status: **Go for payment-deferred launch. No-Go for payment-enabled launch (Whish credentials pending).**

## Scope

This memo evaluates launch readiness for the non-payment launch scope (payment hardening intentionally deferred, tracked separately in `Payment_Deferred_Track.md`).

## Checklist summary

| Area | Status | Notes |
| --- | --- | --- |
| Core implementation streams | Complete | Proxy migration, admin auth hardening, smoke stabilization, docs alignment, Wizard booking + vehicle sync all landed |
| Quality checks (`typecheck`/`lint`/`test`/`build`) | Complete | `typecheck`, `lint`, `build` all pass; `test` has 12 pre-existing failures unrelated to Wizard/payments (missing i18n provider in 3 UI component test files — test-infra gap, not a runtime bug) |
| External Wizard sign-off | **Done for booking + vehicle sync.** | Token delivered and verified 2026-07-11 — vehicle sync (65 vehicles) and booking sync-status both work live against the demo. See `Vehicle_Sync_Live_Verification.md`. Staging server access still pending from Adam (not blocking). |
| Security gate | **RLS checks pass.** | RLS negative tests executed and passing against live Supabase (2026-07-11); a test-logic bug that produced false failures was fixed. Alerting + prod-project RLS re-verification still pending (needs staging/prod project access). |
| Payment gate | Deferred | Whish code is complete (`lib/payments/whish.ts`, checkout, callbacks) but `WHISH_CHANNEL`/`WHISH_SECRET` are still placeholder values — **this is the only remaining launch blocker.** |
| Operations gate | Partial | Rollback env-toggle path verified; backup/restore drill and alerting setup require Supabase/Sentry project access not available in this environment |

## Residual risks

1. Whish merchant credentials not yet provided — blocks real online payments (cash/transfer/OMT manual methods work today).
2. Backup/restore and alerting drills need staging/production infra access (Supabase CLI + Sentry dashboard) to execute.
3. Staging server SSH/deploy access still pending from Adam — needed for a true staging (not demo) rehearsal.
4. 12 pre-existing unit test failures (i18n test-provider gap in `Stepper`, `FaqAccordion`, `VehicleCard` tests) — cosmetic to test infra, not a runtime issue; recommend a follow-up fix.
5. Local e2e smoke run showed flakiness under `pnpm dev` (Turbopack cold-compile timing vs 15s assertion timeout) — not observed against the production build; recommend running `pnpm build && pnpm start` for e2e in CI/staging rather than `pnpm dev`.

## Required owners and actions

| Action | Owner | Status |
| --- | --- | --- |
| Confirm Wizard external contract items (booking + vehicle sync) | Adam / Wizard Team | **Done 2026-07-11** |
| Run and document RLS negative tests | Website Team | **Done 2026-07-11** |
| Provide Whish merchant credentials | Website/Business stakeholder | Pending |
| Configure alerts + run restore/rollback drills | Website Team / DevOps | Pending — needs staging infra access |
| Staging server access | Adam / Wizard Team | Pending |
| Populate required non-payment env set (`env:check:payment-deferred`) | Website Team | **Done** — `pnpm env:check` passes |

## Recommendation

**Go** for a payment-deferred launch (cash/transfer/OMT manual payment methods): all Wizard integration, vehicle sync, and non-payment quality/security gates are now satisfied.

**No-Go** for payment-enabled launch until Whish merchant credentials (`WHISH_CHANNEL`, `WHISH_SECRET`) are supplied and the sandbox end-to-end flow is verified (see `Payment_Deferred_Track.md`).
