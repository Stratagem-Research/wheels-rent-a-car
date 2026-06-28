# Wizard vehicle sync endpoint probe (2026-06-22)

## Assumed contract (website implementation)

- **Method:** `GET`
- **Path:** `/api/public/vehicles`
- **Purpose:** Return all Wizard vehicles marked website-enabled for catalog sync.

## Probe results (new demo)

| URL | HTTP | Notes |
| --- | --- | --- |
| `https://adoring-hugle.85-215-232-144.plesk.page/api/public/vehicles` | 404 | Not deployed yet on demo |
| `https://adoring-hugle.85-215-232-144.plesk.page/api/public/availability` | 200 | Works; used as interim bootstrap |

## Interim bootstrap (until `/vehicles` ships)

When `GET /vehicles` returns 404, `syncWizardVehiclesFromApi()` deduplicates vehicles from a 7-day `/availability` window and upserts them into `wizard_vehicles` with `website_enabled=true`.

This is **staging-only** behavior. Production should use the dedicated vehicle sync endpoint once Adam publishes it.

## Expected fields (per Adam)

- `wizard_vehicle_id` / `id`
- `vehicle_type_id`
- brand / model / display name
- category / vehicle_type
- `website_enabled` or equivalent public status
- `updated_at`
- operational specs (gearbox, fuel, seats) as needed for booking

## Action for Wizard team

Confirm final path, auth requirements, and JSON schema. See [Email_to_Adam_Ack_Demo_Vehicle_Sync.md](./Email_to_Adam_Ack_Demo_Vehicle_Sync.md).
