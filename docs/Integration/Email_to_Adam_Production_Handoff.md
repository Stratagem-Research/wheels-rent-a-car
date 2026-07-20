> **Status: DRAFT — ready to send by Marc.**

# Email to Adam — production handoff items

**To:** Adam (069 Design / Wizard team)  
**Cc:** Fatema, Marc  
**Subject:** Wheels website — production handoff items

---

Hi Adam,

Following up on production go-live. A few items we need from your side:

## 1. Production Supabase (website database)

Per our system-boundary agreement, the website database (CMS, customer accounts, payment events, notifications) is website-owned.

Since Wheels will operate this long-term, could you please **create the production Supabase project under the Wheels account** and share credentials with us?

We need:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (pooler connection string)

We will apply our migrations, configure Auth redirect URLs, and set up SMTP. You retain ownership of the project throughout.

## 2. Production Wizard API access

- Production public API: `https://system.wheelsrentacar.com.lb/api/public`
- Production internal API: `https://system.wheelsrentacar.com.lb/api/v1`
- Production **`WIZARD_API_TOKEN`** (Bearer) for `sync-status` and `vehicles/sync`
- Staging/production **server access** for deploying the Next.js app (or confirmation if we deploy to Vercel on your domain)

## 3. Customer notifications (website-owned)

Our notification queue is built. We need to wire a provider before go-live.

**Email** — do you have a preference or existing account?

- Resend
- SendGrid

**WhatsApp** — we can integrate via **Twilio**, but that typically requires a **Meta Business verified WhatsApp number**. Do you already have one set up? If so, which provider do you prefer (Twilio or another)?

If WhatsApp isn't ready yet, we can launch with **email-only confirmations** and add WhatsApp once verification is complete.

Please also confirm whether Wizard sends any customer-facing booking confirmations today, so we avoid duplicating messages.

## 4. Payments

We support cash, bank transfer, and OMT for a payment-deferred launch. For online payments:

- **Whish** — we need merchant credentials (`WHISH_CHANNEL`, `WHISH_SECRET`) when ready
- **Bank Audi NEO** — the team is evaluating this as a card payment option. Is NEO the preferred online method for launch? Do you have NEO merchant/API credentials, or should we coordinate directly with Bank Audi?

Please confirm whether Whish, NEO, or both should be live at launch.

## 5. Still open (launch gate)

- Rate limits per endpoint (staging + production)
- Sanitized JSON error responses
- `sync_type` enum + sync idempotency policy
- Internal token rotation process

We are finishing our internal booking-flow testing on the demo API and will share any specific payload issues separately if we find a Wizard-side gap.

Best,  
Marc
