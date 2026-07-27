# Staging Deploy Checklist

Status: Ready to execute  
Owner: Website Team  
Last updated: 2026-07-27

## Local verification evidence (2026-07-27)

Automated gates run against `localhost:3000` (`pnpm build && pnpm start`) before staging deploy:

| Check | Result |
| --- | --- |
| `pnpm test` | 211 pass |
| `pnpm test:e2e:smoke --project=chromium` | 28/28 pass |
| `RUN_LIVE_API_TESTS=1` integration | 5/5 pass |
| `scripts/wheels-api-smoke.sh` | 7/7 pass |
| `RUN_LIVE_E2E=1` checkout (cash/transfer/OMT) | 3/3 pass |
| `pnpm notifications:validate` | 200, processed jobs |
| `pnpm security:rls:negative` | Pass (current Supabase project) |

**Blocked until staging URL exists:** manual QA matrix, Sentry alert drill, backup/restore drill.

## 1. Prerequisites

- [ ] Production or dedicated staging Supabase project provisioned
- [ ] `node scripts/supabase-production-preflight.mjs` passes
- [ ] Adam deploy-path answer recorded in [Adam_Response_Tracker.md](./Adam_Response_Tracker.md)

## 2. Vercel project (recommended)

1. Import `Stratagem-Research/wheels-rent-a-car` → connect `main`
2. Set env vars from [`.env.staging.example`](../../.env.staging.example)
3. Confirm `vercel.json` cron is active for `/api/notifications/process`
4. Map staging domain (e.g. `staging.wheelsrentacar.com.lb`)

## 3. Post-deploy smoke

```bash
curl -sS "$STAGING_URL/api/health"
curl -sS "$STAGING_URL/api/site-config" | jq '.paymentMethods'
node scripts/validate-notifications.mjs "$STAGING_URL"
```

## 4. Automated gates on staging URL

Point local env at staging for Wizard demo (unchanged) and run:

```bash
pnpm env:check:payment-deferred
RUN_LIVE_API_TESTS=1 pnpm test -- tests/integration/wheels-public.live.test.ts
RUN_LIVE_E2E=1 pnpm test:e2e tests/e2e/checkout.spec.ts --project=chromium
```

## 5. Manual QA

Execute [Manual_QA_Checklist.md](./Manual_QA_Checklist.md).

## 6. Share with Adam

Send staging URL + Supabase credentials (secure channel) per [Email_to_Adam_Production_Followup.md](./Email_to_Adam_Production_Followup.md).
