# Launch Gate — Wizard External Sign-Off Register

Status: In progress
Owner: Website Team + Wizard Team (Adam)
Last updated: 2026-06-22

## Ownership boundaries (confirmed by Adam, 2026-06-22)

| Item | Adam confirmation | Website alignment | Status |
| --- | --- | --- | --- |
| Wizard = ops rental data | Vehicles, availability, bookings, status, sync | No Wizard DB writes; public + internal API only | Confirmed |
| Website = CMS, checkout, payments, comms | Marketing content, payment flow, customer comms | Supabase CMS, Next.js APIs, Whish | Confirmed |
| Customer identity | Email on website; phone primary in Wizard | Email validated at checkout; ref+email lookup | Confirmed |
| Cancel/refund | Website-owned; Wizard status changes after ops approval | `cancel_request` sync; no public Wizard cancel | Confirmed |
| CMS/marketing data | Website/CMS owned | Catalog in Supabase | Confirmed |
| Configurable domains/CORS | Wizard settings/API section; not hardcoded | `NEXT_PUBLIC_SITE_URL`, `WEBSITE_URL` env-driven | Confirmed (website); Wizard config TBD in next revision |

Archive: [Adam_Response_System_Boundaries.md](./Adam_Response_System_Boundaries.md)

## Required external confirmations (still pending)

| Item | Requested from Wizard | Status | Owner | Target date |
| --- | --- | --- | --- | --- |
| `WIZARD_API_TOKEN` | Staging (then prod) bearer token for sync-status | Pending | Adam | TBD |
| Vehicle ID map | Full `vehicle_id` list for `vehicle_wizard_map` | Pending | Adam | TBD |
| Staging server access | SSH/deploy for Next.js website stack | Pending | Adam | TBD |
| Rate limits | Final per-endpoint limits for staging/prod | Pending (next API revision) | Adam | TBD |
| Sanitized errors | Confirm 429/4xx sanitized envelope in all envs | Pending (next API revision) | Adam | TBD |
| `sync_type` enum | Authoritative allowed values list | Pending | Adam | TBD |
| Sync idempotency | Replay/idempotency policy for `sync-status` | Pending | Adam | TBD |
| Internal token lifecycle | Rotation, expiry, staging/prod separation | Pending | Adam | TBD |
| `public_token` behavior | Rotation/expiry/backward compatibility window | Pending | Adam | TBD |
| Status enum roadmap | Plan for request-like states in Wizard | Partial — use `sync_type` until first-class states; Wizard changes status after approval | Adam | TBD |
| Promo codes | Website-side validation vs Wizard validation (Elie) | Pending | Adam / Elie | TBD |

## Evidence package sent

- External clarifications are captured in:
  - `docs/Integration/API_Gap_Analysis.md`
  - `docs/Integration/Email_to_Backend_Team.md`
  - `docs/Integration/Adam_Response_System_Boundaries.md`
- Sync mapping implementation reference:
  - `lib/api/wheels-public/sync-status.ts`
  - `lib/server/wizard-sync.ts`

## Latest outreach

- 2026-06-06: register refreshed, pending items normalized to explicit target date 2026-06-10.
- 2026-06-22: Marc sent launch blockers email ([Email_to_Adam_Launch_Blockers.md](./Email_to_Adam_Launch_Blockers.md)).
- 2026-06-22: Adam replied with system boundary clarification; blockers not yet delivered ([Adam_Response_System_Boundaries.md](./Adam_Response_System_Boundaries.md)).
- Next action: Marc sends follow-up ([Email_to_Adam_Followup_Launch_Blockers.md](./Email_to_Adam_Followup_Launch_Blockers.md)) re-requesting token, vehicle map, access, and contract confirmations.

## Exit criteria

- All rows in "Required external confirmations" marked Confirmed or Delivered.
- Confirmation archived in writing (email/thread).
- Any contract deltas reflected in docs and tests before go-live.
