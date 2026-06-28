# Demo smoke test results (adoring-hugle)

Date: 2026-06-22  
Environment: `https://adoring-hugle.85-215-232-144.plesk.page/api/public`

## Public API (no token required)

| Check | Result |
| --- | --- |
| `GET /availability` | Pass — returns vehicles (e.g. id 131 MICRA) |
| `GET /vehicles` (sync endpoint) | **404** — not deployed; website uses availability bootstrap |
| `pnpm wizard:sync-vehicles` | Pass — 64 vehicles upserted via availability bootstrap |
| `./scripts/wheels-api-smoke.sh` (public steps) | Pass — booking created on demo (WRC-260628-9KXG) |

## Blocked on secure-channel token

| Check | Status |
| --- | --- |
| `POST /booking-request` full smoke | Pending `WHEELS_INTERNAL_API_TOKEN` |
| `POST /api/v1/bookings/{ref}/sync-status` | Pending token |
| `RUN_LIVE_API_TESTS=1` full suite | Pending token + `NEXT_PUBLIC_USE_REAL_BOOKING_API=true` |

## When token arrives

1. Set in `.env`:
   - `WHEELS_INTERNAL_API_TOKEN=<secure channel>`
   - `NEXT_PUBLIC_USE_REAL_BOOKING_API=true`
2. Run `pnpm wizard:sync-vehicles` to populate `wizard_vehicles`
3. Run `./scripts/wheels-api-smoke.sh`
4. Run `RUN_LIVE_API_TESTS=1 pnpm test -- tests/integration/wheels-public.live.test.ts`
5. Share output with Adam
