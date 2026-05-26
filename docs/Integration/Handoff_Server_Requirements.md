# Handoff — Server Requirements

## Required stack

- Node.js 22 LTS
- `pnpm` (workspace lockfile-aligned)
- Supabase Postgres (managed PostgreSQL 15+)
- Supabase Auth enabled
- Process manager (`systemd`, PM2, or container orchestrator)
- Reverse proxy (Nginx or equivalent TLS terminator)

## Services

- Web app process (Next.js runtime)
- Worker process for async jobs (notifications/sync/reconciliation)
- Supabase DB/Auth service
- Optional queue backend if worker uses external broker

## Build and run commands

- Install: `pnpm install --frozen-lockfile`
- Build: `pnpm build`
- Start web: `pnpm start`
- Type/lint/tests: `pnpm typecheck && pnpm lint && pnpm test`
- Migrations: `supabase db push` (or project migration runner equivalent)

## Storage and logs

- Persistent storage for DB and uploaded artifacts if applicable.
- Structured app logs with retention and rotation.
- Access + error logs at reverse proxy level.

## Backups

- Daily DB backup.
- Backup encryption at rest.
- Restore procedure tested before production go-live.
