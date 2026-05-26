# Wheels API Gap Analysis (Post-Adam Clarifications)

Status: updated after P0 rollout confirmation.

## Delivered and verified

- Public availability endpoints.
- Public booking creation with canonical `reference` and `public_token`.
- Public booking lookup by `reference + email`.
- Public booking status by `public_token`.
- Internal sync-status endpoint contract path confirmed.
- Website-side Supabase + hybrid payment integration scaffolding landed in repo.

## No longer requested from Wizard (website-owned)

- Vehicle metadata/media CMS APIs for launch.
- Locations API for launch.
- Promo validation API for launch.
- Customer-facing notifications implementation.
- Website customer-account state orchestration.
- Cancellation/refund workflow orchestration.

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
