-- Persistent, shared rate limits for admin OTP requests and verification attempts.
-- The table stores only a one-way hashed rate key, not raw IP addresses or identifiers.
create table if not exists public.admin_otp_rate_limits (
  rate_key text not null,
  action text not null check (action in ('request', 'verify')),
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now(),
  primary key (rate_key, action)
);

alter table public.admin_otp_rate_limits enable row level security;
revoke all on public.admin_otp_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.admin_otp_rate_limits to service_role;

create or replace function public.admin_otp_rate_limit_check(
  p_rate_key text,
  p_action text,
  p_limit integer,
  p_window_seconds integer
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_row public.admin_otp_rate_limits%rowtype;
  v_now timestamptz := clock_timestamp();
  v_allowed boolean;
  v_retry_after integer;
begin
  if p_rate_key is null or length(p_rate_key) < 32
     or p_action not in ('request', 'verify')
     or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit arguments';
  end if;

  insert into public.admin_otp_rate_limits(rate_key, action, window_started_at, attempts, updated_at)
  values (p_rate_key, p_action, v_now, 1, v_now)
  on conflict (rate_key, action) do update
  set window_started_at = case
        when public.admin_otp_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
          then v_now
        else public.admin_otp_rate_limits.window_started_at
      end,
      attempts = case
        when public.admin_otp_rate_limits.window_started_at <= v_now - make_interval(secs => p_window_seconds)
          then 1
        else public.admin_otp_rate_limits.attempts + 1
      end,
      updated_at = v_now
  returning * into v_row;

  v_allowed := v_row.attempts <= p_limit;
  v_retry_after := greatest(1, ceil(extract(epoch from (
    v_row.window_started_at + make_interval(secs => p_window_seconds) - v_now
  )))::integer);

  delete from public.admin_otp_rate_limits
  where updated_at < v_now - interval '2 days';

  return jsonb_build_object(
    'allowed', v_allowed,
    'attempts', v_row.attempts,
    'limit', p_limit,
    'retryAfterSeconds', case when v_allowed then 0 else v_retry_after end
  );
end;
$$;

revoke all on function public.admin_otp_rate_limit_check(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.admin_otp_rate_limit_check(text, text, integer, integer) to service_role;
