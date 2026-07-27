> **Status: REVIEWED — ready for Marc to send (2026-07-27).**

# Email to Adam — production follow-up

**To:** Adam (069 Design / Wizard team)  
**Cc:** Fatema, Elie  
**Subject:** Re: Wheels website — production setup in progress

---

Hi Adam,

Thanks for the detailed reply on Saturday — that clarifies the production path.

We're proceeding on our side as follows.

## 1. Production Supabase

Understood: we'll create and configure the production Supabase project on our side for the initial go-live setup, apply our migrations, configure Auth redirect URLs and SMTP, and share the project credentials with you once complete.

The project will be structured for full transfer to a Wheels-owned account at final handover (ownership, database, configuration, migrations, and related services).

We'll send the following via your secure channel when ready:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (pooler connection string)

**Status:** in progress (our existing dev/staging project and migrations are ready; production project provisioning is next).

## 2. Payment modules (all five present)

Per your instructions, we've prepared all payment modules so they can be activated individually via environment settings — nothing hardcoded:

| Module | Status at launch |
| --- | --- |
| Cash | Enabled by default |
| Bank transfer | Enabled by default |
| OMT | Enabled by default (standalone, separate from Whish) |
| Whish online | Built; disabled until `WHISH_CHANNEL` / `WHISH_SECRET` are set; sandbox via `WHISH_ENVIRONMENT=sandbox` |
| Bank Audi NEO | Built (sandbox scaffold); disabled until NEO merchant credentials are issued |

Cash, bank transfer, and OMT will be live for the initial launch. Whish and NEO remain in sandbox/disabled mode until merchant credentials arrive — then we flip the env flags without a code deploy.

## 3. Customer notifications

Our notification queue and booking-confirmation enqueue are wired. We're integrating Resend for transactional email and have scheduled the outbox worker for production.

**We still need your input on the items below** (from our earlier note — happy to keep this lightweight):

1. **Email provider** — any preference between Resend and SendGrid, or an existing Wheels account we should use?
2. **WhatsApp** — do you already have a Meta Business verified WhatsApp number? If yes, which provider (Twilio or other) should we integrate?
3. **Wizard customer confirmations** — does Wizard send any customer-facing booking confirmations today? We want to avoid duplicate messages once the website notification flow is live.

If WhatsApp isn't ready yet, we'll launch with **email-only** confirmations and add WhatsApp once verification is complete.

## 4. Production Wizard API

Noted on all points:

- Production URLs confirmed live at `system.wheelsrentacar.com.lb`
- We will **not** test against production Wizard data until final approval
- All development and staging rehearsal continues on the demo/test environment
- We'll request the production `WIZARD_API_TOKEN` via secure channel once Supabase + payment modules + production website config are complete

## 5. Deploy path

One open item from our side: please confirm whether the Next.js website should deploy to **Vercel on your domain** or to **SSH/server access on your infrastructure**. We're ready either way once the production Supabase project is live.

---

We'll follow up with Supabase credentials and a staging URL for your review as soon as the production setup is complete.

Best,  
Marc
