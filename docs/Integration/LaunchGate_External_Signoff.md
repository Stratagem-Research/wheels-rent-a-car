# Launch Gate — Wizard External Sign-Off Register

Status: In progress
Owner: Website Team + Wizard Team (Adam)
Last updated: 2026-05-26

## Required external confirmations

| Item | Requested from Wizard | Status | Owner | Target date |
| --- | --- | --- | --- | --- |
| Rate limits | Final per-endpoint limits for staging/prod | Pending | Adam | TBD |
| Sanitized errors | Confirm 429/4xx sanitized envelope in all envs | Pending | Adam | TBD |
| `sync_type` enum | Authoritative allowed values list | Pending | Adam | TBD |
| Sync idempotency | Replay/idempotency policy for `sync-status` | Pending | Adam | TBD |
| Internal token lifecycle | Rotation, expiry, staging/prod separation | Pending | Adam | TBD |
| `public_token` behavior | Rotation/expiry/backward compatibility window | Pending | Adam | TBD |
| Status enum roadmap | Plan for request-like states in Wizard | Pending | Adam | TBD |

## Evidence package sent

- External clarifications are captured in:
  - `docs/Integration/API_Gap_Analysis.md`
  - `docs/Integration/Email_to_Backend_Team.md`
- Sync mapping implementation reference:
  - `lib/api/wheels-public/sync-status.ts`
  - `lib/server/wizard-sync.ts`

## Exit criteria

- All rows above marked Confirmed.
- Confirmation archived in writing (email/thread).
- Any contract deltas reflected in docs and tests before go-live.
