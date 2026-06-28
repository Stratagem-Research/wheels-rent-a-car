> **Status: DRAFT — ready to send by Marc.**

# Email to Adam — ack demo URLs + vehicle sync

**To:** Adam (069 Design / Wizard team)  
**Subject:** Re: Demo environment + vehicle sync — aligned, one question

---

Hi Adam,

Thank you — we are aligned on the updated demo URLs, vehicle sync model, website-side promo validation, and the cancel_request sync approach.

We have repointed our integration config to:

- Demo public: `https://adoring-hugle.85-215-232-144.plesk.page/api/public`
- Demo internal: `https://adoring-hugle.85-215-232-144.plesk.page/api/v1`
- Production (documented for later): `https://system.wheelsrentacar.com.lb/api/public` and `/api/v1`

We will await the staging `WIZARD_API_TOKEN` via your secure channel, then enable real booking smoke tests and share the results.

One question to unblock vehicle sync on our side: what is the exact HTTP path and response schema for the vehicle sync endpoint? We are implementing against `GET /api/public/vehicles` (website-enabled only) unless you specify otherwise.

Best,  
Marc
