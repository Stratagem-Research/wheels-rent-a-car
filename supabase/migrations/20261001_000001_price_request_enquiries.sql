-- Price requests submitted from fleet cards for manual cars with no published price.

create table if not exists public.price_request_enquiries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id text not null,
  vehicle_title text,
  email text not null,
  phone text not null,
  days_needed integer not null,
  start_date date,
  notes text,
  status text not null default 'new',
  owner text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists price_request_enquiries_created_at_idx
  on public.price_request_enquiries (created_at desc);
create index if not exists price_request_enquiries_status_idx
  on public.price_request_enquiries (status);
create index if not exists price_request_enquiries_vehicle_id_idx
  on public.price_request_enquiries (vehicle_id);

alter table public.price_request_enquiries enable row level security;
