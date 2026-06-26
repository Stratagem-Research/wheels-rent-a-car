# Wheels API Gap Analysis (Post-Adam Clarifications)

Status: updated 2026-06-22 after Adam boundary reply; launch blockers still pending (tracked in `LaunchGate_External_Signoff.md`).

## Delivered and verified

- Public availability endpoints.
- Public booking creation with canonical `reference` and `public_token`.
- Public booking lookup by `reference + email`.
- Public booking status by `public_token`.
- Internal sync-status endpoint contract path confirmed.
- Website-side Supabase + hybrid payment integration scaffolding landed in repo.

## Confirmed by Adam (2026-06-22) — website-owned

Adam explicitly confirmed these remain on the website side. See `Adam_Response_System_Boundaries.md`.

- Vehicle metadata/media CMS (photos, slugs, badges, descriptions).
- Customer-facing checkout validation (including required email).
- Payment provider flow and customer-facing payment state.
- Refund calculations and cancellation orchestration.
- Customer accounts (website layer).
- Customer email and WhatsApp communication.
- Promo/marketing banners (CMS).

Wizard supplies operational vehicle IDs; website enriches with marketing data.

## Confirmed by Adam (2026-06-22) — Wizard-owned

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

## No longer requested from Wizard (website-owned)

- Locations API for launch.
- Promo validation API for launch (pending Elie confirmation on website-side validation).
- Customer-facing notifications implementation.
- Website customer-account state orchestration.

## Remaining backend clarifications / small gaps

1. Confirm production rate-limit values per endpoint and environment.
2. Confirm sanitized `429` and 4xx error envelope is deployed in all environments.
3. Confirm internal API token lifecycle: creation, rotation, expiry, staging/prod separation.
4. Confirm `public_token` rotation behavior (if rotated, old-token validity window).
5. Publish fixed enum list for `sync_type`.
6. Confirm future plan for status enum extension to include request-like states.
7. Confirm idempotency/replay policy for `sync-status`.

## Integration risk notes

- Current Wizard status enum mismatch is handled using `sync_type` fallback mapping.
- `internal_block_until` is operational metadata; website must not expose it as customer return time.
- Internal sync endpoint must stay server-to-server only.
- Replay/idempotency policy remains external dependency for final payment hardening sign-off.

## Verification references

- `docs/Implementation/19_backend_public_api.md`
- `lib/api/wheels-public/sync-status.ts`
- `tests/integration/wheels-public.live.test.ts`
