-- Operational vehicles synced from Wizard (source of truth for fleet IDs).
-- Marketing content lives in vehicle_metadata keyed by wiz-{wizard_vehicle_id}.

create table if not exists public.wizard_vehicles (
  wizard_vehicle_id bigint primary key,
  vehicle_type_id bigint,
  brand text,
  model text,
  display_name text not null,
  category text,
  website_enabled boolean not null default false,
  wizard_updated_at timestamptz,
  operational jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now()
);

create index if not exists wizard_vehicles_website_enabled_idx
  on public.wizard_vehicles (website_enabled)
  where website_enabled = true;

alter table public.wizard_vehicles enable row level security;
