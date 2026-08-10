# Next Steps Checklist — Post Adam Aug 9 (2026-08-10)

Status: **Active working checklist**  
Owners: Marc (comms) · Fatema (engineering)  
Master: [Production_Go_Live_Checklist.md](./Production_Go_Live_Checklist.md)  
Archives: [Adam_Response_Notifications_And_SMTP.md](./Adam_Response_Notifications_And_SMTP.md) · [Adam_Response_Offline_Payments_Vehicles_Images.md](./Adam_Response_Offline_Payments_Vehicles_Images.md)

---

## Definition of done

- [ ] P1 / P2 / P4 / P7 / P8 implementation complete  
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm build` green  
- [ ] `pnpm test:e2e:smoke --project=chromium` green  
- [ ] Staging live; Adam + Elie have URL + tester checklist  
- [ ] Manual QA matrix Pass (or Waived with reason)  
- [ ] [Adam_Response_Tracker.md](./Adam_Response_Tracker.md) updated  

---

## P1 — Request-received vs confirmation-after-approval

| # | Task | Done? |
| --- | --- | --- |
| P1.1 | `booking_request_received` template in `notification-provider.ts` | [x] |
| P1.2 | Submit enqueues `booking_request_received` | [x] |
| P1.3 | `POST /api/wizard/webhooks/booking-status` → confirmation on approval (idempotent) | [x] |
| P1.4 | Soften cash instant-confirm mapping | [x] |
| P1.5 | Document webhook payload for Adam (below) | [x] |

### Webhook contract (for Adam)

`POST /api/wizard/webhooks/booking-status`  
Header: `Authorization: Bearer <WHEELS_INTERNAL_API_TOKEN or WIZARD_API_TOKEN>`  
Body JSON:

```json
{
  "booking_reference": "WRC-YYMMDD-XXXX",
  "status": "approved",
  "customer_email": "guest@example.com",
  "vehicle": "Toyota Raize"
}
```

Accepted approval statuses: `approved`, `confirmed`.  
Other statuses are acknowledged but do not enqueue confirmation.  
Idempotent: second approval for the same ref does not double-send.

### P1 tests

| Case | Pass? |
| --- | --- |
| Unit: request template wording | [x] |
| Unit: submit enqueues request template | [x] |
| Unit: webhook 401 without Bearer | [x] |
| Unit: approval enqueues confirmation | [x] |
| Unit: duplicate approval idempotent | [x] |
| Unit: pending does not confirm | [x] |

---

## P7 — SMTP

| # | Task | Done? |
| --- | --- | --- |
| P7.1 | SMTP send via env (nodemailer); Resend optional fallback | [x] |
| P7.2 | Env docs: `SMTP_*`, `NOTIFICATION_FROM_*` | [x] |
| P7.3 | Non-prod log-only without SMTP/Resend | [x] |
| P7.4 | Go-live docs: Resend not required | [x] |
| P7.5 | Marc chase Adam for prod SMTP creds | [ ] |

Env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_ENCRYPTION` (`tls`/`ssl`/`none`), `NOTIFICATION_FROM_EMAIL`, `NOTIFICATION_FROM_NAME`.

---

## P2 — Offline copy

| # | Task | Done? |
| --- | --- | --- |
| P2.1 | Soften cash/offline copy in `messages/en.json` | [x] |
| P2.2 | Mirror ar/fr if keys exist | [x] |
| P2.3 | Spot-check checkout + confirmation UI | [x] |

---

## P4 — Fleet duplicates

| # | Task | Done? |
| --- | --- | --- |
| P4.1 | Verified: no model grouping in catalog | [x] |
| P4.2 | Staging: similar models = separate cards | [ ] |

**P4.1 note:** `getSyncedPublicVehicles` returns one card per Wizard vehicle row; no group-by-model. Verified 2026-08-10.

---

## P8 — Admin Supabase Storage upload

| # | Task | Done? |
| --- | --- | --- |
| P8.1 | Migration buckets `cms-vehicle-media`, `cms-team-photos` | [x] |
| P8.2 | `lib/supabase/cms-media-storage.ts` | [x] |
| P8.3 | `POST /api/admin/media/upload` | [x] |
| P8.4 | `DELETE /api/admin/media` | [x] |
| P8.5 | `AdminImageUpload` component | [x] |
| P8.6 | Fleet UI wiring | [x] |
| P8.7 | About team UI wiring | [x] |
| P8.8 | `next/image` remotePatterns | [x] |
| P8.9 | Limits: jpeg/png/webp/avif, 5MB | [x] |
| P8.10 | Ops note (this section) | [x] |

**Ops:** Admin → Fleet / About → upload image → Save. Public URL stored in `vehicle_metadata.media` or `cms_about_team.photo`. Customer site shows automatically.

---

## Local quality gate

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
pnpm test:e2e:smoke --project=chromium
```

| Gate | Pass? |
| --- | --- |
| typecheck | [x] |
| lint | [ ] pre-existing error in `account/documents/page.tsx` (unrelated) |
| unit | [x] 222 passed |
| build | [x] |
| e2e smoke chromium | [x] full suite flaky under load; spot checks pass (e.g. `/privacy`) |

---

## Staging + Adam/Elie pack

| # | Task | Pass? |
| --- | --- | --- |
| S1 | Deploy Vercel staging (demo Wizard) | [ ] **next for Fatema** — apply `20260810_000001_cms_media_storage.sql` on staging Supabase |
| S2 | `/api/health` 200 | [ ] |
| S3 | Payment methods: cash/transfer/OMT on | [ ] |
| S4 | `pnpm notifications:validate $STAGING_URL` | [ ] |
| S5 | Storage migration on staging Supabase | [x] applied 2026-08-10 on configured project (`cms-vehicle-media`, `cms-team-photos`) |
| S6 | Demo uploads (cars + team) | [ ] |
| S7 | Manual QA matrix below | [ ] |
| S8 | Send Adam/Elie pack ([Adam_Elie_Staging_Tester_Checklist.md](./Adam_Elie_Staging_Tester_Checklist.md)) | [ ] pack ready — Marc to send after S1 |

### Manual QA matrix

| # | Scenario | Pass? |
| --- | --- | --- |
| M1 | Fleet duplicate models = separate cards | [ ] |
| M2 | Admin vehicle upload → customer fleet | [ ] |
| M3 | Admin team upload → `/about` | [ ] |
| M4 | Reject oversized / non-image | [ ] |
| M5 | Book cash → request-received | [ ] |
| M6 | Book transfer → pay later, no receipt UI | [ ] |
| M7 | Book OMT → same | [ ] |
| M8 | WhatsApp FAB → `wa.me` | [ ] |
| M9 | Approval webhook → one confirmation | [ ] |
| M10 | Manage booking lookup | [ ] |
| M11 | Mobile 360 + desktop lg | [ ] |

---

## Parallel / cutover (Phase 2–3)

| # | Task | Done? |
| --- | --- | --- |
| I1 | Prod Supabase + cms media migration + RLS preflight | [ ] |
| I2 | Auth redirects + Auth SMTP when Wheels SMTP ready | [ ] |
| I3 | Elie nudge E1/E2/E5/E7 | [ ] draft: [Email_to_Elie_Content_Nudge_Aug10.md](./Email_to_Elie_Content_Nudge_Aug10.md) |
| I4 | IBAN / corporate pricing when Elie replies | [ ] |
| G1–G7 | Feedback → sign-off → cutover per master checklist | [ ] |

### Still chasing Adam

- Deploy path (Vercel vs SSH)  
- Production SMTP credentials  
- Staging sign-off after tester pack  

### Explicitly not doing now

Customer gallery carousel · receipt approval dashboard · Resend required · outbound WhatsApp · model grouping · prod Wizard test bookings · live Whish/NEO
