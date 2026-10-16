-- Profit Management: dedicated section access and product purchase costs.
create table if not exists public.profit_management_access (
  id text primary key default 'owner' check (id = 'owner'),
  password_hash text not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.profit_product_costs (
  product_id uuid primary key references public.products(id) on delete cascade,
  purchase_cost_inr numeric(12,2) not null default 0 check (purchase_cost_inr >= 0),
  updated_at timestamptz not null default now()
);
alter table public.profit_management_access enable row level security;
alter table public.profit_product_costs enable row level security;
revoke all on public.profit_management_access from anon, authenticated;
revoke all on public.profit_product_costs from anon, authenticated;
grant select, insert, update, delete on public.profit_management_access to service_role;
grant select, insert, update, delete on public.profit_product_costs to service_role;
