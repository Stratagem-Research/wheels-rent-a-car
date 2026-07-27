# Launch Gate — Operations Report

Status: Staging deploy + alerting drills pending; CI smoke green
Owner: Website Team
Last updated: 2026-07-27

## Implemented ops surfaces

- Notification outbox processor + Resend provider: `app/api/notifications/process/route.ts`, `lib/server/notification-provider.ts`
- Vercel cron: `vercel.json` (every 5 min)
- Validation script: `pnpm notifications:validate [baseUrl]`
- Wizard sync dispatch: `lib/server/wizard-sync.ts`
- Staging runbook: `docs/Integration/Handoff_Staging_Runbook.md`
- Staging deploy checklist: `docs/Integration/Staging_Deploy_Checklist.md`
- Production cutover runbook: `docs/Integration/Production_Cutover_Runbook.md`

## Completed checks (2026-07-27)

| Check | Result |
| --- | --- |
| `pnpm test` | 211 pass |
| `pnpm test:e2e:smoke` | 28/28 pass (chromium) |
| `RUN_LIVE_E2E=1` checkout | 3/3 pass (cash, transfer, OMT) |
| `RUN_LIVE_E2E=1` account lifecycle | Pass |
| `pnpm notifications:validate` | 200 — worker processes outbox |
| Wizard API smoke | 7/7 (`scripts/wheels-api-smoke.sh --no-write`) |
| Live API integration | Pass (`RUN_LIVE_API_TESTS=1`) |

## Pending

1. **Sentry alerting** — configure on staging/prod Vercel project
2. **Backup/restore drill** — Supabase dashboard on production project
3. **Full rollback drill** — timed redeploy in staging
4. **Staging deploy** — see `Staging_Deploy_Checklist.md`

## Evidence references

- `docs/Integration/Handoff_Server_Requirements.md`
- `docs/Integration/Handoff_Env_Variables.md`
- `.env.staging.example`
