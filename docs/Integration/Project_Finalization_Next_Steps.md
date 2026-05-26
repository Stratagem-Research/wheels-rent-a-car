# Project Finalization — Next Steps

## Already done

- P0 public API alignment (reference, token, lookup, status, block-until).
- Endpoint boundary split enforced (public vs internal).
- Sync-status mapping implemented with enum fallback behavior.
- Unit tests and live integration coverage updated for new P0 flows.
- Core integration docs refreshed to reflect updated ownership.
- Supabase foundation wired in repo (`lib/supabase/*`, server env validation).
- Initial website-owned schema migrations created (`supabase/migrations/*`).
- Auth route layer scaffolded under `app/api/auth/*`.
- Hybrid payment route scaffolding added for Whish (`app/api/payments/whish/*`).
- Server-side Wizard sync dispatcher scaffolded (`lib/server/wizard-sync.ts`).

## Remaining to launch

1. Complete website-owned backend implementation (payment events, notifications, cancellation/refund orchestration).
2. Provision Supabase project and apply initial migrations.
3. Configure staging env and run full staging rehearsal.
4. Confirm remaining Wizard clarifications listed in `API_Gap_Analysis.md`.

## Remaining post-launch

- Customer accounts and full account dashboard backend integration.
- Expanded analytics/reconciliation dashboards.
- Optional migration of marketing metadata from fixtures to CMS-backed storage.

## Dependencies / blockers

- Internal token lifecycle and sync enum confirmations from Wizard team.
- Final infrastructure provisioning for website backend + DB + worker.
- Payment provider production credentials and webhook verification.
- Launch gate pass on security, payment, and operations checks.

## Suggested sequencing and owners

- Website team: backend services + DB + deployment + runbooks.
- Wizard team: confirm unresolved contract clarifications.
- Joint: staging end-to-end rehearsal and launch sign-off.

## Open questions to send Adam

- Rate limits per endpoint and environment.
- `sync_type` allowed values and idempotency policy.
- Internal token rotation/expiry process.
- Public token rotation behavior and backward compatibility window.

## Launch gate execution order

1. Security gate (secret rotation, RLS negative tests, session hardening).
2. Payment gate (Whish authoritative verification, replay/idempotency, mismatch rejection).
3. Ops gate (alerts, backup/restore drill, rollback drill).
4. External sign-off capture (Wizard clarifications).
5. Final go/no-go memo.
