# Payment Deferred Track

Status: Deferred (not in current launch scope)  
Owner: Website Team  
Last updated: 2026-06-06

## Purpose

Track the payment hardening work that is intentionally excluded from the current non-payment launch decision.

## Deferred gates (must pass before payment go-live)

1. **Replay/idempotency**
   - Duplicate callback for same `external_id` must not create duplicate terminal transitions.
   - Verify idempotency behavior in `lib/server/payment-events.ts`.

2. **Amount/currency mismatch rejection**
   - Callback payload mismatch versus expected order totals must be rejected and logged.
   - Validate rejection path in `app/api/payments/whish/callback/success/route.ts`.

3. **End-to-end sandbox flow**
   - Create payment -> redirect -> callback -> authoritative status check -> sync dispatch.
   - Validate route + persistence behavior under `app/api/payments/whish/*`.

4. **Operational readiness**
   - Alerting on callback failures and reconciliation mismatches.
   - Runbook for manual reconciliation and replay.

5. **Credential cutover**
   - Production credential handoff and rotation sign-off.
   - Verify secret manager + deployment environment alignment.

## Test commands

- Unit/integration baseline:
  - `pnpm test`
- Whish live integration validation (controlled run):
  - `RUN_LIVE_API_TESTS=1 pnpm test -- tests/integration/wheels-public.live.test.ts`
- Staging callback drills:
  - manual replay/mismatch scripts + documented evidence in launch gate reports

## Exit criteria

- Payment gate in `docs/Integration/LaunchGate_Payment_Report.md` is marked **Pass**.
- Go/No-Go memo reissued for payment-enabled launch.
