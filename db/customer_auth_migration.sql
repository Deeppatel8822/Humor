-- Customer OTP profile support + admin monitoring
-- Run once in Supabase SQL Editor.

alter table public.customers alter column email drop not null;

create unique index if not exists customers_phone_unique on public.customers(phone) where phone is not null;

grant select, insert, update on public.coupons to service_role;

grant select, insert, update on public.customers to service_role;
