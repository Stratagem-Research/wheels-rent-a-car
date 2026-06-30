# Wizard vehicle sync endpoint (confirmed 2026-06-30)

Adam confirmed the vehicle sync source is the **internal** server-to-server
endpoint, not the public vehicle list.

## Contract

- **Method:** `GET`
- **Path:** `/api/v1/vehicles/sync`
- **Demo URL:** `https://adoring-hugle.85-215-232-144.plesk.page/api/v1/vehicles/sync`
- **Production URL:** `https://system.wheelsrentacar.com.lb/api/v1/vehicles/sync`
- **Auth:** `Authorization: Bearer WIZARD_API_TOKEN`, `Accept: application/json`
- **Incremental:** `?updated_since=2026-06-27%2000:00:00`

`GET /api/public/vehicles` may exist later as a public-facing list, but the
website syncs from the internal endpoint above.

## Response schema

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

Only non-sensitive fields are exposed (no license plates, notes, customer data,
or private operational details).

## Website implementation

- Schema: `WizardVehicleSyncResponseSchema` in `lib/api/wheels-public/schemas.ts`.
- Client: `createWheelsInternalClient().syncVehicles({ updatedSince })` (bearer auth) in `lib/api/wheels-public/client.ts`.
- Service: `syncWizardVehiclesFromApi({ updatedSince })` in `lib/server/wizard-vehicle-sync.ts`.
- Triggers:
  - CLI: `pnpm wizard:sync-vehicles "2026-06-27 00:00:00"` (arg optional)
  - Admin: `POST /api/admin/fleet/sync?updated_since=...` (ops-admin)
- Inclusion rule: `website_enabled && !is_sold && status === "active"` and, when present, `is_publicly_bookable`.
- Frontend id: `wiz-{vehicle_id}`; marketing content stays in `vehicle_metadata`.

## Status

- Endpoint requires `WHEELS_INTERNAL_API_TOKEN` (pending secure channel).
- Once the token is set, run `pnpm wizard:sync-vehicles` and confirm `wizard_vehicles` is populated from the live endpoint.
