# Demo smoke test results (adoring-hugle)

Date: 2026-06-22  
Environment: `https://adoring-hugle.85-215-232-144.plesk.page/api/public`

## Public API (no token required)

| Check | Result |
| --- | --- |
| `GET /availability` | Pass — returns vehicles (e.g. id 131 MICRA) |
| `./scripts/wheels-api-smoke.sh` (public steps) | Pass — booking created on demo (WRC-260628-9KXG) |

## Vehicle sync (internal, bearer-authenticated)

Confirmed 2026-06-30: source is `GET /api/v1/vehicles/sync` (not `/api/public/vehicles`). The earlier availability bootstrap is removed; the client now calls the internal endpoint directly.

| Check | Status |
| --- | --- |
| `pnpm wizard:sync-vehicles` | Pending `WHEELS_INTERNAL_API_TOKEN` (bearer auth required) |
| Incremental `?updated_since=` | Implemented; verify once token set |

## Blocked on secure-channel token

| Check | Status |
| --- | --- |
| `POST /booking-request` full smoke | Pending `WHEELS_INTERNAL_API_TOKEN` |
| `POST /api/v1/bookings/{ref}/sync-status` | Pending token |
| `RUN_LIVE_API_TESTS=1` full suite | Pending token |

## When token arrives

1. Set in `.env`:
   - `WHEELS_INTERNAL_API_TOKEN=<secure channel>`
2. Run `pnpm wizard:sync-vehicles` to populate `wizard_vehicles` from `GET /api/v1/vehicles/sync`
3. Run `./scripts/wheels-api-smoke.sh`
4. Run `RUN_LIVE_API_TESTS=1 pnpm test -- tests/integration/wheels-public.live.test.ts`
5. Share output with Adam
