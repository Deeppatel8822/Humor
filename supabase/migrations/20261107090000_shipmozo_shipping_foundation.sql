-- Shipmozo shipping foundation: product parcel dimensions and shipment records.
-- Dimensions remain nullable until an admin enters verified packed-product values.
alter table public.products
  add column if not exists weight_grams numeric(10,2),
  add column if not exists length_cm numeric(10,2),
  add column if not exists width_cm numeric(10,2),
  add column if not exists height_cm numeric(10,2);

alter table public.products
  drop constraint if exists products_shipping_dimensions_positive;

alter table public.products
  add constraint products_shipping_dimensions_positive
  check (
    (weight_grams is null or weight_grams > 0) and
    (length_cm is null or length_cm > 0) and
    (width_cm is null or width_cm > 0) and
    (height_cm is null or height_cm > 0)
  );

create table if not exists public.shipmozo_shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider_order_id text,
  awb_number text,
  courier_name text,
  tracking_url text,
  label_url text,
  shipment_status text not null default 'pending',
  package_weight_grams numeric(10,2),
  package_length_cm numeric(10,2),
  package_width_cm numeric(10,2),
  package_height_cm numeric(10,2),
  shipping_charge_inr numeric(10,2),
  request_snapshot jsonb,
  response_snapshot jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipmozo_shipments_order_id_unique unique(order_id)
);

create index if not exists shipmozo_shipments_awb_idx
  on public.shipmozo_shipments (awb_number)
  where awb_number is not null;

alter table public.shipmozo_shipments enable row level security;
