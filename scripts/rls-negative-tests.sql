-- RLS negative tests for website-owned tables.
-- Run with: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/rls-negative-tests.sql

begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1) ANON should not read service-managed tables.
-- ─────────────────────────────────────────────────────────────────────────────
set local role anon;

do $$
begin
  perform 1 from public.payment_events limit 1;
  raise exception 'RLS breach: anon can read public.payment_events';
exception
  when insufficient_privilege then
    null;
end
$$;

do $$
begin
  perform 1 from public.notification_outbox limit 1;
  raise exception 'RLS breach: anon can read public.notification_outbox';
exception
  when insufficient_privilege then
    null;
end
$$;

do $$
begin
  perform 1 from public.booking_state_timeline limit 1;
  raise exception 'RLS breach: anon can read public.booking_state_timeline';
exception
  when insufficient_privilege then
    null;
end
$$;

do $$
begin
  perform 1 from public.admin_audit_logs limit 1;
  raise exception 'RLS breach: anon can read public.admin_audit_logs';
exception
  when insufficient_privilege then
    null;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2) AUTHENTICATED should still be blocked from service-managed reads.
-- ─────────────────────────────────────────────────────────────────────────────
set local role authenticated;
set local "request.jwt.claim.sub" = '00000000-0000-0000-0000-000000000001';

do $$
begin
  perform 1 from public.payment_events limit 1;
  raise exception 'RLS breach: authenticated user can read public.payment_events';
exception
  when insufficient_privilege then
    null;
end
$$;

do $$
begin
  perform 1 from public.notification_logs limit 1;
  raise exception 'RLS breach: authenticated user can read public.notification_logs';
exception
  when insufficient_privilege then
    null;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3) AUTHENTICATED insert policy on long_term_enquiries should hold.
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.long_term_enquiries (
  full_name,
  email,
  phone,
  duration_months,
  vehicle_category,
  notes,
  metadata
)
values (
  'RLS Test User',
  'rls-test@example.com',
  '+96170111222',
  3,
  'sedan',
  'temporary test row',
  '{"source":"rls-negative-tests.sql"}'::jsonb
);

rollback;
