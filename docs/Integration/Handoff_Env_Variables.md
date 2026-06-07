# Handoff — Environment Variables

## Public website variables

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_MOCK_API`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_WHEELS_API_BASE_URL`
- `NEXT_PUBLIC_USE_REAL_BOOKING_API`
- `NEXT_PUBLIC_MAINTENANCE_MODE`

## Website backend/server-only variables

- `WHEELS_INTERNAL_API_BASE_URL`
- `WHEELS_INTERNAL_API_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `ADMIN_OPS_ADMIN_USERNAMES`
- `ADMIN_CONTENT_EDITOR_USERNAMES`
- `WHISH_CHANNEL`
- `WHISH_SECRET`
- `WEBSITE_URL`
- `NOTIFICATION_PROVIDER_KEY`
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

## Test/smoke toggles

- `RUN_LIVE_API_TESTS=1`
- optional `WHEELS_API_BASE_URL` (used by smoke script override)

## Validation commands

- Full launch mode (includes payment envs): `pnpm env:check`
- Payment-deferred mode: `pnpm env:check:payment-deferred`

## Auth (Supabase) configuration

`WEBSITE_URL` (or `NEXT_PUBLIC_SITE_URL` as fallback) is the origin used to build
every auth redirect/callback URL. It **must** be the real production domain
before go-live — local defaults to `http://localhost:3000`.

In the **Supabase dashboard → Authentication → URL Configuration**, the allowed
redirect URLs must include:

- `https://<production-domain>/api/auth/callback`
- (optionally) `http://localhost:3000/api/auth/callback` for local testing

`supabase/config.toml` currently lists only `https://127.0.0.1:3000` for local
dev; the hosted project's allow-list is configured separately in the dashboard.

Also configure **SMTP** (Auth → Emails) so password-reset and email-confirmation
messages send, and decide whether `enable_confirmations` should be on for the
hosted project.

## Secret handling

- Keep server-only vars out of client bundles.
- Store secrets in managed secret store (not in git).
- Rotate internal token and payment secrets on a defined cadence.
- Immediately rotate any credentials that were previously shared outside secret managers.
- `.env` currently contains placeholder values (`replace-with-real-*`) for `WHISH_CHANNEL`, `WHISH_SECRET`, and `WHEELS_INTERNAL_API_TOKEN` — replace before enabling payments/booking sync.
