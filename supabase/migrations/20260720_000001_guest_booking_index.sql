-- Guest booking index: links bookings submitted without an account to an email
-- so they can be claimed into user_bookings on register/login.

create table if not exists public.guest_booking_index (
  email text not null,
  booking_reference text not null,
  public_token text,
  wizard_booking_id bigint,
  created_at timestamptz not null default now(),
  primary key (email, booking_reference)
);

create index if not exists guest_booking_index_email_idx
  on public.guest_booking_index (email);

alter table public.guest_booking_index enable row level security;

-- No client policies: service-role writes/reads only.
