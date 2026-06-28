-- Website-owned checkout promo codes (validated before booking submit).

create table if not exists public.promo_codes (
  code text primary key,
  discount_percent numeric(5,2) not null check (discount_percent > 0 and discount_percent <= 100),
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.promo_codes (code, discount_percent, active)
values ('SUMMER15', 15, true)
on conflict (code) do nothing;

alter table public.promo_codes enable row level security;
