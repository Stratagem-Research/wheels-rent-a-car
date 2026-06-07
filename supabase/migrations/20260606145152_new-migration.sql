create table if not exists public.cms_trips (
  slug text primary key,
  title jsonb not null default '{"en": ""}'::jsonb,
  excerpt jsonb not null default '{"en": ""}'::jsonb,
  cover_image jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{"en": ""}'::jsonb,
  region text not null default 'mountains',
  body jsonb not null default '{"en": ""}'::jsonb,
  suggested_vehicle_category text not null default 'sedan',
  tags jsonb not null default '{"en": []}'::jsonb,
  published_at date not null default now()::date,
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_itineraries (
  slug text primary key,
  title jsonb not null default '{"en": ""}'::jsonb,
  excerpt jsonb not null default '{"en": ""}'::jsonb,
  cover_image jsonb not null default '{}'::jsonb,
  category text not null default 'day-trip',
  duration jsonb not null default '{"en": ""}'::jsonb,
  price_from_cents integer not null default 0,
  highlights jsonb not null default '{"en": []}'::jsonb,
  schedule jsonb not null default '[]'::jsonb,
  vehicle_class text not null default 'sedan',
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_faq_groups (
  id text primary key,
  title jsonb not null default '{"en": ""}'::jsonb,
  sort_order integer not null default 0
);

create table if not exists public.cms_faq_entries (
  id text primary key,
  group_id text not null references public.cms_faq_groups(id) on delete cascade,
  question jsonb not null default '{"en": ""}'::jsonb,
  answer jsonb not null default '{"en": ""}'::jsonb,
  sort_order integer not null default 0
);

create table if not exists public.cms_corporate_tiers (
  id text primary key,
  name jsonb not null default '{"en": ""}'::jsonb,
  tagline jsonb not null default '{"en": ""}'::jsonb,
  per_day_cents integer,
  fleet_size jsonb not null default '{"en": ""}'::jsonb,
  inclusions jsonb not null default '{"en": []}'::jsonb,
  popular boolean not null default false,
  cta_label jsonb,
  sort_order integer not null default 0
);

-- Backfill legacy text/array columns to localized JSONB maps where needed.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_trips' and column_name = 'title'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_trips alter column title type jsonb using jsonb_build_object('en', coalesce(title, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_trips' and column_name = 'excerpt'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_trips alter column excerpt type jsonb using jsonb_build_object('en', coalesce(excerpt, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_trips' and column_name = 'meta'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_trips alter column meta type jsonb using jsonb_build_object('en', coalesce(meta, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_trips' and column_name = 'body'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_trips alter column body type jsonb using jsonb_build_object('en', coalesce(body, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_trips' and column_name = 'tags'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_trips alter column tags type jsonb using jsonb_build_object('en', coalesce(tags, array[]::text[]));
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_itineraries' and column_name = 'title'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_itineraries alter column title type jsonb using jsonb_build_object('en', coalesce(title, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_itineraries' and column_name = 'excerpt'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_itineraries alter column excerpt type jsonb using jsonb_build_object('en', coalesce(excerpt, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_itineraries' and column_name = 'duration'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_itineraries alter column duration type jsonb using jsonb_build_object('en', coalesce(duration, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_itineraries' and column_name = 'highlights'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_itineraries alter column highlights type jsonb using jsonb_build_object('en', coalesce(highlights, array[]::text[]));
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_faq_groups' and column_name = 'title'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_faq_groups alter column title type jsonb using jsonb_build_object('en', coalesce(title, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_faq_entries' and column_name = 'question'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_faq_entries alter column question type jsonb using jsonb_build_object('en', coalesce(question, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_faq_entries' and column_name = 'answer'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_faq_entries alter column answer type jsonb using jsonb_build_object('en', coalesce(answer, ''));
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_corporate_tiers' and column_name = 'name'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_corporate_tiers alter column name type jsonb using jsonb_build_object('en', coalesce(name, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_corporate_tiers' and column_name = 'tagline'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_corporate_tiers alter column tagline type jsonb using jsonb_build_object('en', coalesce(tagline, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_corporate_tiers' and column_name = 'fleet_size'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_corporate_tiers alter column fleet_size type jsonb using jsonb_build_object('en', coalesce(fleet_size, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_corporate_tiers' and column_name = 'inclusions'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_corporate_tiers alter column inclusions type jsonb using jsonb_build_object('en', coalesce(inclusions, array[]::text[]));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_corporate_tiers' and column_name = 'cta_label'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_corporate_tiers alter column cta_label type jsonb using
      case when cta_label is null then null else jsonb_build_object('en', cta_label) end;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_about_sections' and column_name = 'pull_quote'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_about_sections alter column pull_quote type jsonb using jsonb_build_object('en', coalesce(pull_quote, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_about_sections' and column_name = 'fleet_heading'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_about_sections alter column fleet_heading type jsonb using jsonb_build_object('en', coalesce(fleet_heading, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_about_sections' and column_name = 'story_paragraphs'
      and data_type = 'jsonb'
  ) then
    update public.cms_about_sections
      set story_paragraphs = jsonb_build_object('en', coalesce(story_paragraphs, '[]'::jsonb))
      where jsonb_typeof(story_paragraphs) = 'array';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_about_sections' and column_name = 'fleet_paragraphs'
      and data_type = 'jsonb'
  ) then
    update public.cms_about_sections
      set fleet_paragraphs = jsonb_build_object('en', coalesce(fleet_paragraphs, '[]'::jsonb))
      where jsonb_typeof(fleet_paragraphs) = 'array';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_about_sections' and column_name = 'team_intro'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_about_sections alter column team_intro type jsonb using jsonb_build_object('en', coalesce(team_intro, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_about_sections' and column_name = 'team_dedication'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_about_sections alter column team_dedication type jsonb using jsonb_build_object('en', coalesce(team_dedication, ''));
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_about_stats' and column_name = 'label'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_about_stats alter column label type jsonb using jsonb_build_object('en', coalesce(label, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_about_team' and column_name = 'role'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_about_team alter column role type jsonb using jsonb_build_object('en', coalesce(role, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_about_team' and column_name = 'quote'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_about_team alter column quote type jsonb using
      case when quote is null then null else jsonb_build_object('en', quote) end;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_about_team' and column_name = 'bio'
      and data_type <> 'jsonb'
  ) then
    alter table public.cms_about_team alter column bio type jsonb using jsonb_build_object('en', coalesce(bio, ''));
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'cms_about_team' and column_name = 'highlights'
      and data_type = 'jsonb'
  ) then
    update public.cms_about_team
      set highlights = jsonb_build_object('en', coalesce(highlights, '[]'::jsonb))
      where jsonb_typeof(highlights) = 'array';
  end if;
end $$;
