> **Status: DRAFT — ready to send by Marc.**

# Email to Adam — production handoff (3 items)

**To:** Adam (069 Design / Wizard team)  
**Cc:** Fatema, Marc  
**Subject:** Wheels website — production handoff (3 items)

---

Hi Adam,

Quick follow-up as we prepare production go-live.

## 1. Website database (Supabase)

Per our boundary agreement, the website DB is ours long-term. Could Wheels create the **production Supabase project under your account** and share credentials?

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (pooler)

We'll apply migrations, Auth redirects, and SMTP. You keep ownership.

## 2. Production go-live access

Demo integration is working well (vehicle sync + booking verified on `adoring-hugle`). For production we still need:

- Confirmation when `https://system.wheelsrentacar.com.lb/api/public` and `/api/v1` are live
- **Production `WIZARD_API_TOKEN`** (separate from demo, via secure channel)
- **Deploy path** — SSH/server access for the Next.js app, or confirmation we deploy to Vercel on your domain

## 3. Notifications + payments (your input)

Customer email/WhatsApp are website-owned. Do you have a preference for email (Resend vs SendGrid)? Do you already have a Meta-verified WhatsApp number (we can use Twilio if so)?

For online payments: Whish credentials when ready, and is **Bank Audi NEO** the preferred card option for launch?

Happy to jump on a short call if easier.

Best,  
Marc
