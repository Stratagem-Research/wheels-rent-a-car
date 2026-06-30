> **Status: RECEIVED from Adam.** Archived 2026-06-30.

# Adam response — vehicle sync endpoint specification

**From:** Adam (069 Design / Wizard team)  
**To:** Marc  
**In reply to:** [Email_to_Adam_Ack_Demo_Vehicle_Sync.md](./Email_to_Adam_Ack_Demo_Vehicle_Sync.md)

---

Hi Marc,

Thank you, that sounds good.

For the vehicle sync, please implement against the internal server-to-server endpoint, not the public vehicle list.

The intended endpoint is:

`GET /api/v1/vehicles/sync`

Demo full URL: `https://adoring-hugle.85-215-232-144.plesk.page/api/v1/vehicles/sync`

This endpoint should be called with:

```
Authorization: Bearer WIZARD_API_TOKEN
Accept: application/json
```

Please use this endpoint for syncing Wizard vehicles into Supabase. The `/api/public/vehicles` endpoint can be used later as a public-facing vehicle list if needed, but the main sync source should be `/api/v1/vehicles/sync`.

The response schema will be:

```json
{
  "success": true,
  "data": {
    "sync_type": "vehicles",
    "parent_id": 2,
    "timezone": "Asia/Beirut",
    "updated_since": null,
    "count": 1,
    "vehicles": [
      {
        "vehicle_id": 131,
        "id": 131,
        "public_vehicle_key": "wizard_vehicle_131",
        "vehicle_type_id": 2,
        "brand": "Toyota",
        "model": "Yaris",
        "name": "Toyota Yaris",
        "display_name": "Toyota Yaris",
        "category": "Economy",
        "gearbox": "automatic",
        "transmission": "automatic",
        "fuel_type": "petrol",
        "number_of_seats": 5,
        "number_of_doors": 5,
        "status": "active",
        "website_enabled": true,
        "is_sold": false,
        "is_publicly_bookable": true,
        "pricing": { "daily_rate": 45, "standard_price": 45, "currency": null },
        "updated_at": "2026-06-27 12:00:00",
        "created_at": "2026-06-20 10:00:00",
        "timezone": "Asia/Beirut"
      }
    ]
  }
}
```

For incremental sync, you can use: `GET /api/v1/vehicles/sync?updated_since=2026-06-27%2000:00:00`

The endpoint will only return non-sensitive vehicle data required for website synchronization. License plates, internal notes, customer data, and private operational details are not exposed.

Best,
Adam

---

## Website team action (done)

- Repointed sync from `GET /api/public/vehicles` to internal `GET /api/v1/vehicles/sync` (bearer auth).
- Updated `WizardVehicleSyncResponseSchema` to the confirmed schema.
- Added `createWheelsInternalClient().syncVehicles({ updatedSince })`.
- Removed the availability-bootstrap fallback (no longer needed).
- Incremental sync via `?updated_since=` wired into CLI and admin route.

Pending only the `WHEELS_INTERNAL_API_TOKEN` (secure channel) to run a live sync.

See [Wizard_Vehicle_Sync_Endpoint.md](./Wizard_Vehicle_Sync_Endpoint.md) for the implementation reference.
