-- Admin-managed contact channels: the single source of truth for every
-- tel: link, wa.me deep-link, and JSON-LD telephone on the customer site.
-- Singleton row, id = 'default'. Edited at /admin/contact.

create table if not exists public.contact_settings (
  id text primary key,
  phone text not null,
  whatsapp text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.contact_settings (id, phone, whatsapp)
values ('default', '05 959 860', '+961 3 337 228')
on conflict (id) do nothing;

alter table public.contact_settings enable row level security;

-- Public read: the numbers are printed on every page anyway. Writes stay
-- service-role only (admin API), same as the other singleton settings.
drop policy if exists contact_settings_read_all on public.contact_settings;
create policy contact_settings_read_all on public.contact_settings
  for select using (true);
