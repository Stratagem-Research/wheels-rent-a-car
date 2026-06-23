-- Links authenticated users to Wizard booking references (website-owned).
-- Guest manage-booking uses reference + email against the public Wizard API.

create table if not exists public.user_bookings (
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_reference text not null,
  public_token text,
  wizard_booking_id bigint,
  created_at timestamptz not null default now(),
  primary key (user_id, booking_reference)
);

create index if not exists user_bookings_user_id_created_at_idx
  on public.user_bookings (user_id, created_at desc);

alter table public.user_bookings enable row level security;

drop policy if exists user_bookings_select_own on public.user_bookings;
create policy user_bookings_select_own on public.user_bookings
  for select using (auth.uid() = user_id);
