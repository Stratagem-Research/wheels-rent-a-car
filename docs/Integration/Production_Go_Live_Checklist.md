# Production Go-Live — Ordered Checklist

Status: Active  
Owner: Marc (Website Team)  
Last updated: 2026-07-27

Work through in order. Each step links to the detailed runbook. **Do not test production Wizard until step 10.**

---

## Phase A — You (Marc) — this week

| # | Action | Owner | Doc / command | Done? |
| --- | --- | --- | --- | --- |
| 1 | **Send Adam follow-up email** | Marc | [Email_to_Adam_Production_Followup.md](./Email_to_Adam_Production_Followup.md) — mark `SENT` when sent | [ ] |
| 2 | **Create production Supabase** (eu-central-1) | Marc | [Supabase_Production_Setup.md](./Supabase_Production_Setup.md) §1 | [ ] |
| 3 | **Apply migrations + RLS** on new prod project | Marc | `pnpm supabase:production-preflight` | [ ] |
| 4 | **Configure Auth** (redirect URLs, SMTP, confirmations) | Marc | [Supabase_Production_Setup.md](./Supabase_Production_Setup.md) §3 | [ ] |
| 5 | **Set up Resend** domain + API key | Marc | Verify domain `wheelsrentacar.com.lb` | [ ] |
| 6 | **Deploy staging** (Vercel recommended) | Marc | [Staging_Deploy_Checklist.md](./Staging_Deploy_Checklist.md) | [ ] |
| 7 | **Post-deploy smoke** on staging URL | Marc | `curl …/api/health`, `pnpm notifications:validate $URL` | [ ] |
| 8 | **Manual QA** on staging | Marc + Fatema | [Manual_QA_Checklist.md](./Manual_QA_Checklist.md) | [ ] |
| 9 | **Share staging URL + Supabase creds** with Adam (secure channel) | Marc | Per follow-up email | [ ] |

---

## Phase B — Await Adam / business

Track replies in [Adam_Response_Tracker.md](./Adam_Response_Tracker.md).

| # | Waiting for | Blocks |
| --- | --- | --- |
| 10 | Deploy path confirmation (Vercel vs SSH) | Step 6 if SSH |
| 11 | Notification answers (Resend OK? WhatsApp? Wizard duplicates?) | Notification copy + channels |
| 12 | Real bank transfer **IBAN** | Checkout transfer instructions |
| 13 | Whish `WHISH_CHANNEL` / `WHISH_SECRET` | Whish sandbox E2E |
| 14 | Bank Audi NEO API docs + credentials | NEO go-live |
| 15 | Staging sign-off | Production Wizard token request |
| 16 | Production `WIZARD_API_TOKEN` | Cutover only |

---

## Phase C — Ops gates (after staging deploy)

| # | Action | Owner | Doc |
| --- | --- | --- | --- |
| 17 | Configure **Sentry** alerts (5xx on booking, payments, notifications) | Marc | [LaunchGate_Operations_Report.md](./LaunchGate_Operations_Report.md) |
| 18 | **Backup/restore drill** on prod Supabase | Marc | Supabase dashboard |
| 19 | **Rollback drill** (redeploy previous Vercel build) | Marc | [Production_Cutover_Runbook.md](./Production_Cutover_Runbook.md) |
| 20 | Re-run **RLS negative** on prod project | Marc | `pnpm security:rls:negative` |

---

## Phase D — Go-live (Adam approval required)

| # | Action | Owner | Doc |
| --- | --- | --- | --- |
| 21 | Final **Go/No-Go** review | Marc + Adam | [Launch_Go_NoGo_Memo.md](./Launch_Go_NoGo_Memo.md) |
| 22 | Switch env to **production Wizard** URLs + token | Marc | [Production_Cutover_Runbook.md](./Production_Cutover_Runbook.md) |
| 23 | Deploy production + **minimal smoke** (health, site-config, vehicle sync — no test bookings) | Marc | Cutover runbook §2 |
| 24 | **24h monitoring** (Sentry, notification outbox, sync failures) | Marc | Cutover runbook §3 |
| 25 | **Supabase handover** to Wheels | Marc → Wheels | [Supabase_Production_Setup.md](./Supabase_Production_Setup.md) §7 |

---

## Quick reference — automated gates (re-run anytime)

```bash
pnpm typecheck && pnpm test && pnpm build
pnpm test:e2e:smoke --project=chromium
source .env && RUN_LIVE_API_TESTS=1 pnpm test -- tests/integration/wheels-public.live.test.ts
source .env && ./scripts/wheels-api-smoke.sh --no-write
# Live checkout (creates demo bookings; 45s pause between methods):
source .env && RUN_LIVE_E2E=1 pnpm exec playwright test tests/e2e/checkout.spec.ts --project=chromium
```

Payment-deferred launch = steps **1–9 + 17–21** with cash/transfer/OMT only. Whish/NEO can follow when credentials arrive.
