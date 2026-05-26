# Email to Backend Team (Post-Alignment)

Subject: Wheels website integration update + final contract clarifications

Hi team,

Thanks again for the P0 rollout and clarifications. We aligned our integration to the delivered endpoints and validated the updated contract.

What we completed on our side:

- Wired and validated `availability`, `availability/{id}`, `booking-request`, `bookings/{reference}?email=...`, and `booking-status/{public_token}`.
- Promoted backend `reference` as canonical booking reference in website flows.
- Stored `public_token` for status polling and continuity.
- Kept internal operational field `internal_block_until` out of customer-facing return-time UX.
- Added contract tests (schema/client/adapter) and expanded live integration smoke coverage.
- Implemented server-only mapper for `POST /api/v1/bookings/{reference}/sync-status`.
- Implemented Supabase-backed website persistence/auth scaffolding and hybrid payment orchestration with server-side Whish callback verification.

Ownership alignment now applied in website docs/code:

- Wizard-owned: public booking contract + internal sync endpoint + operational booking data.
- Website-owned: payment orchestration, cancellation/refund orchestration, customer notifications, long-term enquiries, website DB/deployment.

Final confirmations requested (remaining):

1. Final rate limits by endpoint (test and production values).
2. Confirmation that sanitized 429/4xx JSON is deployed everywhere.
3. Internal API token lifecycle and rotation policy.
4. `public_token` rotation/expiry behavior.
5. Allowed `sync_type` enum values.
6. Idempotency/replay handling for sync-status requests.
7. Roadmap status for extending `status` enum with request-like states.

Launch sign-off from our side now depends on:

- security gate completion (RLS negative tests + secret exposure checks),
- payment gate completion (authoritative status + replay/idempotency checks),
- operations gate completion (alerts + backup/restore + rollback drill),
- written confirmation of the 7 items above.

If useful, we can send a short postman collection that mirrors our live smoke contract tests.

Thanks,
Website team
