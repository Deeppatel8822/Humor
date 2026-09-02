-- Humor Luxury — Database Schema (Postgres / Supabase)
-- Run this in the Supabase SQL editor after creating your project.

create extension if not exists "uuid-ossp";

-- ---------- Products ----------
create table products (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  tagline text,
  description text not null,
  key_benefits text[] not null default '{}',
  key_ingredients jsonb not null default '[]',      -- [{ "name": "Niacinamide", "explanation": "..." }]
  full_ingredient_list text,                          -- full INCI list
  skin_hair_type text[] not null default '{}',        -- ["Dry", "Oily", "All Types"]
  how_to_use text,
  category text not null,                             -- 'skincare' | 'haircare'
  concern_tags text[] not null default '{}',           -- ["Acne", "Pigmentation"]
  routine_tags text[] not null default '{}',            -- ["Morning", "Night", "Hair Care"]
  price_inr integer not null,                          -- store in paise/whole rupees, decide convention
  compare_at_price_inr integer,
  stock_quantity integer not null default 0,
  sku text unique not null,
  images text[] not null default '{}',
  before_after_images jsonb default '[]',              -- [{ "before": "url", "after": "url", "caption": "..." }]
  is_bestseller boolean default false,
  is_featured boolean default false,
  status text not null default 'draft',                -- 'draft' | 'live'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_products_status on products(status);
create index idx_products_concern on products using gin(concern_tags);
create index idx_products_routine on products using gin(routine_tags);

-- ---------- Bundles ----------
create table bundles (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text,
  product_ids uuid[] not null,
  bundle_price_inr integer not null,
  images text[] default '{}',
  status text not null default 'draft',
  created_at timestamptz default now()
);

-- ---------- Reviews ----------
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references products(id) on delete cascade,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  photo_urls text[] default '{}',
  video_url text,
  is_verified_purchase boolean default false,
  is_approved boolean default false,                   -- moderation gate before it shows publicly
  created_at timestamptz default now()
);

create index idx_reviews_product on reviews(product_id);

-- ---------- Customers ----------
create table customers (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  phone text,
  full_name text,
  created_at timestamptz default now()
);

-- ---------- Addresses ----------
create table addresses (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  pincode text not null,
  country text not null default 'India',
  phone text not null
);

-- ---------- Orders ----------
create table orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,                    -- human-readable, e.g. HL-10234
  customer_id uuid references customers(id),
  status text not null default 'pending',                -- pending | paid | packed | shipped | delivered | cancelled | refunded
  subtotal_inr integer not null,
  discount_inr integer default 0,
  shipping_inr integer default 0,
  total_inr integer not null,
  coupon_code text,
  shipping_address_id uuid references addresses(id),
  razorpay_order_id text,
  razorpay_payment_id text,
  payment_status text default 'unpaid',                   -- unpaid | paid | failed
  tracking_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_orders_customer on orders(customer_id);
create index idx_orders_razorpay on orders(razorpay_order_id);

-- ---------- Order Items ----------
create table order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  bundle_id uuid references bundles(id),
  quantity integer not null,
  unit_price_inr integer not null
);

-- ---------- Coupons ----------
create table coupons (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  discount_type text not null,                            -- 'percent' | 'flat'
  discount_value integer not null,
  min_order_inr integer default 0,
  is_active boolean default true,
  expires_at timestamptz
);

-- ---------- Newsletter Signups ----------
create table newsletter_signups (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  coupon_sent text,
  created_at timestamptz default now()
);

-- Row Level Security: enable and restrict writes to server-side (service role) only.
-- Public reads allowed on products/reviews/bundles where status = 'live' / is_approved = true.
alter table products enable row level security;
create policy "public read live products" on products for select using (status = 'live');

alter table reviews enable row level security;
create policy "public read approved reviews" on reviews for select using (is_approved = true);

alter table bundles enable row level security;
create policy "public read live bundles" on bundles for select using (status = 'live');
