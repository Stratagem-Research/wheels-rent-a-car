# 19 — Backend Public API (Wheels Laravel)

> Route(s): n/a (integration layer)
> Depends on: `00_global.md`, `04_booking_flow.md`
> Related: `docs/Integration/API_Gap_Analysis.md`, `lib/api/wheels-public/*`

---

## Purpose & current scope

This module bridges the website booking flow to Wheels Laravel public endpoints.

Public endpoints currently wired:

- `GET /api/public/availability`
- `GET /api/public/availability/{id}`
- `POST /api/public/booking-request`
- `GET /api/public/bookings/{reference}?email=...`
- `GET /api/public/booking-status/{public_token}`

Internal endpoint (server-to-server only, never browser):

- `POST /api/v1/bookings/{reference}/sync-status`

Everything else remains website-owned or mocked based on ownership boundaries.

---

## Ownership split (locked)

- Wizard-owned: operational vehicle IDs, availability, booking creation, canonical booking `reference`, `public_token`, public lookup/status, operational block time, internal sync-status endpoint.
- Website-owned: vehicle marketing metadata, payment orchestration, cancellation/refund orchestration, customer notifications, long-term enquiries, website database, deployment/ops.

---

## Adapter rules

- Money: backend dollars -> frontend integer cents.
- Time: backend `YYYY-MM-DD HH:mm[:ss]` in `Asia/Beirut` -> frontend ISO UTC.
- Booking reference: backend `reference` is canonical; synthetic fallback is only used if absent during rollout.
- `internal_block_until`: operational-only metadata. Customer-facing return time uses `end_date_time`.
- Vehicle IDs: mapping `{frontendId -> backendId}` stored in session storage for submit continuity.

---

## Error model

- `409` -> `VehicleUnavailableError`
- `429` -> `WheelsThrottledError` (reads `Retry-After` when present)
- 5xx -> `ApiError` after retry policy
- Schema drift -> `WheelsValidationError`
- Network/abort -> `WheelsNetworkError`

Expected sanitized error envelope:

```json
{ "success": false, "message": "..." }
```

---

## Internal sync-status contract

The website backend sends updates to Wizard through:

- `POST /api/v1/bookings/{reference}/sync-status` with bearer token.

Mapped payload fields:

- `status`
- `payment_status`
- `paid_amount`
- `payment_method`
- `payment_reference`
- `payment_date`
- `sync_type`
- `message`

Current enum constraint:

- Wizard status enum does not yet support request-like states (`cancel_requested`, `change_requested`, `refund_requested`).
- Website uses `status: "pending"` + `sync_type` (`cancel_request`, `change_request`, `refund_request`) for those flows.

---

## Environment variables

- `NEXT_PUBLIC_WHEELS_API_BASE_URL`
- `NEXT_PUBLIC_USE_REAL_BOOKING_API`
- `WHEELS_INTERNAL_API_BASE_URL`
- `WHEELS_INTERNAL_API_TOKEN`
- `RUN_LIVE_API_TESTS`

---

## Verification

- `pnpm test -- lib/api/wheels-public/__tests__/...`
- `RUN_LIVE_API_TESTS=1 pnpm test -- tests/integration/wheels-public.live.test.ts`
- `./scripts/wheels-api-smoke.sh`

---

## Acceptance criteria

- Public lookup uses backend endpoint as primary path.
- Canonical booking reference comes from backend response.
- Public status polling works with `public_token`.
- Internal sync-status payload mapping is tested.
- No browser path calls internal Wizard endpoint.
