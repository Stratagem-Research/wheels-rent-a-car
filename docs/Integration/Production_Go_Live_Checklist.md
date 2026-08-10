# Production Go-Live — Master Checklist

Status: **Active — source of truth**  
Owners: Marc (coordination) · Fatema (lead engineer) · Elie (Wheels owner / content)  
Last updated: 2026-08-10

**Post–Adam Aug 9 working checklist (SMTP, confirmation timing, Storage uploads, staging QA):** [Next_Steps_Checklist_Aug10.md](./Next_Steps_Checklist_Aug10.md) · [Adam_Elie_Staging_Tester_Checklist.md](./Adam_Elie_Staging_Tester_Checklist.md)

Work top-to-bottom. Phases **0** and **E** can run in parallel with engineering. **Do not test production Wizard until step 32.**

---

## Team roles

| Person | Role | Owns |
| --- | --- | --- |
| **Fatema** | Lead engineer | Supabase, deploy, env, migrations, RLS, automated tests, QA execution, CMS uploads, implementing feedback, cutover technical steps |
| **Marc** | Coordination & client comms | Emails to Adam/Elie, stakeholder follow-up, DNS/domain requests, Go/No-Go facilitation, credential handover |
| **Elie** | Owner / business | Content review, assets (photos), IBAN, promo rules, pricing copy, payment merchant relationships, final owner sign-off |
| **Adam** | Wizard / integration | API token, deploy-path answer, notification policy, staging sign-off |

Track external replies: [Adam_Response_Tracker.md](./Adam_Response_Tracker.md) · [Elie_Response_Tracker.md](./Elie_Response_Tracker.md)

---

## Phase 0 — Elie (parallel, start now)

*Requested in [Email_to_Adam_Status_Update.md](./Email_to_Adam_Status_Update.md) (Jul 8) and Revision 1 walkthrough. Can happen while engineering provisions infra.*

| # | Action | Owner | Notes / source | Done? |
| --- | --- | --- | --- | --- |
| E1 | **Team photos** for About page (`TeamCard` section) | Elie → Fatema uploads | Jul 8 email: "make progress on team photos" | [ ] |
| E2 | **Full site review** — copy, layout, content, UX | Elie | Jul 8 email: feedback in a shared doc | [ ] |
| E3 | **Hero / Lebanon photography** (cinematic full-bleed) | Elie → Fatema | Walkthrough: placeholders in code; client supplies finals | [ ] |
| E4 | **Vehicle marketing photos** in CMS (`vehicle_metadata`) | Elie → Fatema | Wizard sync = ops data; website owns photos/slugs/badges | [ ] |
| E5 | **Corporate tier real numbers** (replace placeholders) | Elie | Walkthrough open item | [ ] |
| E6 | **Promo code rules** — confirm launch promos + discount logic | Elie | Adam confirmed website-side validation; Elie owns business rules | [ ] |
| E7 | **Bank transfer IBAN** + transfer instructions copy | Elie | Placeholder in checkout today; also in Adam follow-up | [ ] |
| E8 | **Whish merchant credentials** (`WHISH_CHANNEL`, `WHISH_SECRET`) | Elie | Blocks online payments; code ready | [ ] |
| E9 | **Bank Audi NEO** — confirm go-live intent + obtain API credentials | Elie | Elie raised NEO; sandbox scaffold in code | [ ] |
| E10 | **Trip / destination photos** if replacing stock assets | Elie → Fatema | CMS trips use `public/images/Trips Images/` | [ ] |

**When Elie delivers E2:** Fatema triages items → implements in codebase → Marc schedules re-review on staging.

---

## Phase A — Engineering (Fatema leads)

| # | Action | Owner | Doc / command | Done? |
| --- | --- | --- | --- | --- |
| 1 | **Send Adam follow-up email** | Marc | [Email_to_Adam_Production_Followup.md](./Email_to_Adam_Production_Followup.md) — mark `SENT` | [x] SENT 2026-07-27; answered Aug 9 |
| 2 | **Create production Supabase** (eu-central-1) | Fatema | [Supabase_Production_Setup.md](./Supabase_Production_Setup.md) §1 | [ ] |
| 3 | **Apply migrations + RLS** on new prod project | Fatema | `pnpm supabase:production-preflight` | [ ] |
| 4 | **Configure Auth** (redirect URLs, SMTP, confirmations) | Fatema | Supabase dashboard §3 | [ ] |
| 5 | **Configure SMTP notifications** (Wheels domain — not Resend) | Fatema | Adam Aug 9: SMTP env (host/port/user/pass/encryption/from); await prod SMTP creds | [ ] |
| 6 | **Deploy staging** (Vercel recommended) | Fatema | [Staging_Deploy_Checklist.md](./Staging_Deploy_Checklist.md) | [ ] |
| 7 | **Post-deploy automated smoke** | Fatema | `curl …/api/health`, `pnpm notifications:validate $URL` | [ ] |
| 8 | **Run automated gate suite on staging** | Fatema | See [Quick reference](#quick-reference) below | [ ] |
| 9 | **Manual QA on staging** | Fatema (lead) · Marc (spot-check) | [Manual_QA_Checklist.md](./Manual_QA_Checklist.md) | [ ] |
| 10 | **Upload Elie assets** (E1, E3, E4, E10) when received | Fatema | Admin CMS + `vehicle_metadata` | [ ] |
| 11 | **Implement Elie feedback doc** (from E2) | Fatema | Track items in Elie tracker | [ ] |
| 12 | **Update IBAN in i18n** when Elie provides E7 | Fatema | `messages/en.json`, `ar.json`, `fr.json` | [ ] |
| 13 | **Share staging URL + Supabase creds** with Adam | Marc | Secure channel; Cc Elie for content review | [ ] |

---

## Phase B — Await Adam (Wizard)

| # | Waiting for | Blocks | Owner to chase |
| --- | --- | --- | --- |
| 14 | Deploy path (Vercel vs SSH) | Step 6 if SSH | Marc → Adam (still open) |
| 15 | Notification answers (SMTP / WhatsApp / confirmations) | — | **Answered Aug 9** — see [Adam_Response_Notifications_And_SMTP.md](./Adam_Response_Notifications_And_SMTP.md) |
| 15a | Production SMTP credentials | Email at go-live | Marc → Adam |
| 16 | Staging integration sign-off | Prod token request | Marc → Adam (Adam asked for link Aug 9) |
| 17 | Production `WIZARD_API_TOKEN` | Cutover only | Marc → Adam (after staging OK) |

Full tracker: [Adam_Response_Tracker.md](./Adam_Response_Tracker.md)

---

## Phase C — Ops gates (after staging deploy)

| # | Action | Owner | Doc |
| --- | --- | --- | --- |
| 18 | Configure **Sentry** alerts (5xx booking, payments, notifications) | Fatema | [LaunchGate_Operations_Report.md](./LaunchGate_Operations_Report.md) |
| 19 | **Backup/restore drill** on prod Supabase | Fatema | Supabase dashboard |
| 20 | **Rollback drill** (redeploy previous Vercel build) | Fatema | [Production_Cutover_Runbook.md](./Production_Cutover_Runbook.md) |
| 21 | Re-run **RLS negative** on prod project | Fatema | `pnpm security:rls:negative` |

---

## Phase D — Sign-off (before cutover)

| # | Action | Owner | Done? |
| --- | --- | --- | --- |
| 22 | **Elie content sign-off** on staging (copy, photos, pricing, IBAN) | Elie | [ ] |
| 23 | **Elie owner Go/No-Go** for payment-deferred launch | Elie | [ ] |
| 24 | **Adam staging sign-off** | Adam | [ ] |
| 25 | Final **Go/No-Go memo** | Marc + Fatema + Elie + Adam | [Launch_Go_NoGo_Memo.md](./Launch_Go_NoGo_Memo.md) | [ ] |

Payment-deferred launch = cash + transfer + OMT live. Whish/NEO flip on when E8/E9 credentials arrive.

---

## Phase E — Production cutover (Adam + Elie approval required)

| # | Action | Owner | Doc |
| --- | --- | --- | --- |
| 26 | Switch env to **production Wizard** URLs + token | Fatema | [Production_Cutover_Runbook.md](./Production_Cutover_Runbook.md) |
| 27 | Deploy production + **minimal smoke** (no test bookings on prod Wizard) | Fatema | Cutover runbook §2 |
| 28 | **24h monitoring** (Sentry, notification outbox, sync failures) | Fatema · Marc on-call | Cutover runbook §3 |
| 29 | **Supabase handover** to Wheels | Marc → Elie | [Supabase_Production_Setup.md](./Supabase_Production_Setup.md) §7 |
| 30 | Enable **Whish/NEO** env flags individually when E8/E9 ready | Fatema | `PAYMENT_METHOD_*` on Vercel |

---

## Quick reference — automated gates (Fatema re-runs)

```bash
pnpm typecheck && pnpm test && pnpm build
pnpm test:e2e:smoke --project=chromium
source .env && RUN_LIVE_API_TESTS=1 pnpm test -- tests/integration/wheels-public.live.test.ts
source .env && ./scripts/wheels-api-smoke.sh --no-write
# Live checkout on demo Wizard (creates bookings; serial, 45s pause):
source .env && RUN_LIVE_E2E=1 pnpm exec playwright test tests/e2e/checkout.spec.ts --project=chromium
```

---

## Email history cross-check (what we asked whom)

| Date | Email | Asked of Elie | Asked of Adam |
| --- | --- | --- | --- |
| Jul 8 | [Status update](./Email_to_Adam_Status_Update.md) | Team photos; full site review doc | Token, staging access, API revision |
| Jul 19 | [Production handoff](./Email_to_Adam_Production_Handoff.md) | (Cc) NEO mentioned as Elie's preference | Supabase, payments, notifications, prod API |
| Jul 25 | Adam reply | — | We create Supabase; all 5 payment modules; no prod Wizard testing |
| Jul 27 | [Production follow-up](./Email_to_Adam_Production_Followup.md) (**SENT**) | (Cc) | SMTP/WhatsApp/confirmations, deploy path |
| Jul 31 | [Offline payments / fleet / images](./Email_to_Adam_Offline_Payments_Vehicles_Images.md) (**SENT**) | (Cc) | Receipt workflow, duplicate cars, image source |
| Aug 9 | Adam replies (archived) | — | Offline = no receipt workflow; keep individual cars; website images; SMTP not Resend; WhatsApp link only; confirm after approval |
| Aug 9 | Adam | — | Wants staging link Monday night Lebanon + WhatsApp Bridge note (future) |

**Still open from Adam:** deploy path; prod SMTP credentials; staging URL (blocked on us).  
**Still open from Elie:** team photos, site feedback doc, hero photography, corporate pricing, IBAN, Whish/NEO credentials.
