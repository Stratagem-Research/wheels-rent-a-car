-- Server-side record of admin sign-ins. The session cookie is a signed token
-- carrying a session id (sid); a request is only honoured while that row exists,
-- hasn't been revoked and hasn't expired. That makes logout (and any future
-- "sign out everywhere") actually end the session instead of just clearing the
-- browser's copy of the cookie.

create table if not exists public.admin_sessions (
  id uuid primary key,
  username text not null,
  role text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists admin_sessions_expires_at_idx
  on public.admin_sessions (expires_at);

-- Service-role only (admin API). No policies on purpose: with RLS enabled and
-- none defined, anon/authenticated clients can read nothing.
alter table public.admin_sessions enable row level security;
