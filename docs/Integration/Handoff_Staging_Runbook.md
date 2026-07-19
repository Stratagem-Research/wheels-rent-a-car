# Handoff — Staging Runbook

## Goal

Validate full website + Wizard integration in staging before production cutover.

## Pre-flight checklist

- Environment variables populated (public + server-only).
- DB migrations applied.
- Web and worker processes healthy.
- Internal sync token provisioned for staging.
- Payment scope decision recorded (`full` or `payment-deferred`).

## Validation steps

1. Run quality checks:
   - `pnpm env:check` (or `pnpm env:check:payment-deferred`)
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm test`
   - `pnpm test:e2e:smoke --project=chromium`
2. Run contract smoke:
   - `./scripts/wheels-api-smoke.sh --base-url <staging-public-api-url>`
3. Run live integration suite:
   - `RUN_LIVE_API_TESTS=1 pnpm test -- tests/integration/wheels-public.live.test.ts`
4. Manual booking flow:
   - availability -> checkout -> booking submit -> confirmation lookup.
5. Validate status polling by `public_token`.
6. Execute Whish sandbox flow end-to-end:
   - create payment -> callback success/failure -> authoritative status verification.
7. Trigger server-side sync-status dispatch and verify Wizard receives mapped payload.
8. Execute launch gates:
   - security (`pnpm security:rls:negative` + secret exposure checks)
   - payment (replay/idempotency + amount mismatch rejection)
   - ops (alerts + backup/restore + rollback drill)

## Observability checks

- Confirm no schema validation errors in logs/Sentry.
- Confirm no 5xx spikes on booking endpoints.
- Confirm worker retries/reconciliation jobs complete.
- Confirm no service-role key leakage in client bundles/logs.

## Rollback

- Roll back the deployment if the public booking API integration regresses;
  there is no in-memory/mock booking fallback.
- Disable internal sync dispatcher if Wizard internal endpoint degrades.
- Restore latest DB snapshot if website-owned state corruption is detected.
