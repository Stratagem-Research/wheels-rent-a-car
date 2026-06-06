create table if not exists public.corporate_enquiries (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  full_name text not null,
  job_title text,
  email text not null,
  mobile text not null,
  tier text,
  urgency text,
  notes text,
  marketing boolean not null default false,
  status text not null default 'new',
  owner text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists corporate_enquiries_created_at_idx
  on public.corporate_enquiries (created_at desc);
create index if not exists corporate_enquiries_status_idx
  on public.corporate_enquiries (status);

create table if not exists public.chauffeur_enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  mobile text not null,
  service_type text,
  vehicle_class text,
  trip_date date,
  passengers integer,
  pickup_location text,
  notes text,
  marketing boolean not null default false,
  status text not null default 'new',
  owner text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chauffeur_enquiries_created_at_idx
  on public.chauffeur_enquiries (created_at desc);
create index if not exists chauffeur_enquiries_status_idx
  on public.chauffeur_enquiries (status);

create table if not exists public.locations (
  id text primary key,
  slug text not null unique,
  name text not null,
  address text not null,
  city text not null,
  lat numeric(9,6) not null,
  lng numeric(9,6) not null,
  phone text not null,
  whatsapp text,
  hours jsonb not null default '[]'::jsonb,
  is_airport boolean not null default false,
  temporarily_closed boolean not null default false,
  closed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id text primary key,
  message text not null,
  href text,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  role text not null,
  resource text not null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx
  on public.admin_audit_logs (created_at desc);

create table if not exists public.cms_about_sections (
  id text primary key,
  story_paragraphs jsonb not null default '[]'::jsonb,
  pull_quote text not null default '',
  fleet_heading text not null default '',
  fleet_paragraphs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_about_stats (
  id text primary key,
  value text not null,
  label text not null,
  sort_order integer not null default 0
);

create table if not exists public.cms_about_team (
  id text primary key,
  name text not null,
  role text not null,
  photo text not null,
  quote text,
  sort_order integer not null default 0
);

alter table public.cms_about_sections
  add column if not exists team_intro text not null default '',
  add column if not exists team_dedication text not null default '';

alter table public.cms_about_team
  add column if not exists bio text not null default '',
  add column if not exists highlights jsonb not null default '[]'::jsonb;

alter table public.long_term_enquiries
  add column if not exists owner text,
  add column if not exists admin_notes text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.corporate_enquiries enable row level security;
alter table public.chauffeur_enquiries enable row level security;
alter table public.locations enable row level security;
alter table public.promotions enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.cms_about_sections enable row level security;
alter table public.cms_about_stats enable row level security;
alter table public.cms_about_team enable row level security;

drop policy if exists locations_read_all on public.locations;
create policy locations_read_all on public.locations
  for select using (true);

drop policy if exists promotions_read_all on public.promotions;
create policy promotions_read_all on public.promotions
  for select using (true);

drop policy if exists cms_about_sections_read_all on public.cms_about_sections;
create policy cms_about_sections_read_all on public.cms_about_sections
  for select using (true);

drop policy if exists cms_about_stats_read_all on public.cms_about_stats;
create policy cms_about_stats_read_all on public.cms_about_stats
  for select using (true);

drop policy if exists cms_about_team_read_all on public.cms_about_team;
create policy cms_about_team_read_all on public.cms_about_team
  for select using (true);
