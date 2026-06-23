-- Car wash packages (admin-editable) and enquiry tables.

create table if not exists public.catalog_car_wash_packages (
  id text primary key,
  name jsonb not null,
  description jsonb not null,
  duration_minutes integer not null,
  turnaround_hours integer,
  currency text not null check (currency in ('USD', 'LBP')),
  pricing_mode text not null check (pricing_mode in ('fixed', 'by_vehicle_class')),
  price_cents integer,
  price_lbp integer,
  vehicle_prices jsonb,
  quote_only boolean not null default false,
  popular boolean not null default false,
  icon text not null default 'sparkles',
  sort_order integer not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.car_wash_enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  mobile text not null,
  package_id text,
  vehicle_class text,
  preferred_date date,
  preferred_time text,
  vehicle_make_model text,
  notes text,
  marketing boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  owner text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists car_wash_enquiries_created_at_idx
  on public.car_wash_enquiries (created_at desc);
create index if not exists car_wash_enquiries_status_idx
  on public.car_wash_enquiries (status);

create table if not exists public.fleet_partnership_enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  mobile text not null,
  company_name text,
  vehicle_count text,
  notes text,
  marketing boolean not null default false,
  status text not null default 'new',
  owner text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fleet_partnership_enquiries_created_at_idx
  on public.fleet_partnership_enquiries (created_at desc);
create index if not exists fleet_partnership_enquiries_status_idx
  on public.fleet_partnership_enquiries (status);

alter table public.catalog_car_wash_packages enable row level security;
alter table public.car_wash_enquiries enable row level security;
alter table public.fleet_partnership_enquiries enable row level security;

drop policy if exists catalog_car_wash_packages_read_all on public.catalog_car_wash_packages;
create policy catalog_car_wash_packages_read_all on public.catalog_car_wash_packages
  for select using (true);
