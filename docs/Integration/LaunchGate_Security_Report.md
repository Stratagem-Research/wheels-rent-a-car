# Launch Gate — Security Report

Status: RLS checks passed against live Supabase; ops drills still pending
Owner: Website Team
Last updated: 2026-07-11

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
   - Proxy updated to gate `/account/*` and `/admin/*` server-side.
   - Auth routes implemented server-side (`app/api/auth/*`) with Supabase session-backed checks.

4. **RLS baseline**
   - RLS enabled in migration:
     - `supabase/migrations/20260526_000001_website_owned_core.sql`
   - Policies added for:
     - own profile read/update
     - authenticated insert for long-term enquiries
     - public read for `vehicle_metadata`

5. **RLS negative test harness added**
   - SQL test script: `scripts/rls-negative-tests.sql`
   - Runner: `scripts/run-rls-negative-tests.sh`
   - Includes negative checks for `anon` and `authenticated` access to service-managed tables, plus authenticated insert path for `long_term_enquiries`.

6. **Staging DB connectivity — resolved 2026-07-11**
   - Direct `db.<ref>.supabase.co` host still fails DNS resolution in this
     environment (IPv6-only record). Workaround: use the IPv4-friendly
     Supabase pooler host (`aws-1-eu-central-1.pooler.supabase.com`,
     user `postgres.<project-ref>`), same pattern already used by
     `scripts/apply-all-migrations.mjs`.
   - Once connected, `psql` reached the DB successfully.

7. **RLS negative tests — executed and passed 2026-07-11**
   - Ran `scripts/run-rls-negative-tests.sh` against the live Supabase project
     via the pooler connection.
   - Found and fixed a **test-logic bug**: the script treated any successful
     `SELECT` as a breach, but RLS-enabled-with-no-policy protects by
     returning zero rows (not a privilege error). This made the test always
     fail even when data was genuinely inaccessible. Rewrote assertions to
     check actual row visibility (`exists(select ...)`) instead of only
     catching `insufficient_privilege` (`scripts/rls-negative-tests.sql`).
   - After the fix, confirmed with a direct query that `anon` sees **zero
     rows** on `payment_events` — genuinely protected, not a false pass.
   - Full suite result: **all checks pass** (anon + authenticated blocked from
     service-managed tables; authenticated insert on `long_term_enquiries`
     succeeds as intended).

## Pending checks (must pass in staging)

- Credential rotation confirmation for any values exposed outside secret managers.
- CI log review for accidental secret output.
- Re-run RLS negative tests against the production Supabase project before go-live (verified against the shared staging/dev project so far).

## Evidence references

- Env validation: `lib/server/env.ts`
- Supabase admin client: `lib/supabase/admin.ts`
- Proxy gate: `proxy.ts`
- Migration + RLS: `supabase/migrations/20260526_000001_website_owned_core.sql`
- RLS negative tests: `scripts/rls-negative-tests.sql`, `scripts/run-rls-negative-tests.sh`
