# Launch Gate — Operations Report

Status: In progress (backup/restore + alerting drills pending; rollback path verified)
Owner: Website Team
Last updated: 2026-07-11

## Implemented ops surfaces

- Notification outbox processor route:
  - `app/api/notifications/process/route.ts`
- Wizard sync dispatch with failure logging:
  - `lib/server/wizard-sync.ts`
  - logs failures to `notification_logs`
- Staging runbook updated:
  - `docs/Integration/Handoff_Staging_Runbook.md`

## Completed checks

- Quality gates:
  - `pnpm typecheck` passed
  - `pnpm lint` passed
  - `pnpm test` passed
  - `pnpm test:e2e:smoke --project=chromium` passed (payment-deferred scope)
- Production build health:
  - `pnpm build` passed
- API health checks (local runtime):
  - `/api/health` -> `200`
  - `/api/site-config` -> `200`
  - `/api/cms/trips` -> `401` (expected without admin session)
- Environment readiness checks:
  - Added `pnpm env:check` and `pnpm env:check:payment-deferred`
  - Current local `.env` fails payment-deferred check due missing:
    - `NEXT_PUBLIC_SITE_URL`
    - `WHEELS_INTERNAL_API_BASE_URL`
    - `WHEELS_INTERNAL_API_TOKEN`
    - `ADMIN_PASSWORD`
    - `ADMIN_SESSION_SECRET`
- DB connectivity — resolved 2026-07-11 via Supabase pooler host (see `LaunchGate_Security_Report.md`); `./scripts/run-rls-negative-tests.sh` now passes.
- Live Wizard integration — resolved 2026-07-11:
  - `pnpm wizard:sync-vehicles` populated `wizard_vehicles` (65 rows) from the live `GET /api/v1/vehicles/sync`.
  - `./scripts/wheels-api-smoke.sh` passes 7/7 (public + internal sync-status).
  - `NEXT_PUBLIC_USE_REAL_BOOKING_API=true` verified locally.
  - See `Vehicle_Sync_Live_Verification.md`.
- Rollback drill — partially verified 2026-07-11:
  - Toggling `NEXT_PUBLIC_USE_REAL_BOOKING_API=false` falls back to mocked booking handlers (`lib/api/mocks/handlers.ts`); no code changes needed to revert.
  - Full timed drill (disable sync dispatcher, measure recovery) still pending in a real staging environment.

## Pending operations gate checks

1. **Alerting setup**
   - Configure alerts for:
     - payment callback failures
     - sync-status retry exhaustion
     - auth anomaly spikes
   - Requires Sentry/monitoring dashboard access (`SENTRY_DSN` currently unset locally) — not achievable from this environment; needs staging/production project access.

2. **Backup and restore drill**
   - Execute Supabase backup restore drill.
   - Record RTO/RPO and restore validation evidence.
   - Requires Supabase CLI + project admin access (not available in this environment — `supabase` CLI not installed/linked here).

3. **Rollback drill (full)**
   - Env toggle verified (see above). Still need: disable sync dispatcher endpoint/job under load and measure real recovery timing in staging.

4. **Recovery timing**
   - Record incident response timeline for simulated sync failure.

## Evidence references

- Server requirements: `docs/Integration/Handoff_Server_Requirements.md`
- Env handoff: `docs/Integration/Handoff_Env_Variables.md`
- Staging runbook: `docs/Integration/Handoff_Staging_Runbook.md`
