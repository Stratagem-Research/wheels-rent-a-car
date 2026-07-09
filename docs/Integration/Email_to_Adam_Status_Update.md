> **Status: SENT by Marc (2026-07-08).** Awaiting Adam reply.

# Email to Adam — status update while waiting on token

**To:** Adam (069 Design / Wizard)  
**Cc:** Fatema, Elie  
**Subject:** Re: Wheels website — quick status update

---

Hi Adam,

Thanks for the update. Totally understood on the API info coming via email. We're aligned with your approach and will keep moving forward on our side, making any small adjustments once the token arrives.

Here's a quick snapshot of where we are.

**Done on our side**

* Repointed the integration to the updated demo URLs (adoring-hugle public and internal).
* Implemented vehicle sync against your confirmed endpoint: `GET /api/v1/vehicles/sync` (Bearer auth, incremental `?updated_since=`). Synced vehicles are stored in our `wizard_vehicles` table, while website-owned content such as photos, slugs, and badges remains in our CMS.
* Website-side promo validation is in place. Your API only receives the code/discount in the booking payload.
* P0 booking integration is wired, including payment sync, `cancel_request` flow, status polling, the 3-month cap, and related logic.
* Public API smoke tests pass on the demo environment without a token (`GET /availability` and `POST /booking-request`). We successfully created a test booking.
* All unit tests pass, and the full booking flow works in mock/offline mode while we wait for credentials.

**What's next (our side)**

* Continue the remaining website work, including staging environment preparation, payment scaffolding, and CMS polish.
* As soon as we receive the staging token, we'll run the live vehicle sync, enable real bookings, execute the full smoke and integration test suite, and share the results with you.
* Continue integrating the remaining Wish API endpoints as they become available.

**Still needed from your side**

* **WIZARD_API_TOKEN** (staging Bearer token). This is currently the main blocker for live vehicle sync and internal sync status calls. Whenever it comes through via email, please forward it through your secure channel.
* Staging server access (SSH/deploy) for the Next.js website, as discussed previously.
* The next API revision for launch hardening. This isn't blocking us today, but we'd love to align once it's available. That includes rate limits, a sanitized error envelope, the `sync_type` enum, sync idempotency, and the `public_token` lifecycle.
* Any remaining Wish documentation, credentials, or access needed to complete the integration as they become available.

The manual vehicle ID mapping is no longer needed on our side since we're now syncing directly from your API.

In the meantime, Elie, it would be great if you could make some progress on the team photos while we wait for the token so we can get those added to the site. Also, whenever you have a few minutes, feel free to go through the website again. If you notice anything you'd like us to improve, whether it's copy, layout, content, or UX, just drop it into a document and send it over. We'd be happy to tackle those items in parallel while we're waiting.

Let us know if anything above doesn't match your understanding, or if there's anything else you'd like us to prioritize in the meantime.

Best,

Marc
