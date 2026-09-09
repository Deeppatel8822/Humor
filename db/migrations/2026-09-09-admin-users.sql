-- Admin identity store for password management and future multi-admin support.
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null default 'Administrator',
  email text not null unique,
  mobile text,
  password_hash text,
  role text not null default 'admin' check (role in ('owner','admin','manager')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_users_mobile_idx on public.admin_users (mobile);

create table if not exists public.admin_password_resets (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.admin_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists admin_password_resets_lookup_idx
  on public.admin_password_resets (admin_user_id, expires_at);

alter table public.admin_users enable row level security;
alter table public.admin_password_resets enable row level security;

grant select, insert, update, delete on public.admin_users to service_role;
grant select, insert, update, delete on public.admin_password_resets to service_role;
