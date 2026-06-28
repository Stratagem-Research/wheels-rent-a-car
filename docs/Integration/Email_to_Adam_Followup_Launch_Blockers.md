> **Status: ANSWERED by Adam 2026-06-22 (follow-up).** See [Adam_Response_Demo_And_Vehicle_Sync.md](./Adam_Response_Demo_And_Vehicle_Sync.md).

# Email to Adam — follow-up (boundaries aligned + launch blockers)

**To:** Adam (069 Design / Wizard team)  
**Cc:** Fatema, Marc  
**Subject:** Re: Wheels website — boundaries aligned + items still needed for staging

---

Hi Adam,

Thank you for the clear boundary note — it matches how we have built the website side.

To confirm our alignment:

**Customer identity.** We require and validate email at checkout on the website. Reference + email lookup is our public security layer only. We are not asking Wizard to treat email as the primary operational customer key.

**Cancellation and refund.** Orchestration stays on the website and payment provider. When a customer requests cancellation, we will notify Wizard via the server-to-server `sync-status` endpoint using a request-style sync (for example `cancel_request`) while keeping Wizard status compatible until your team approves. We will not expose or use a public endpoint that auto-cancels a booking or triggers refund state in Wizard.

**CMS and marketing.** Vehicle photos, slugs, badges, descriptions, and landing content live in our Supabase CMS. Wizard supplies operational vehicle IDs; we enrich them on the website.

**Payments and communication.** Whish/payment flow, customer-facing payment state, email, and WhatsApp remain website-owned. Wizard receives resulting status through `POST /api/v1/bookings/{reference}/sync-status` only.

**Domains.** On our side, website base URLs and callback URLs are env-driven (`NEXT_PUBLIC_SITE_URL`, `WEBSITE_URL`) — not hardcoded. For staging/production we will set:

- `https://wheelsrentacar.com.lb`
- `https://www.wheelsrentacar.com.lb`
- `https://booking.wheelsrentacar.com.lb`

(and extend to `wheels.com.lb` when you switch). We understand Wizard will manage allowed CORS origins and integration settings in your settings/API section for the next revision.

We are aligned on the next Wizard API revision scope (clean JSON errors, rate limits, configurable origins, timezone consistency, lookup/status, sync). To enable real booking on staging in the meantime, we still need the following from your side:

## 1. Credentials and access

1. **`WIZARD_API_TOKEN`** for staging `POST /api/v1/bookings/{reference}/sync-status` (production when ready).
2. Confirmation that these staging base URLs remain correct:
   - Public: `https://lucid-mclean.217-160-215-26.plesk.page/api/public`
   - Internal: `https://lucid-mclean.217-160-215-26.plesk.page/api/v1`
3. **Staging server access** for the Next.js website stack (SSH/deploy), as discussed.
4. Production API base URLs when available.

## 2. Vehicle ID mapping

Please send the full list of Wizard numeric `vehicle_id` values for every vehicle we should expose on the website, so we can populate `vehicle_wizard_map`.

We currently only have `veh-yaris → 131`. Without the full map, `POST /booking-request` cannot succeed for other cars.

| Frontend slug / name | Wizard vehicle_id | Model | vehicle_type_id |
| --- | --- | --- | --- |

## 3. Contract confirmations (for launch gate)

Please confirm in writing:

1. **429 / 4xx / 5xx** — sanitized JSON in staging and production (not Laravel exception pages).
2. **Rate limits** — final per-endpoint values (staging and production).
3. **`sync_type` enum** — authoritative allowed values (`payment_confirmed`, `payment_failed`, `cancel_request`, etc.).
4. **Sync idempotency** — replay policy if we send the same `sync-status` twice (e.g. Whish callback retry).
5. **`public_token` lifecycle** — rotation/expiry and backward-compat window, if any.
6. **Request-like states** — confirm we should continue using `sync_type` + compatible `status` until Wizard adds first-class `cancel_requested` / `change_requested` values.

## 4. Promo codes

Can you confirm with Elie whether launch assumes **website-side promo validation** (Wizard stores code/discount in payload fields/notes only)?

Once we have the token and vehicle map, we will enable real booking on staging, run `./scripts/wheels-api-smoke.sh`, and share results.

Happy to jump on a short call if easier.

Best,  
Marc
