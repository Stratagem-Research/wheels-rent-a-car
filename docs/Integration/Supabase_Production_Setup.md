# Supabase — Production Setup Runbook

Status: Ready to execute  
Owner: Website Team  
Last updated: 2026-07-27

## Automated preflight

After creating a **new** production project (empty database):

```bash
pnpm supabase:production-preflight
```

This runs `pnpm db:migrate` and `pnpm security:rls:negative`. Re-running migrations on an already-migrated database will fail — that is expected on dev/staging.

**RLS verification (2026-07-27):** `pnpm security:rls:negative` passes against the current shared dev/staging project. Re-run on the dedicated production project after step 1.


## Prerequisites

- Supabase account with billing enabled
- Domain list for Auth redirects:
  - `https://wheelsrentacar.com.lb`
  - `https://www.wheelsrentacar.com.lb`
  - `https://booking.wheelsrentacar.com.lb`
- SMTP provider for Auth emails (can share Resend domain with transactional notifications)

## Steps

### 1. Create project

1. Create a new Supabase project (recommended region: `eu-central-1`, matching current dev pooler).
2. Record project ref, URL, anon key, service role key, and pooler `DATABASE_URL`.

### 2. Apply migrations

```bash
export DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"
pnpm db:migrate
```

Migrations live in `supabase/migrations/` (9 files as of 2026-07-26).

### 3. Configure Auth

In **Authentication → URL Configuration**:

- Site URL: `https://wheelsrentacar.com.lb`
- Redirect URLs:
  - `https://wheelsrentacar.com.lb/api/auth/callback`
  - `https://www.wheelsrentacar.com.lb/api/auth/callback`
  - `https://booking.wheelsrentacar.com.lb/api/auth/callback`
  - `http://localhost:3000/api/auth/callback` (local dev only)

Configure **SMTP** for password reset / email confirmation.

Decide `enable_confirmations` for hosted Auth (recommend on for production).

### 4. Security verification

```bash
export DATABASE_URL=...
pnpm security:rls:negative
```

Re-run against the **production** project before go-live (dev project already passed 2026-07-11).

### 5. Production env vars

Set on Vercel / deployment target:

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only |
| `DATABASE_URL` | Pooler connection string |
| `WEBSITE_URL` | `https://wheelsrentacar.com.lb` |
| `NEXT_PUBLIC_SITE_URL` | Same as WEBSITE_URL |

### 6. Handover package for Wheels

Document and share via secure channel:

- Supabase dashboard access (owner transfer steps)
- All env vars above
- Migration history (`supabase/migrations/`)
- Auth redirect + SMTP configuration notes
- Backup/restore procedure

### 7. Transfer checklist (final handover)

- [ ] Add Wheels org owner to Supabase project
- [ ] Transfer project ownership to Wheels account
- [ ] Rotate service role key after transfer
- [ ] Confirm Wheels retains DNS + Vercel (or server) access

## Related docs

- `docs/Integration/Handoff_Env_Variables.md`
- `docs/Integration/Handoff_Server_Requirements.md`
