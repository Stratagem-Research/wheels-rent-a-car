> **Status: DRAFT — ready to send by Marc.**

# Email to Adam — production handoff items

**To:** Adam (069 Design / Wizard team)  
**Cc:** Fatema, Marc  
**Subject:** Wheels website — production handoff items

---

Hi Adam,

Following up as we prepare production go-live. Demo integration is working well on our side (vehicle sync + booking verified on `adoring-hugle`). Below are the items we still need from you to go live.

## 1. Production Supabase (website database)

Per our system-boundary agreement, the website database (CMS, customer accounts, payment events, notifications) is website-owned.

Since Wheels will operate this long-term, could you please **create the production Supabase project under the Wheels account** and share credentials with us?

We need:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (pooler connection string)

We will apply our migrations, configure Auth redirect URLs, and set up SMTP. You retain ownership of the project throughout.

## 2. Production go-live access

We already have the **demo** API working (`adoring-hugle` + staging token). For **production**, we still need:

- Confirmation when these are live:
  - Public: `https://system.wheelsrentacar.com.lb/api/public`
  - Internal: `https://system.wheelsrentacar.com.lb/api/v1`
- **Production `WIZARD_API_TOKEN`** (Bearer, separate from demo — via secure channel) for `sync-status` and `vehicles/sync`
- **Deploy path for the Next.js website** — SSH/server access on your infrastructure, or confirmation that we deploy to Vercel on your domain

## 3. Customer notifications (website-owned)

Our notification queue is built; we need to wire a provider before go-live.

**Email** — do you have a preference or existing account?

- Resend
- SendGrid

**WhatsApp** — we can integrate via **Twilio**, but that typically requires a **Meta Business verified WhatsApp number**. Do you already have one set up? If so, which provider do you prefer (Twilio or another)?

If WhatsApp is not ready yet, we can launch with **email-only confirmations** and add WhatsApp once verification is complete.

Please also confirm whether Wizard sends any customer-facing booking confirmations today, so we avoid duplicating messages.

## 4. Payments

We support **cash, bank transfer, and OMT** for a payment-deferred launch (no online checkout required at go-live).

For **online/card payments**, Elie mentioned **Bank Audi NEO** — we want to confirm what you want us to integrate on the website:

- **Whish** — we already have the checkout/callback flow built; we just need merchant credentials (`WHISH_CHANNEL`, `WHISH_SECRET`) when ready
- **Bank Audi NEO** — is this the online payment gateway you want for card checkout? If so, do you have NEO merchant/API credentials we should use, or should we coordinate directly with Bank Audi to set up the integration?

Please confirm which online method(s) should be live at launch — Whish, NEO, both, or online payments deferred until credentials are ready.

Happy to jump on a short call if easier.

Best,  
Marc
