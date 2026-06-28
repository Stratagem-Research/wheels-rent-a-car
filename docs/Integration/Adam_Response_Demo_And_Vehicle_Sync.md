> **Status: RECEIVED from Adam.** Archived 2026-06-22.

# Adam response — demo URLs, vehicle sync, and API revision

**From:** Adam (069 Design / Wizard team)  
**To:** Marc  
**In reply to:** [Email_to_Adam_Followup_Launch_Blockers.md](./Email_to_Adam_Followup_Launch_Blockers.md)

---

Hi Marc,

Thank you for the detailed summary. Overall, we are aligned on the separation of responsibilities between the website and Wizard.

A few important clarifications from our side:

The old lucid-mclean... demo URLs are no longer valid. That was an old temporary test setup and should not be used anymore.

The new demo system for your integration testing is:

https://adoring-hugle.85-215-232-144.plesk.page/login

The corresponding demo API base URLs should be:

Public:
https://adoring-hugle.85-215-232-144.plesk.page/api/public

Internal:
https://adoring-hugle.85-215-232-144.plesk.page/api/v1

The planned production API base URLs remain:

Public:
https://system.wheelsrentacar.com.lb/api/public

Internal:
https://system.wheelsrentacar.com.lb/api/v1

As discussed, these URLs, allowed CORS origins, and integration settings should remain configurable in the Wizard settings/API section and must not be hardcoded.

Regarding credentials, we will provide the staging WIZARD_API_TOKEN separately through a secure channel, not inside a normal email thread.

Regarding vehicles, we want to avoid a manual vehicle ID mapping as the long-term integration model.

Wizard must remain the source of truth for operational vehicles. The website should sync vehicles from the Wizard API. Supabase should then enrich these synced vehicles with website-owned content such as photos, slugs, badges, descriptions, landing content, and SEO data.

So the correct flow should be:

Wizard vehicle
→ Vehicle sync API
→ Website/Supabase receives the Wizard vehicle
→ Website adds marketing content
→ Booking is sent back to Wizard using the Wizard vehicle reference

This means that if a new vehicle is created in Wizard and marked as website-enabled, the website should be able to receive it automatically through the vehicle sync endpoint. A manual list of numeric vehicle IDs can only be a temporary helper for staging, but it should not become the final process.

For the vehicle sync, Wizard should provide fields such as:

Wizard vehicle_id

vehicle_type_id

brand / model / display name

category

website_enabled / public status

updated_at

any other non-sensitive operational fields required for booking and availability

Vehicle photos, slugs, marketing descriptions, badges, and landing content remain website-owned.

Regarding cancellation and refunds, your understanding is correct. The website and payment provider keep the customer-facing orchestration. Wizard should only receive a server-to-server request-style sync such as cancel_request. This must not automatically cancel the booking or trigger any refund state in Wizard until it has been reviewed and approved internally.

Regarding promo codes, our preferred launch setup is website-side promo validation. Wizard can receive the resulting promo code, discount amount, or note as part of the booking payload, but Wizard should not become the promo validation engine.

For the next Wizard API revision, we agree that the API contract should include:

Clean sanitized JSON errors for 429 / 4xx / 5xx responses instead of Laravel exception pages

Final rate limits per endpoint for staging and production

A fixed sync_type enum, for example payment_confirmed, payment_failed, cancel_request, and other agreed values

Idempotent handling of sync-status calls, so repeated payment callbacks or retries do not create duplicate side effects

A clear public_token lifecycle, including rotation, expiry, and any backward-compatibility window

Consistent timezone handling across availability, booking, lookup, and sync flows

Configurable allowed CORS origins and API integration settings

Until Wizard has first-class request states such as cancel_requested or change_requested, please continue using sync_type with a compatible operational booking status as described.

Once the demo token, vehicle sync, and access details are in place, you can enable real booking tests on the new demo environment and run your smoke test. Please share the results afterwards so we can close any remaining API issues before production.

Best,
Adam

---

## Website team assessment

| Topic | Status | Action |
| --- | --- | --- |
| Demo URLs retired | Confirmed | Point env/smoke/tests to `adoring-hugle` |
| Production URLs | Documented | `system.wheelsrentacar.com.lb` in handoff docs |
| Token | Pending secure channel | Enable real booking when received |
| Vehicle sync (not manual map) | Agreed architecture | `wizard_vehicles` table + sync job |
| Promo validation | Website-side at launch | Validate in Supabase; pass to Wizard in payload |
| Cancel/refund | Confirmed | `cancel_request` sync only |
| API revision items | Agreed for next Wizard release | Track in launch gate |

## Vehicle sync endpoint (pending spec)

Adam described fields but not the HTTP path. Website implementation assumes:

- **Primary:** `GET /api/public/vehicles` (website-enabled vehicles)
- **Fallback probe:** `GET /api/v1/vehicles` (internal, token required)

Confirm with Adam when vehicle sync ships on the new demo.

See [Email_to_Adam_Ack_Demo_Vehicle_Sync.md](./Email_to_Adam_Ack_Demo_Vehicle_Sync.md) for the acknowledgment draft.
