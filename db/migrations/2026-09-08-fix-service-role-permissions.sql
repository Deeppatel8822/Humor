-- Run this once in Supabase SQL Editor on the existing Humor Luxury project.
-- This fixes the 42501 permission error when COD tries to reduce product stock.

grant select, insert, update, delete on public.products to service_role;
grant select, insert, update, delete on public.customers to service_role;
grant select, insert, update, delete on public.addresses to service_role;
grant select, insert, update, delete on public.orders to service_role;
grant select, insert, update, delete on public.order_items to service_role;

-- The COD API uses the frontend catalog's numeric product IDs.
-- Keep this mapping column available on the products table.
alter table public.products add column if not exists catalog_id integer;
create unique index if not exists idx_products_catalog_id on public.products(catalog_id) where catalog_id is not null;
