# Launch Gate — Security Report

Status: RLS pass on configured Supabase; prod re-verification via preflight script
Owner: Website Team
Last updated: 2026-07-27

## Executed checks

1. **Secret pattern scan** — no hardcoded runtime secrets in repo
2. **Client bundle secret verification** — service role / Whish / Wizard tokens not in client bundle
3. **Session hardening** — proxy gates `/account/*` and `/admin/*`
4. **RLS negative tests** — pass 2026-07-27 (`pnpm security:rls:negative`)

## Production Supabase

When the dedicated production project is created:

```bash
export DATABASE_URL=...   # prod pooler
pnpm supabase:production-preflight
```

This applies migrations and re-runs RLS tests. See `docs/Integration/Supabase_Production_Setup.md`.

## Pending

- Credential rotation sign-off if any secrets were shared outside secret managers
- Re-run RLS on **production** project after provisioning (distinct from shared dev project)

## Evidence references

- `scripts/rls-negative-tests.sql`, `scripts/run-rls-negative-tests.sh`
- `scripts/supabase-production-preflight.mjs`
