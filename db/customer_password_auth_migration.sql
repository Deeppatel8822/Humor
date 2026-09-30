-- Run once in Supabase SQL Editor for password-based customer accounts.
-- Mobile number is stored in customers and used as an alternate login identifier.

alter table public.customers alter column email drop not null;

create unique index if not exists customers_phone_unique
on public.customers(phone)
where phone is not null;

grant select, insert, update on public.customers to service_role;
grant select, insert, update on public.addresses to service_role;
