-- Humor Luxury CRM: product-wise WhatsApp reorder reminders.
-- Apply once in Supabase SQL Editor after deploying the matching application code.
create table if not exists public.product_reorder_settings (
  product_id uuid primary key references public.products(id) on delete cascade,
  reminder_after_days integer not null default 30 check (reminder_after_days between 1 and 365),
  is_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_whatsapp_consent (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references public.customers(id) on delete set null,
  phone_e164 text not null unique,
  customer_name text,
  email text,
  consent_status text not null default 'unknown' check (consent_status in ('unknown','opted_in','opted_out')),
  consent_source text,
  consent_at timestamptz,
  opted_out_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_reorder_reminders (
  id uuid primary key default uuid_generate_v4(),
  consent_id uuid references public.customer_whatsapp_consent(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  phone_e164 text not null,
  customer_name text,
  product_name text not null,
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','ready','sent','skipped','cancelled','failed')),
  message text,
  provider_message_id text,
  sent_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(order_id, product_id, phone_e164)
);

create index if not exists idx_whatsapp_reminders_due on public.whatsapp_reorder_reminders(status, due_at);
create index if not exists idx_whatsapp_reminders_phone on public.whatsapp_reorder_reminders(phone_e164, created_at desc);

alter table public.product_reorder_settings enable row level security;
alter table public.customer_whatsapp_consent enable row level security;
alter table public.whatsapp_reorder_reminders enable row level security;

grant select, insert, update, delete on public.product_reorder_settings to service_role;
grant select, insert, update, delete on public.customer_whatsapp_consent to service_role;
grant select, insert, update, delete on public.whatsapp_reorder_reminders to service_role;
