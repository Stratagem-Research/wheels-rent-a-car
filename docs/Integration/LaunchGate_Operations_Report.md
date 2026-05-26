# Launch Gate — Operations Report

Status: In progress (staging operations drills pending)
Owner: Website Team
Last updated: 2026-05-26

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
- Production build health:
  - `pnpm build` passed

## Pending operations gate checks

1. **Alerting setup**
   - Configure alerts for:
     - payment callback failures
     - sync-status retry exhaustion
     - auth anomaly spikes

2. **Backup and restore drill**
   - Execute Supabase backup restore drill.
   - Record RTO/RPO and restore validation evidence.

3. **Rollback drill**
   - Toggle `NEXT_PUBLIC_USE_REAL_BOOKING_API=false`.
   - Disable sync dispatcher endpoint/job.
   - Validate recovery path and timing.

4. **Recovery timing**
   - Record incident response timeline for simulated sync failure.

## Evidence references

- Server requirements: `docs/Integration/Handoff_Server_Requirements.md`
- Env handoff: `docs/Integration/Handoff_Env_Variables.md`
- Staging runbook: `docs/Integration/Handoff_Staging_Runbook.md`
