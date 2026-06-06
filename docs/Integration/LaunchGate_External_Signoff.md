# Launch Gate — Wizard External Sign-Off Register

Status: In progress
Owner: Website Team + Wizard Team (Adam)
Last updated: 2026-06-06

## Required external confirmations

| Item | Requested from Wizard | Status | Owner | Target date |
| --- | --- | --- | --- | --- |
| Rate limits | Final per-endpoint limits for staging/prod | Pending external response | Adam | 2026-06-10 |
| Sanitized errors | Confirm 429/4xx sanitized envelope in all envs | Pending external response | Adam | 2026-06-10 |
| `sync_type` enum | Authoritative allowed values list | Pending external response | Adam | 2026-06-10 |
| Sync idempotency | Replay/idempotency policy for `sync-status` | Pending external response | Adam | 2026-06-10 |
| Internal token lifecycle | Rotation, expiry, staging/prod separation | Pending external response | Adam | 2026-06-10 |
| `public_token` behavior | Rotation/expiry/backward compatibility window | Pending external response | Adam | 2026-06-10 |
| Status enum roadmap | Plan for request-like states in Wizard | Pending external response | Adam | 2026-06-10 |

## Evidence package sent

- External clarifications are captured in:
  - `docs/Integration/API_Gap_Analysis.md`
  - `docs/Integration/Email_to_Backend_Team.md`
- Sync mapping implementation reference:
  - `lib/api/wheels-public/sync-status.ts`
  - `lib/server/wizard-sync.ts`

## Latest outreach

- 2026-06-06: register refreshed, pending items normalized to explicit target date 2026-06-10.
- Next action: resend consolidated clarification request and attach this register + gap analysis.

## Exit criteria

- All rows above marked Confirmed.
- Confirmation archived in writing (email/thread).
- Any contract deltas reflected in docs and tests before go-live.
