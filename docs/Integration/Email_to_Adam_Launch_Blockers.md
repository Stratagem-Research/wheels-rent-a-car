> **Status: SENT by Marc.** Awaiting Adam's response.

# Email to Adam — Launch blockers + handoff (draft)

**To:** Adam (069 Design / Wizard team)  
**Cc:** Fatema, Marc  
**Subject:** Wheels website — items needed to go live + handoff package

---

Hi Adam,

Thanks again for the Q1–Q12 clarifications and the P0 API documentation (May 21). We have aligned our launch plan to that contract and are starting integration work on our side.

To unblock staging go-live, we need the following from you:

## 1. Credentials and access

1. **`WIZARD_API_TOKEN`** for server-to-server `POST /api/v1/bookings/{reference}/sync-status` (staging; production when ready).
2. **Confirmation** that these base URLs remain correct for staging:
   - Public: `https://lucid-mclean.217-160-215-26.plesk.page/api/public`
   - Internal: `https://lucid-mclean.217-160-215-26.plesk.page/api/v1`
3. **Staging server access** for the website stack (SSH/deploy), as discussed — so we can deploy Next.js + run website DB migrations on your server.
4. **Production API base URLs** when available (separate from test instance).

## 2. Vehicle ID mapping

Please send the **full list of Wizard numeric `vehicle_id` values** for every vehicle we should expose on the website, so we can populate `vehicle_wizard_map` in our database.

We currently only have one mapped entry (`veh-yaris → 131`). Without the full map, `POST /booking-request` cannot succeed for other cars.

Format (CSV or spreadsheet is fine):

| Frontend slug / name | Wizard vehicle_id | Model | vehicle_type_id |
|--------------------|-------------------|-------|-----------------|

## 3. Remaining contract confirmations

Per your “next suggested steps” and our launch gate, please confirm in writing:

1. **429 / 4xx / 5xx** — sanitized JSON deployed on staging and production (not Laravel exception pages).
2. **Rate limits** — final values per endpoint (you shared intended limits; please confirm they are live).
3. **`sync_type` enum** — authoritative allowed values (`payment_confirmed`, `payment_failed`, `refund_pending`, `refund_completed`, etc.).
4. **Sync idempotency** — replay policy if we send the same `sync-status` twice (e.g. Whish callback retry).
5. **`public_token` lifecycle** — rotation/expiry and backward-compat window, if any.
6. **Status enum extension** — timeline for `cancel_requested` / `change_requested` as first-class `status` values (until then we will use `sync_type` + `payment_status` as documented).

## 4. Promo codes (Elie)

You noted promo codes need confirmation with Elie. Can you confirm whether launch assumes **website-side promo validation** (Wizard stores code/discount in notes/fields only)? We will implement accordingly.

## 5. Handoff package (from your request)

We are preparing the following for your team (attached / linked in repo):

- Server stack requirements (Node 22, pnpm, Next.js build)
- Website database migrations (`supabase/migrations/`)
- Environment variable list (`docs/Integration/Handoff_Env_Variables.md`)
- Build and deploy commands
- Backup requirements for website DB
- Cron/queue notes for notification processor

We will share the staging deployment runbook once server access is provisioned.

## 6. What we are doing now (no blockers)

- Website DB migrations and seed (CMS, catalog, car wash, payment logs)
- Aligning our booking adapter to P0 payload fields (`rate_type`, `mileage_plan`, `sync_type`, etc.)
- Enabling real booking against your public API on staging once token + vehicle map are received
- Live smoke tests against your test instance (`scripts/wheels-api-smoke.sh`)

We will **not** write to the Wizard database — all communication stays via the public API and internal sync endpoint.

Please let us know ETA for the token, vehicle ID list, and staging server access. Happy to jump on a short call if easier.

Best,  
Marc
