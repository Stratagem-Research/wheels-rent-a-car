# Deploying to a Plesk (Node.js / Passenger) server

This app is a Next.js 16 App Router site. On Plesk it runs as a **Node.js
application** via Phusion Passenger, using the self-contained *standalone*
build. Vercel is no longer required.

## Prerequisites (Plesk panel)

1. **Node.js extension** installed on the server.
2. **Node.js version 20 or newer** selected for the domain (Next 16 requires it;
   22 LTS recommended).
3. SSH access to the domain (to run the build and install pnpm).

## One-time server setup

```bash
# Install pnpm (the repo pins pnpm@10.29.3)
npm install -g pnpm@10.29.3
```

## Deploy / redeploy steps

From the domain's document root over SSH:

```bash
# 0. Pull the latest code
git pull

# 1. Install dependencies (includes native builds: sharp, swc, sentry-cli)
pnpm install --frozen-lockfile

# 2. Build the standalone server + copy static assets and public/ into it
pnpm build:plesk
```

Then in the **Plesk → Node.js** panel:

- **Application Root**: the repo directory.
- **Application Startup File**: `server.js` (root of the repo).
- **Application Mode**: `production`.
- Set the **environment variables** (see below), then **Restart App**.

> `server.js` simply boots `.next/standalone/server.js`. Passenger provides the
> port; the standalone server reads `process.env.PORT` and `HOSTNAME`
> (defaults to `0.0.0.0`). Do not run `next start` under Passenger.

After **Restart App**, confirm the boot:

```bash
curl -fsS https://wheelsrentacar.com.lb/api/health
```

It should return a 200 with `{ "ok": true, "service": "wheels-rent-a-car-web", "timestamp": "..." }`.
If it 502s, check the
Plesk Node.js app log — most often a missing env var.

## Required environment variables

Set these in the Plesk Node.js panel (they mirror `.env.example`). Production
boot requires all of the following — verify with `pnpm env:check:payment-deferred`
(or `pnpm env:check` once Whish credentials are issued):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `WEBSITE_URL` — **the site's own public origin** (e.g. `https://wheelsrentacar.com.lb`).
  There is no Vercel fallback here, so it must be set explicitly or URLs default to localhost.
- `WHEELS_INTERNAL_API_BASE_URL`
- `WHEELS_INTERNAL_API_TOKEN`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `ADMIN_OPS_ADMIN_USERNAMES`, `ADMIN_CONTENT_EDITOR_USERNAMES`
- `NEXT_PUBLIC_WHEELS_API_BASE_URL`, `WIZARD_PUBLIC_PARENT_ID`
- Payment flags (`PAYMENT_METHOD_*`), SMTP (`SMTP_*`, `NOTIFICATION_FROM_*`),
  and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` as needed.

`WHISH_CHANNEL` / `WHISH_SECRET` are only required once `PAYMENT_METHOD_WHISH_ONLINE=true`.

## Notes

- Re-run `pnpm build:plesk` and **Restart App** on every deploy.
- Static assets are served by the standalone server from
  `.next/standalone/{public,.next/static}` — the post-build script copies them.
- Keep the domain fronted by HTTPS (Plesk Let's Encrypt); `WEBSITE_URL` should use `https://`.
