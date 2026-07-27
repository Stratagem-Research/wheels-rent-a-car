# Launch Gate — Payment Report

Status: Payment-deferred **Pass**; payment-enabled **Partial** (Whish hardening progressed)
Owner: Website Team
Last updated: 2026-07-27

## Payment modules (Adam requirement)

| Module | Code | Env toggle | Launch default |
| --- | --- | --- | --- |
| Cash | Yes | `PAYMENT_METHOD_CASH` | On |
| Bank transfer | Yes | `PAYMENT_METHOD_TRANSFER` | On |
| OMT | Yes (standalone) | `PAYMENT_METHOD_OMT` | On |
| Whish online | Yes | `PAYMENT_METHOD_WHISH_ONLINE` + creds | Off |
| Bank Audi NEO | Yes (sandbox) | `PAYMENT_METHOD_NEO` + creds | Off |

Config: `lib/server/payment-methods.ts` exposed via `/api/site-config`.

## Completed (2026-07-27)

- [x] Per-method env toggles
- [x] Whish callback **idempotency** (duplicate success → no double sync)
- [x] Whish callback **amount mismatch** rejection
- [x] Unit tests: Whish create, Whish callback, NEO create, NEO callback
- [x] E2E scaffold: `tests/e2e/checkout-neo.spec.ts` (gated `RUN_LIVE_E2E=1`)

## Pending (payment-enabled launch)

- [ ] Whish sandbox E2E with real `WHISH_CHANNEL` / `WHISH_SECRET`
- [ ] NEO production API wiring when Bank Audi credentials arrive
- [ ] Operational alerting on callback failures

See `Payment_Deferred_Track.md` for exit criteria.
