> **Status: DRAFT — ready to send by Marc.**

# Email to Adam — vehicle sync endpoint implemented

**To:** Adam (069 Design / Wizard team)  
**Subject:** Re: Vehicle sync — implemented against /api/v1/vehicles/sync

---

Hi Adam,

Perfect, thank you. We have implemented the vehicle sync against the internal endpoint:

- `GET /api/v1/vehicles/sync` with `Authorization: Bearer <token>` and `Accept: application/json`
- Incremental sync supported via `?updated_since=YYYY-MM-DD HH:mm:ss`
- We parse the confirmed schema (`vehicle_id`, `public_vehicle_key`, brand/model/display_name, category, gearbox/transmission, fuel_type, seats/doors, status, `website_enabled`, `is_sold`, `is_publicly_bookable`, `pricing.daily_rate`, `updated_at`)
- Inclusion rule on our side: `website_enabled && !is_sold && status == active` (and `is_publicly_bookable` when present)
- Synced vehicles land in our `wizard_vehicles` table and are enriched with website-owned content (photos, slugs, badges, SEO) in `vehicle_metadata`
- We treat `/api/public/vehicles` as an optional future public list, not the sync source

The only thing we are waiting on to run a live sync is the staging `WIZARD_API_TOKEN` via your secure channel. Once we have it we will run the sync plus the booking smoke test and share results.

Best,  
Marc
