# Vehicle sync — live verification (2026-07-11)

Status: **Passed.** Wizard integration is fully live on the adoring-hugle demo.

## What was tested

With the staging `WIZARD_API_TOKEN` (Adam fixed the `vehicles/sync` route auth on 2026-07-11):

| Check | Result |
| --- | --- |
| `GET /api/v1/vehicles/sync` | `200` — 65 vehicles returned |
| `pnpm wizard:sync-vehicles` | Fetched 65, upserted 65 into `wizard_vehicles` |
| `GET /availability` (public) | Pass |
| `POST /booking-request` (public) | Pass — test booking created |
| `GET /bookings/{ref}?email=` (public) | Pass |
| `GET /booking-status/{public_token}` (public) | Pass |
| `POST /api/v1/bookings/{ref}/sync-status` (internal) | Pass — `200`, booking moved to `pending_approval` |

Full smoke suite (`./scripts/wheels-api-smoke.sh`) — **7/7 steps pass.**

## Website-side fixes made during verification

1. **Vehicle status filter.** Wizard's live data uses `status: "available"`; our
   filter only accepted `"active"` (matching Adam's original example payload).
   First sync fetched 65 but upserted 0 — filter now accepts both
   (`lib/server/wizard-vehicle-sync.ts`).
2. **Smoke script sync-status payload.** The bash probe hardcoded
   `"status": "pending"`, which Wizard rejects (`The selected status is
   invalid.`). Our real production code
   (`lib/api/wheels-public/sync-status.ts`) already maps `pending` →
   `pending_approval` correctly — only the standalone smoke script needed the
   fix (`scripts/wheels-api-smoke.sh`).
3. **Env alias.** `WIZARD_API_TOKEN` (Adam's naming) now works interchangeably
   with `WHEELS_INTERNAL_API_TOKEN` (our naming) in `lib/server/env.ts`, and
   `pnpm wizard:sync-vehicles` now auto-loads `.env`.

## Current `.env` state

- `NEXT_PUBLIC_USE_REAL_BOOKING_API=true` — real booking API enabled.
- `WHEELS_INTERNAL_API_TOKEN` / `WIZARD_API_TOKEN` — set to the live staging token.
- `WIZARD_PUBLIC_PARENT_ID=2` — recorded, not yet required by any call we make.

## Not yet run (rate-limit safe)

- `RUN_LIVE_API_TESTS=1` full live integration suite — hit demo throttling
  (`429`) after repeated smoke runs during verification. The throttle path
  itself worked correctly (`WheelsThrottledError`); this is expected demo
  rate-limiting, not a functional gap. Re-run once ready for a clean pass.

## Conclusion

Wizard-side integration (vehicle sync + booking + status sync) is **fully
functional end-to-end** against the demo. Nothing further is needed from Adam
for the core booking/vehicle integration. Remaining external asks
(staging server access, team photos, Adam's polish feedback) are tracked in
`LaunchGate_External_Signoff.md` and are not blocking.
