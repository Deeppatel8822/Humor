-- Humor Luxury cart activity analytics and abandoned-cart recovery.
create table if not exists public.cart_activity_events (
  id uuid primary key default uuid_generate_v4(),
  session_id text not null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  email text,
  phone text,
  event_type text not null check (event_type in ('add_to_cart','remove_from_cart','quantity_updated','checkout_started','purchase_completed','cart_cleared')),
  product_id uuid references public.products(id) on delete set null,
  product_slug text,
  product_name text,
  unit_price_inr integer not null default 0,
  quantity integer not null default 1,
  cart_value_inr integer not null default 0,
  page_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_cart_events_session_time on public.cart_activity_events(session_id, created_at desc);
create index if not exists idx_cart_events_type_time on public.cart_activity_events(event_type, created_at desc);
create index if not exists idx_cart_events_product_time on public.cart_activity_events(product_id, created_at desc);
alter table public.cart_activity_events enable row level security;
grant select, insert, update, delete on public.cart_activity_events to service_role;

create table if not exists public.abandoned_cart_offer_settings (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default false,
  offer_code text,
  offer_text text not null default 'A special offer is available for a limited time.',
  discount_label text not null default 'Special offer',
  expires_at timestamptz,
  reminder_after_minutes integer not null default 60 check (reminder_after_minutes between 15 and 10080),
  updated_at timestamptz not null default now()
);
alter table public.abandoned_cart_offer_settings enable row level security;
grant select, insert, update, delete on public.abandoned_cart_offer_settings to service_role;
insert into public.abandoned_cart_offer_settings(id, enabled, offer_text, discount_label, reminder_after_minutes)
values (1, false, 'Your cart is waiting. Complete checkout to enjoy this special offer.', 'Special offer', 60)
on conflict (id) do nothing;
