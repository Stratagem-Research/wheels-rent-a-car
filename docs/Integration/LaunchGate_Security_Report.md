# Launch Gate — Security Report

Status: Partially complete (staging-dependent checks pending)
Owner: Website Team
Last updated: 2026-05-26

## Executed checks

1. **Secret pattern scan (repo)**
   - Method: searched for sensitive variable names and obvious credential patterns.
   - Result: no hardcoded runtime secret values found; only variable references and docs placeholders.

2. **Client bundle secret verification**
   - Method:
     - build production bundle (`pnpm build`)
     - search `.next/static` for server-only secret variable names
   - Result: no matches in client bundle for:
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `WHEELS_INTERNAL_API_TOKEN`
     - `WHISH_SECRET`

3. **Session hardening baseline**
   - Middleware updated to require both local session cookie and Supabase auth cookie for `/account/*`.
   - Auth routes implemented server-side (`app/api/auth/*`) with Supabase session-backed checks.

4. **RLS baseline**
   - RLS enabled in migration:
     - `supabase/migrations/20260526_000001_website_owned_core.sql`
   - Policies added for:
     - own profile read/update
     - authenticated insert for long-term enquiries
     - public read for `vehicle_metadata`

## Pending checks (must pass in staging)

- Credential rotation confirmation for any values exposed outside secret managers.
- RLS negative tests against staging data:
  - cross-user profile read/write attempts must fail.
  - service-managed tables must be inaccessible to normal user tokens.
- CI log review for accidental secret output.

## Evidence references

- Env validation: `lib/server/env.ts`
- Supabase admin client: `lib/supabase/admin.ts`
- Middleware gate: `middleware.ts`
- Migration + RLS: `supabase/migrations/20260526_000001_website_owned_core.sql`
