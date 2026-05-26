# 21 — Website Deployment and Ops

## Scope

Operational requirements for website-owned backend/services that complement the frontend.

## Runtime components

- Next.js application runtime.
- Website API/backend workers (payment webhooks, sync dispatcher, notifications).
- Website database.
- Queue worker for async tasks.
- Supabase Auth + Postgres + Storage services.
- Whish payment callback endpoints.

## Service boundaries

- Public browser traffic -> website routes/public APIs.
- Website backend -> Wizard internal sync API (token-protected, server-to-server only).
- Payment provider webhooks -> website backend webhook endpoints.
- Whish callback/status verification -> website payment routes only (server-side).

## Operational expectations

- Structured logs for web + worker processes.
- Error reporting integrated in web and worker contexts.
- Health checks for app, DB, and queue dependencies.
- Secret rotation process for internal API token and payment keys.
- Idempotent payment callback handling and replay protection.
- Alerting on sync-status retry exhaustion and payment callback failures.

## Backup and recovery

- Daily DB backups with retention policy.
- Restore drill documented and tested.
- Incident runbook for sync failures and payment reconciliation mismatches.

## Launch gate checklist linkage

Operational release is blocked until:

- security gate passes (secret exposure + RLS negative tests),
- payment gate passes (authoritative status checks + idempotency),
- ops gate passes (alerts + backup/restore + rollback drill),
- external sign-off clarifications from Wizard are documented.
