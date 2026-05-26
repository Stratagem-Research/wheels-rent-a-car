create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  country text default 'LB',
  marketing_opt_in boolean not null default false,
  whatsapp_opt_in boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicle_metadata (
  id uuid primary key default gen_random_uuid(),
  frontend_vehicle_id text not null unique,
  slug text not null,
  tagline text,
  description text,
  features jsonb not null default '[]'::jsonb,
  badges jsonb not null default '[]'::jsonb,
  media jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicle_wizard_map (
  id uuid primary key default gen_random_uuid(),
  frontend_vehicle_id text not null unique,
  wizard_vehicle_id bigint not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null,
  provider text not null,
  external_id bigint unique,
  status text not null,
  currency text not null default 'USD',
  amount numeric(12,2),
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payment_events_booking_reference_idx
  on public.payment_events (booking_reference);
create index if not exists payment_events_created_at_idx
  on public.payment_events (created_at desc);

create table if not exists public.booking_state_timeline (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null,
  state text not null,
  source text not null default 'website',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists booking_state_timeline_booking_reference_idx
  on public.booking_state_timeline (booking_reference);
create index if not exists booking_state_timeline_created_at_idx
  on public.booking_state_timeline (created_at desc);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  booking_reference text,
  channel text not null,
  template text not null,
  recipient text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  scheduled_for timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notification_outbox_status_scheduled_idx
  on public.notification_outbox (status, scheduled_for);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  outbox_id uuid references public.notification_outbox(id) on delete set null,
  booking_reference text,
  channel text not null,
  status text not null,
  provider_response jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists notification_logs_booking_reference_idx
  on public.notification_logs (booking_reference);

create table if not exists public.long_term_enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  duration_months integer not null,
  vehicle_category text,
  notes text,
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists long_term_enquiries_created_at_idx
  on public.long_term_enquiries (created_at desc);

alter table public.profiles enable row level security;
alter table public.vehicle_metadata enable row level security;
alter table public.vehicle_wizard_map enable row level security;
alter table public.payment_events enable row level security;
alter table public.booking_state_timeline enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.notification_logs enable row level security;
alter table public.long_term_enquiries enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

drop policy if exists long_term_enquiries_insert_authenticated on public.long_term_enquiries;
create policy long_term_enquiries_insert_authenticated on public.long_term_enquiries
  for insert with check (auth.uid() is not null);

drop policy if exists vehicle_metadata_read_all on public.vehicle_metadata;
create policy vehicle_metadata_read_all on public.vehicle_metadata
  for select using (true);
