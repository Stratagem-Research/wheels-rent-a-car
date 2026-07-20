# Availability → Submit — Repro Log

Date: 2026-07-20  
Status: **Resolved on website side** — parity probe passes after fixes.

## Baseline (before fixes)

| Check | Result |
| --- | --- |
| `./scripts/wheels-api-smoke.sh --no-write` (far-future) | 7/7 pass |
| Near-term availability (`2026-07-21` → `2026-07-24`) | 41 vehicles returned |
| Immediate submit after repeated tests | **429** rate limit (demo throttling) |

Root causes identified on our side:

1. SearchBar datetimes (`YYYY-MM-DDTHH:mm`) parsed with server-local `Date` — now treated as Asia/Beirut wall clock.
2. Draft sync skipped location/promo when dates unchanged — fixed in `VehiclesClient`.
3. Checkout 409 redirect dropped search params — now preserves `pickupAt`/`returnAt` via `draftToSearchParams`.
4. Delivery address validated but not merged into draft — fixed at checkout submit.
5. No pre-submit per-vehicle availability check — added `getVehicleAvailability` guard.
6. 429 surfaced as generic 502 — mapped to HTTP 429 with distinct UI toast.

## Post-fix parity probe results

```bash
pnpm booking:parity-probe --pickup "2027-04-15 10:00" --return "2027-04-19 10:00"
# SUCCESS — WRC-260720-SXBJ (vehicle 139, datetimes match, pickup_address=1)

pnpm booking:parity-probe --frontend-dates --pickup "2027-05-20T10:00" --return "2027-05-23T10:00"
# SUCCESS — WRC-260720-CRJS (SearchBar-style datetimes, parity match)
```

Parity checks confirmed:

- `start_date_time` / `end_date_time` match between availability query and submit payload
- `GET /availability/{id}` returns `is_available: true` before submit
- `POST /booking-request` succeeds on first attempt

## Manual browser checklist (Fatema)

Run when validating in the UI:

1. Clear `sessionStorage` key `wheels.booking.draft` in DevTools.
2. Search with dates → confirm URL has `pickupAt`, `returnAt`, `pickupLoc`.
3. Select vehicle → complete funnel → checkout (cash).
4. In Network tab, compare:
   - URL params on `/vehicles`
   - `sessionStorage` draft datetimes
   - POST `/api/booking/submit` body → `draft.pickup.datetime` / `draft.return.datetime`
5. Note response status: **409** (unavailable) vs **429** (rate limited) vs **200** (success).
6. On 409, confirm redirect returns to `/vehicles?step=1&pickupAt=...&returnAt=...` (dates preserved).

## Escalation to Adam

**Not required** as of 2026-07-20 — website-side parity probe passes end-to-end on demo API.

Re-open `Email_to_Adam_Availability_Submit_409.md` only if manual UI repro captures:

- Same vehicle + datetimes + addresses
- `GET /availability` shows available
- Immediate `POST /booking-request` returns 409

Include exact JSON payloads from `pnpm booking:parity-probe` failure output.

## Commands

```bash
pnpm wizard:sync-vehicles
pnpm booking:parity-probe
pnpm booking:parity-probe --frontend-dates
./scripts/wheels-api-smoke.sh --no-write
pnpm test -- lib/server/__tests__/booking-service.test.ts lib/booking/wizard-address-id.test.ts
```
