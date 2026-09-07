# Production Cutover Runbook

Status: **Do not execute until Wizard staging approval + prod token**  
Owner: Website Team  
Last updated: 2026-07-27

Policy: no test bookings or unrestricted testing against production Wizard until final go-live approval.

## Pre-cutover (T-7 to T-1)

- [ ] Staging sign-off complete ([Manual_QA_Checklist.md](./Manual_QA_Checklist.md))
- [ ] Launch gates Pass
- [ ] Production `WIZARD_API_TOKEN` received via secure channel
- [ ] Wheels SMTP credentials set (`SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_ENCRYPTION`, `NOTIFICATION_FROM_EMAIL`/`NOTIFICATION_FROM_NAME`); Resend not required
- [ ] Real bank transfer IBAN updated in `messages/en.json` (and ar/fr)

## Cutover window (T-0)

### 1. Env switch (Vercel production)

| Variable | Production value |
| --- | --- |
| `NEXT_PUBLIC_WHEELS_API_BASE_URL` | `https://system.wheelsrentacar.com.lb/api/public` |
| `WHEELS_INTERNAL_API_BASE_URL` | `https://system.wheelsrentacar.com.lb/api/v1` |
| `WHEELS_INTERNAL_API_TOKEN` | prod token |
| `WEBSITE_URL` | `https://wheelsrentacar.com.lb` |
| `NEXT_PUBLIC_SITE_URL` | `https://wheelsrentacar.com.lb` |

Deploy. **Do not** run live E2E checkout against production.

### 2. Minimal smoke (read-only / safe)

```bash
curl -sS https://wheelsrentacar.com.lb/api/health
curl -sS https://wheelsrentacar.com.lb/api/site-config
pnpm wizard:sync-vehicles   # read-only fleet sync
```

### 3. Monitor (first 24h)

- Sentry: 5xx on `/api/booking/*`, payment callbacks, notification worker
- Supabase: `notification_outbox` pending count
- Wizard: sync-status failures in logs

## Rollback

1. Revert Vercel deployment to previous release
2. Restore demo Wizard env vars if internal jobs still pointed at prod

## Post-cutover

- [ ] Execute Supabase handover per [Supabase_Production_Setup.md](./Supabase_Production_Setup.md) §7
- [ ] Enable Whish/NEO env flags individually when merchant credentials arrive
