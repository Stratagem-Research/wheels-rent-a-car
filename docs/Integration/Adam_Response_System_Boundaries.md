> **Status: RECEIVED from Adam.** Archived 2026-06-22.

# Adam response — system boundary clarification

**From:** Adam (069 Design / Wizard team)  
**To:** Marc  
**In reply to:** [Email_to_Adam_Launch_Blockers.md](./Email_to_Adam_Launch_Blockers.md)

---

Hi Marc,

thank you for the very detailed report and for wiring the public booking flow into the customer-facing site already. It is good to hear that the current booking funnel works end-to-end against the test instance.

Before we move into the next API revision, I would like to clarify the system boundary a bit, so that both sides stay clean and easy to maintain.

The Wizard is our operational rental management software. It should remain responsible for operational rental data such as vehicles, availability, bookings, internal booking status, fleet blocking, booking references, public status lookup and internal notifications.

The customer-facing website, on the other hand, should own the website-specific experience and data layer. This includes marketing content, vehicle photos, slugs, badges, landing page content, customer-facing checkout logic, payment provider handling, refund calculations, customer accounts, email/WhatsApp communication to customers and website-specific validation.

A few important points from our side:

## 1. Customer identity

In our local operational system, customers are not primarily identified by email. In daily operations, phone number is more important. A customer can exist in the Wizard without an email address.

For the public website, it is absolutely fine and also useful to require and validate an email address. That validation should happen on the website side before submitting the booking. The reference + email lookup is also fine as a public website security layer. However, this should not mean that we redesign the Wizard around email as the primary customer key.

## 2. Cancellation and refund

Cancellation and refund handling should remain on the website/payment-provider side. A customer can request a cancellation through the website, but this must not automatically change the Wizard booking or trigger a refund without internal approval.

In the Wizard, the booking status should only be changed after approval by the internal team. For this reason, we do not want to expose a public cancel/refund endpoint that directly cancels a booking or changes refund state automatically.

## 3. CMS and marketing data

Vehicle photos, marketing descriptions, slugs, badges, feature bullets, promo banners and similar content are website/CMS data. These should live in the website system or website CMS, not in the Wizard.

The Wizard can provide the operational vehicle data and stable vehicle IDs. The website can then enrich those vehicles with customer-facing marketing data.

## 4. Payment and customer communication

The website/payment system should remain responsible for online payment flow, customer-facing payment state, customer emails and WhatsApp communication.

The Wizard can receive the resulting status from the website through the server-to-server sync endpoint, but it should not become the payment provider, refund engine or customer communication platform.

## 5. Website domains and configurable API settings

The current customer-facing website domain is wheelsrentacar.com.lb. The later main domain may become wheels.com.lb.

Because of that, API access points, allowed CORS origins, website base URLs, sync URLs, callback URLs and related integration settings should not be hardcoded in the system.

They should be configurable through a settings/API section, so they can be changed later without code changes or deployments.

For now, the relevant website origins should be treated as configurable values, for example:

- https://wheelsrentacar.com.lb
- https://www.wheelsrentacar.com.lb
- https://booking.wheelsrentacar.com.lb

Later, if needed, these can be changed or extended to:

- https://wheels.com.lb
- https://www.wheels.com.lb
- https://booking.wheels.com.lb

## 6. API scope for the next revision

From our side, the next Wizard API revision should focus on the operational API layer:

- clean JSON error responses
- documented rate limits
- configurable CORS production origins
- configurable website/API integration settings
- timezone consistency
- vehicle type normalization
- stable booking reference
- booking lookup/status endpoints
- website-to-Wizard payment/status sync

For the next step, I think it would be helpful if we keep the responsibilities clearly separated.

The Wizard can provide the operational rental data and APIs, and the website can handle the customer-facing experience around content, checkout, payments and communication.

That should make the integration cleaner and easier to maintain for both sides.

Best,  
Adam

---

## Website team assessment

| Adam point | Aligned with our build? | Notes |
| --- | --- | --- |
| Wizard = ops rental data | Yes | `lib/api/wheels-public/`, no direct DB writes |
| Website = CMS, checkout, payments, comms | Yes | Supabase CMS, Next.js APIs, Whish, notifications scaffold |
| Email required on website; phone primary in Wizard | Yes | Checkout validates email; lookup uses ref + email only |
| Cancel/refund on website; Wizard changes after ops approval | Yes | Sync uses `cancel_request` + `pending_approval`; no public Wizard cancel endpoint |
| CMS/marketing = website | Yes | Catalog, photos, slugs in Supabase |
| Domains configurable (not hardcoded) | Yes (website side) | We use `NEXT_PUBLIC_SITE_URL` / `WEBSITE_URL` env vars |
| Next Wizard revision = operational API hardening | N/A | Their roadmap; our blockers still open |

## Still not delivered in this reply

- `WIZARD_API_TOKEN` (staging)
- Full `vehicle_wizard_map` spreadsheet
- Staging server access for Next.js deploy
- Written confirmations: rate limits, sanitized errors, `sync_type` enum, sync idempotency, `public_token` lifecycle
- Promo code confirmation with Elie

See [Email_to_Adam_Followup_Launch_Blockers.md](./Email_to_Adam_Followup_Launch_Blockers.md) for the follow-up draft.
