-- About-page CMS tables.
--
-- These back lib/supabase/admin-repository.ts (listAboutContent /
-- replaceAboutContent) and make the /about content editable from the admin
-- panel instead of served only from the code seed. Columns mirror the other
-- cms_* tables: localized JSONB maps shaped like {"en": "...", "ar": "...",
-- "fr": "..."} (or {"en": [...]} for list fields).
--
-- A prior migration (20260606145152_new-migration.sql) already contains
-- guarded ALTERs that convert these columns to jsonb if they exist; those are
-- no-ops until the tables are created here, and remain no-ops afterward since
-- we create the columns as jsonb from the start.
--
-- Reads/writes go through the service-role client (bypasses RLS). RLS is
-- enabled with a public read policy so the content can also be fetched with
-- the anon key, matching public.vehicle_metadata.

create table if not exists public.cms_about_sections (
  id text primary key,
  story_paragraphs jsonb not null default '{"en": []}'::jsonb,
  pull_quote jsonb not null default '{"en": ""}'::jsonb,
  fleet_heading jsonb not null default '{"en": ""}'::jsonb,
  fleet_paragraphs jsonb not null default '{"en": []}'::jsonb,
  team_intro jsonb not null default '{"en": ""}'::jsonb,
  team_dedication jsonb not null default '{"en": ""}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_about_stats (
  id text primary key,
  value text not null default '',
  label jsonb not null default '{"en": ""}'::jsonb,
  sort_order integer not null default 0
);

create table if not exists public.cms_about_team (
  id text primary key,
  name text not null default '',
  role jsonb not null default '{"en": ""}'::jsonb,
  photo text not null default '',
  quote jsonb,
  bio jsonb not null default '{"en": ""}'::jsonb,
  highlights jsonb not null default '{"en": []}'::jsonb,
  sort_order integer not null default 0
);

alter table public.cms_about_sections enable row level security;
alter table public.cms_about_stats enable row level security;
alter table public.cms_about_team enable row level security;

drop policy if exists cms_about_sections_read_all on public.cms_about_sections;
create policy cms_about_sections_read_all on public.cms_about_sections
  for select using (true);

drop policy if exists cms_about_stats_read_all on public.cms_about_stats;
create policy cms_about_stats_read_all on public.cms_about_stats
  for select using (true);

drop policy if exists cms_about_team_read_all on public.cms_about_team;
create policy cms_about_team_read_all on public.cms_about_team
  for select using (true);
