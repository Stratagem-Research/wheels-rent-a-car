# 20 — Website Data Architecture

## Purpose

Define the website-owned persistence layer and boundaries that sit outside Wizard.

## Website-owned entities (migrations-ready)

- `vehicle_metadata`: slug, copy, media references, feature bullets, badges.
- `vehicle_wizard_map`: `frontend_vehicle_id` <-> `wizard_vehicle_id`.
- `payment_events`: provider event timeline, raw payload snapshots, reconciliation state.
- `booking_state_timeline`: customer-facing state history per booking reference.
- `notification_outbox`: pending notification jobs.
- `notification_logs`: delivery attempts/results.
- `long_term_enquiries`: marketing lead capture for >3 month rentals.
- optional `cms_pages`: static marketing content blocks.

## Supabase implementation notes

- Database: Supabase Postgres (managed), migrations under `supabase/migrations/`.
- Auth: Supabase Auth users (`auth.users`) linked to `public.profiles`.
- Admin/service operations (payment callbacks, sync dispatcher, notifications) use service-role client.
- Browser/user data access is constrained by RLS.

## RLS baseline

- `profiles`: users read/update only their own profile (`auth.uid() = id`).
- `long_term_enquiries`: authenticated inserts allowed.
- service-managed tables (`payment_events`, `booking_state_timeline`, `notification_*`) are written by server-side service-role only.

## Payment event model

- `payment_events.external_id` is unique for gateway idempotency.
- One payment external id should only transition once to terminal paid/failed states.
- `booking_state_timeline` records customer-facing state transitions derived from payment and ops flows.

## Constraints

- Browser never calls Wizard internal sync endpoint.
- Website DB is source of truth for website-owned workflows.
- Wizard remains source of truth for operational booking status.

## Integration keys

- Primary cross-system key: `booking_reference` (string).
- Secondary key: `public_token` for customer status polling.

## Minimal launch behavior

- Payment: capture provider events + sync to Wizard via server-side dispatcher.
- Cancellation/refund: website workflow + sync updates to Wizard.
- Notifications: booking received, payment confirmed/failed, booking confirmed.
- Long-term: >3 months is enquiry-only (no instant checkout).
