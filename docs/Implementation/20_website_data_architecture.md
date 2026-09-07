# 20 — Website Data Architecture

## Purpose

Define the website-owned persistence layer and boundaries that sit outside Wizard.

## Website-owned entities (migrations-ready)

- `wizard_vehicles`: operational vehicle rows synced from Wizard (source of truth for fleet IDs, specs, website_enabled).
- `vehicle_metadata`: slug, copy, media references, feature bullets, badges — keyed by `wiz-{wizard_vehicle_id}`.
- `vehicle_wizard_map`: **deprecated staging fallback** — manual `frontend_vehicle_id` ↔ `wizard_vehicle_id` map.
- `payment_events`: provider event timeline, raw payload snapshots, reconciliation state.
- `booking_state_timeline`: customer-facing state history per booking reference.
- `notification_outbox`: pending notification jobs.
- `notification_logs`: delivery attempts/results.
- `long_term_enquiries`: marketing lead capture for >3 month rentals.
- optional `cms_pages`: static marketing content blocks.

## Vehicle catalog model (2026-06-22)

Wizard remains the source of truth for operational vehicles. The website must not maintain a manual numeric ID map in production.

```text
Wizard internal API (GET /api/v1/vehicles/sync, bearer auth)
  → wizard_vehicles (Supabase)
  → merge vehicle_metadata (photos, slugs, badges, SEO)
  → public Vehicle[] for /api/vehicles and booking funnel
  → booking-request uses wizard_vehicle_id from synced row
```

- New Wizard vehicles marked `website_enabled` appear after the next sync job.
- `vehicle_metadata` is created automatically with placeholder slug/image when missing; editors enrich in admin.
- Fixture vehicles (`lib/api/mocks/fixtures/vehicles`) are used only when `wizard_vehicles` is empty (local dev).

## Supabase implementation notes

- Database: Supabase Postgres (managed), migrations under `supabase/migrations/`.
- Auth: Supabase Auth users (`auth.users`) linked to `public.profiles`.
- Admin/service operations (payment callbacks, sync dispatcher, notifications) use service-role client.
- Browser/user data access is constrained by RLS.

## RLS baseline

- `profiles`: users read/update only their own profile (`auth.uid() = id`).
- `long_term_enquiries`: authenticated inserts allowed.
- service-managed tables (`payment_events`, `booking_state_timeline`, `notification_*`, `wizard_vehicles`) are written by server-side service-role only.

## Payment event model

- `payment_events.external_id` is unique for gateway idempotency.
- One payment external id should only transition once to terminal paid/failed states.
- `booking_state_timeline` records customer-facing state transitions derived from payment and ops flows.

## Constraints

- Browser never calls Wizard internal sync endpoint.
- Website DB is source of truth for website-owned workflows.
- Wizard remains source of truth for operational booking status and operational vehicle data.

## Integration keys

- Primary cross-system key: `booking_reference` (string).
- Secondary key: `public_token` for customer status polling.
- Vehicle key: `wizard_vehicle_id` (bigint); frontend id `wiz-{wizard_vehicle_id}`.

## Minimal launch behavior

- Vehicle sync: periodic or on-demand job from Wizard public API.
- Payment: capture provider events + sync to Wizard via server-side dispatcher.
- Cancellation/refund: website workflow + `cancel_request` sync to Wizard.
- Promo codes: validated on website; code/discount passed in booking payload.
- Notifications: booking received, payment confirmed/failed, booking confirmed.
- Long-term: >3 months is enquiry-only (no instant checkout).
