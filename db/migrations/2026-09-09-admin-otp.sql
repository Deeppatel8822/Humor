create table if not exists public.admin_otps (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists admin_otps_identifier_created_idx on public.admin_otps(identifier, created_at desc);

alter table public.admin_otps enable row level security;

drop policy if exists "admin otp service role only" on public.admin_otps;
create policy "admin otp service role only" on public.admin_otps
  for all to service_role using (true) with check (true);

grant select, insert, update, delete on public.admin_otps to service_role;
