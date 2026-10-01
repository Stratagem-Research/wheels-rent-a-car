-- Admin-managed payment configuration: the bank account shown on the
-- checkout "Bank transfer" panel (and repeated in the confirmation email),
-- plus the per-method surcharge applied to the total at the last booking
-- step. Singleton row, id = 'default'. Edited at /admin/payment.

create table if not exists public.payment_settings (
  id text primary key,
  bank_name text not null default '',
  account_name text not null default '',
  account_number text not null default '',
  iban text not null default '',
  swift text not null default '',
  instructions text not null default '',
  -- { "<method>": { "mode": "none|fixed|percent",
  --                 "amountCents": <int>, "percent": <number> } }
  surcharges jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.payment_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.payment_settings enable row level security;

-- Public read: both the bank details and the surcharge are printed at
-- checkout before the customer commits, so they are public by design.
-- Writes stay service-role only (admin API), same as the other singletons.
drop policy if exists payment_settings_read_all on public.payment_settings;
create policy payment_settings_read_all on public.payment_settings
  for select using (true);
