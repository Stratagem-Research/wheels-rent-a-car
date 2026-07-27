# Launch Gate — Wizard External Sign-Off Register

Status: In progress
Owner: Website Team + Wizard Team (Adam)
Last updated: 2026-07-27

## Ownership boundaries (confirmed by Adam, 2026-06-22)

| Item | Adam confirmation | Website alignment | Status |
| --- | --- | --- | --- |
| Wizard = ops rental data | Vehicles, availability, bookings, status, sync | No Wizard DB writes; public + internal API only | Confirmed |
| Website = CMS, checkout, payments, comms | Marketing content, payment flow, customer comms | Supabase CMS, Next.js APIs, Whish | Confirmed |
| Customer identity | Email on website; phone primary in Wizard | Email validated at checkout; ref+email lookup | Confirmed |
| Cancel/refund | Website-owned; Wizard status changes after ops approval | `cancel_request` sync; no public Wizard cancel | Confirmed |
| CMS/marketing data | Website/CMS owned | Catalog in Supabase | Confirmed |
| Configurable domains/CORS | Wizard settings/API section; not hardcoded | `NEXT_PUBLIC_SITE_URL`, `WEBSITE_URL` env-driven | Confirmed (website); Wizard config TBD in next revision |
| Promo codes | Website-side validation at launch | Supabase promotions + payload pass-through | Confirmed (2026-06-22) |
| Vehicle catalog | Wizard sync API, not manual map | `wizard_vehicles` + `vehicle_metadata` enrichment | Agreed architecture |

Archives: [Adam_Response_System_Boundaries.md](./Adam_Response_System_Boundaries.md), [Adam_Response_Demo_And_Vehicle_Sync.md](./Adam_Response_Demo_And_Vehicle_Sync.md)

## API environment URLs

| Environment | Public API | Internal API | Status |
| --- | --- | --- | --- |
| Demo (current) | `https://adoring-hugle.85-215-232-144.plesk.page/api/public` | `https://adoring-hugle.85-215-232-144.plesk.page/api/v1` | Active |
| Production (planned) | `https://system.wheelsrentacar.com.lb/api/public` | `https://system.wheelsrentacar.com.lb/api/v1` | Documented |
| Retired | `lucid-mclean...` | — | Do not use |

## Required external confirmations

| Item | Requested from Wizard | Status | Owner | Target date |
| --- | --- | --- | --- | --- |
| `WIZARD_API_TOKEN` | Staging bearer token via secure channel | **Delivered and verified 2026-07-11** — works for `sync-status` and `vehicles/sync` | Adam | Done |
| Vehicle sync API | Internal `GET /api/v1/vehicles/sync` (bearer); schema confirmed | **Live and verified 2026-07-11** — 65 vehicles synced into `wizard_vehicles` | Adam / Website | Done |
| Staging server access | SSH/deploy for Next.js website stack | Pending | Adam | TBD |
| Rate limits | Final per-endpoint limits for staging/prod | Agreed for next Wizard revision | Adam | TBD |
| Sanitized errors | 429/4xx sanitized JSON envelope | Agreed for next Wizard revision | Adam | TBD |
| `sync_type` enum | Fixed enum (`payment_confirmed`, `cancel_request`, etc.) | Agreed for next Wizard revision | Adam | TBD |
| Sync idempotency | Idempotent `sync-status` replay | Agreed for next Wizard revision | Adam | TBD |
| Internal token lifecycle | Rotation, expiry, staging/prod separation | Pending | Adam | TBD |
| `public_token` lifecycle | Rotation, expiry, backward-compat window | Agreed for next Wizard revision | Adam | TBD |
| Status enum roadmap | First-class request states | Partial — continue `sync_type` + compatible status | Adam | Confirmed approach |
| `vehicle_wizard_map` (manual) | Staging-only fallback | Deprecated; use sync | Website | Retained for emergency |

## Evidence package sent

- External clarifications:
  - `docs/Integration/API_Gap_Analysis.md`
  - `docs/Integration/Adam_Response_System_Boundaries.md`
  - `docs/Integration/Adam_Response_Demo_And_Vehicle_Sync.md`
- Sync mapping: `lib/api/wheels-public/sync-status.ts`, `lib/server/wizard-sync.ts`
- Vehicle sync: `lib/server/wizard-vehicle-sync.ts`

## Latest outreach

- 2026-06-22: Adam boundary reply archived.
- 2026-06-22: Adam demo URL + vehicle sync reply archived ([Adam_Response_Demo_And_Vehicle_Sync.md](./Adam_Response_Demo_And_Vehicle_Sync.md)).
- 2026-06-30: Vehicle sync endpoint confirmed; website implementation complete ([Adam_Response_Vehicle_Sync_Endpoint.md](./Adam_Response_Vehicle_Sync_Endpoint.md)).
- 2026-07-08: Status update sent while awaiting token ([Email_to_Adam_Status_Update.md](./Email_to_Adam_Status_Update.md)).
- 2026-07-09: Staging token received; `sync-status` works but `vehicles/sync` returns 401 — draft follow-up ([Email_to_Adam_Vehicle_Sync_401.md](./Email_to_Adam_Vehicle_Sync_401.md)).
- 2026-07-11: Adam fixed `vehicles/sync` auth. Live verification: `pnpm wizard:sync-vehicles` fetched 65 vehicles, upserted 65 into Supabase; full public + internal smoke suite (7/7 steps) passes. See [Vehicle_Sync_Live_Verification.md](./Vehicle_Sync_Live_Verification.md).
- Next: await staging server access, Elie's team photos, and Adam's site polish feedback doc. Whish payment credentials remain the only launch blocker on the website side.

## Exit criteria

- All blocking rows marked Confirmed or Delivered.
- Confirmation archived in writing.
- Contract deltas reflected in docs and tests before go-live.
