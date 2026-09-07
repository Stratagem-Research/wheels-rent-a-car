# Wheels API Gap Analysis (Post-Clarifications)

Status: updated 2026-06-22 after demo URL + vehicle sync reply.

## Delivered and verified

- Public availability endpoints.
- Public booking creation with canonical `reference` and `public_token`.
- Public booking lookup by `reference + email`.
- Public booking status by `public_token`.
- Internal sync-status endpoint contract path confirmed.
- Website-side Supabase + hybrid payment integration scaffolding landed in repo.

## Confirmed (2026-06-22) — website-owned

These remain on the website side.

- Vehicle metadata/media CMS (photos, slugs, badges, descriptions).
- Customer-facing checkout validation (including required email).
- Payment provider flow and customer-facing payment state.
- Refund calculations and cancellation orchestration.
- Customer accounts (website layer).
- Customer email and WhatsApp communication.
- Promo/marketing banners (CMS).

Wizard supplies operational vehicle IDs; website enriches with marketing data.

## Confirmed (2026-06-22) — Wizard-owned

- Operational vehicles, availability, bookings, internal status, fleet blocking.
- Canonical booking reference and `public_token`.
- Public lookup/status endpoints.
- Internal `sync-status` receiver (server-to-server).
- Internal ops notifications (Wizard-side).

## Cancellation model (aligned)

- Customer requests cancel on website → website calculates refund → website syncs `cancel_request` (or equivalent) to Wizard.
- Wizard booking status changes only after internal team approval.
- No public Wizard endpoint that auto-cancels or auto-refunds.

Implementation: `lib/api/wheels-public/sync-status.ts` (`cancel_requested` → `sync_type: cancel_request`, `status: pending_approval`).

## Vehicle sync (2026-06-30 — endpoint confirmed)

Wizard is the source of truth for operational vehicles. The website syncs via API into `wizard_vehicles`, then enriches with `vehicle_metadata` (photos, slugs, badges, SEO).

Flow: Wizard vehicle → sync API → Supabase → marketing enrichment → booking uses `wizard_vehicle_id`.

- **Confirmed endpoint:** internal `GET /api/v1/vehicles/sync` (bearer-authenticated, server-to-server). Incremental via `?updated_since=`.
- `GET /api/public/vehicles` is reserved for an optional future public list, not the sync source.
- **Manual `vehicle_wizard_map`:** staging-only fallback; deprecated for production.

See [Wizard_Vehicle_Sync_Endpoint.md](./Wizard_Vehicle_Sync_Endpoint.md).

Implementation: `lib/server/wizard-vehicle-sync.ts`, `lib/api/wheels-public/client.ts` (`syncVehicles`), `lib/booking/wizard-vehicle-id.ts`.

## Confirmed (2026-06-22) — promo codes

Website-side promo validation at launch. Wizard receives code/discount in booking payload only.

## Remaining backend clarifications / small gaps

1. Vehicle sync HTTP path and response schema — CONFIRMED 2026-06-30 (`GET /api/v1/vehicles/sync`).
2. Confirm production rate-limit values per endpoint (agreed for next Wizard revision).
3. Confirm sanitized `429` and 4xx error envelope (agreed for next Wizard revision).
4. Confirm internal API token lifecycle: creation, rotation, expiry, staging/prod separation.
5. Confirm `public_token` rotation behavior (agreed for next Wizard revision).
6. Publish fixed enum list for `sync_type` (agreed for next Wizard revision).
7. Confirm idempotency/replay policy for `sync-status` (agreed for next Wizard revision).

## Integration risk notes

- Current Wizard status enum mismatch is handled using `sync_type` fallback mapping.
- `internal_block_until` is operational metadata; website must not expose it as customer return time.
- Internal sync endpoint must stay server-to-server only.
- Replay/idempotency policy remains external dependency for final payment hardening sign-off.

## Verification references

- `docs/Implementation/19_backend_public_api.md`
- `lib/api/wheels-public/sync-status.ts`
- `tests/integration/wheels-public.live.test.ts`
