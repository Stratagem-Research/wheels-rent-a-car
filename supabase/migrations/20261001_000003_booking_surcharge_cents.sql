-- Payment-method surcharge persisted alongside the rest of the price
-- breakdown, so a booking's stored total stays reconcilable line by line
-- after the admin changes the surcharge at /admin/payment.

alter table public.user_bookings
  add column if not exists surcharge_cents integer;

alter table public.guest_booking_index
  add column if not exists surcharge_cents integer;
