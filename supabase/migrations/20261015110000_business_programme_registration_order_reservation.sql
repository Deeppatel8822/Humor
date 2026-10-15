-- Prevent multiple active ₹9 registration orders for one Business Programme account.
-- This migration is server-side only. Apply it in Supabase before relying on the updated create-order route.

create table if not exists public.business_programme_registration_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  razorpay_order_id text unique,
  status text not null default 'creating'
    check (status in ('creating', 'created', 'submitted', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists business_programme_registration_one_active_order_per_user
  on public.business_programme_registration_orders(user_id)
  where status in ('creating', 'created');

create index if not exists business_programme_registration_orders_user_created
  on public.business_programme_registration_orders(user_id, created_at desc);

revoke all on public.business_programme_registration_orders from public, anon, authenticated;
grant select, insert, update, delete on public.business_programme_registration_orders to service_role;

create or replace function public.business_programme_registration_order_reserve(
  p_user_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user auth.users%rowtype;
  v_existing public.business_programme_registration_orders%rowtype;
  v_id uuid;
begin
  if p_user_id is null then
    raise exception 'A valid user is required';
  end if;

  select * into v_user from auth.users where id = p_user_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  if coalesce(v_user.raw_user_meta_data->'business_programme'->>'status', '') in ('pending_verification', 'approved') then
    return jsonb_build_object('success', false, 'conflict', true, 'error', 'APPLICATION_ALREADY_SUBMITTED');
  end if;

  -- A process may crash after reserving but before receiving a Razorpay order ID.
  -- Only that empty reservation can be reclaimed automatically after five minutes.
  update public.business_programme_registration_orders
  set status = 'failed', updated_at = now()
  where user_id = p_user_id
    and status = 'creating'
    and razorpay_order_id is null
    and updated_at < now() - interval '5 minutes';

  select * into v_existing
  from public.business_programme_registration_orders
  where user_id = p_user_id and status in ('creating', 'created')
  order by created_at desc
  limit 1
  for update;

  if found then
    if v_existing.status = 'created' and v_existing.razorpay_order_id is not null then
      return jsonb_build_object(
        'success', true, 'duplicate', true,
        'reservationId', v_existing.id, 'razorpayOrderId', v_existing.razorpay_order_id
      );
    end if;
    return jsonb_build_object('success', false, 'busy', true, 'error', 'REGISTRATION_ORDER_IN_PROGRESS');
  end if;

  insert into public.business_programme_registration_orders(user_id, status)
  values (p_user_id, 'creating')
  returning id into v_id;

  return jsonb_build_object('success', true, 'duplicate', false, 'reservationId', v_id);
end;
$$;

create or replace function public.business_programme_registration_order_attach(
  p_user_id uuid,
  p_reservation_id uuid,
  p_razorpay_order_id text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_row public.business_programme_registration_orders%rowtype;
begin
  if p_user_id is null or p_reservation_id is null
     or p_razorpay_order_id is null or length(trim(p_razorpay_order_id)) = 0 then
    raise exception 'User, reservation and Razorpay order ID are required';
  end if;

  update public.business_programme_registration_orders
  set razorpay_order_id = trim(p_razorpay_order_id), status = 'created', updated_at = now()
  where id = p_reservation_id and user_id = p_user_id and status = 'creating'
    and razorpay_order_id is null
  returning * into v_row;

  if found then
    return jsonb_build_object('success', true, 'duplicate', false, 'razorpayOrderId', v_row.razorpay_order_id);
  end if;

  select * into v_row
  from public.business_programme_registration_orders
  where id = p_reservation_id and user_id = p_user_id
  for update;

  if found and v_row.status = 'created' and v_row.razorpay_order_id = trim(p_razorpay_order_id) then
    return jsonb_build_object('success', true, 'duplicate', true, 'razorpayOrderId', v_row.razorpay_order_id);
  end if;

  return jsonb_build_object('success', false, 'error', 'RESERVATION_NOT_FOUND_OR_CONFLICT');
end;
$$;

create or replace function public.business_programme_registration_order_release(
  p_user_id uuid,
  p_reservation_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_count integer;
begin
  update public.business_programme_registration_orders
  set status = 'failed', updated_at = now()
  where id = p_reservation_id and user_id = p_user_id
    and status = 'creating' and razorpay_order_id is null;
  get diagnostics v_count = row_count;
  return jsonb_build_object('success', true, 'released', v_count > 0);
end;
$$;

-- Keep the application claim and registration-order completion in one transaction.
create or replace function public.business_programme_registration_claim(
  p_user_id uuid,
  p_programme jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user auth.users%rowtype;
  v_existing jsonb;
  v_status text;
  v_order public.business_programme_registration_orders%rowtype;
  v_order_id text;
begin
  if p_user_id is null or p_programme is null or jsonb_typeof(p_programme) <> 'object' then
    raise exception 'A valid user and programme object are required';
  end if;

  v_order_id := p_programme->>'razorpayOrderId';
  if coalesce(v_order_id, '') = '' then
    raise exception 'Razorpay order ID is required';
  end if;

  select * into v_user from auth.users where id = p_user_id for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  v_existing := coalesce(v_user.raw_user_meta_data->'business_programme', '{}'::jsonb);
  v_status := v_existing->>'status';

  if v_status in ('pending_verification', 'approved') then
    if v_existing->>'razorpayPaymentId' = p_programme->>'razorpayPaymentId'
       and v_existing->>'razorpayOrderId' = v_order_id then
      update public.business_programme_registration_orders
      set status = 'submitted', updated_at = now()
      where user_id = p_user_id and razorpay_order_id = v_order_id and status in ('created', 'submitted');
      return jsonb_build_object('success', true, 'duplicate', true, 'programme', v_existing);
    end if;
    return jsonb_build_object('success', false, 'conflict', true, 'error', 'APPLICATION_ALREADY_SUBMITTED');
  end if;

  select * into v_order
  from public.business_programme_registration_orders
  where user_id = p_user_id and razorpay_order_id = v_order_id
  for update;

  if found then
    if v_order.status <> 'created' then
      return jsonb_build_object('success', false, 'conflict', true, 'error', 'REGISTRATION_ORDER_NOT_ACTIVE');
    end if;
    update public.business_programme_registration_orders
    set status = 'submitted', updated_at = now()
    where id = v_order.id;
  else
    -- Backward compatibility for a checkout created before this reservation migration.
    insert into public.business_programme_registration_orders(user_id, razorpay_order_id, status)
    values (p_user_id, v_order_id, 'submitted')
    on conflict (razorpay_order_id) do nothing;
    select * into v_order
    from public.business_programme_registration_orders
    where razorpay_order_id = v_order_id;
    if not found or v_order.user_id <> p_user_id then
      return jsonb_build_object('success', false, 'conflict', true, 'error', 'REGISTRATION_ORDER_NOT_OWNED');
    end if;
  end if;

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('business_programme', p_programme),
      updated_at = now()
  where id = p_user_id;

  return jsonb_build_object('success', true, 'duplicate', false, 'programme', p_programme);
end;
$$;

revoke all on function public.business_programme_registration_order_reserve(uuid) from public, anon, authenticated;
revoke all on function public.business_programme_registration_order_attach(uuid,uuid,text) from public, anon, authenticated;
revoke all on function public.business_programme_registration_order_release(uuid,uuid) from public, anon, authenticated;
revoke all on function public.business_programme_registration_claim(uuid,jsonb) from public, anon, authenticated;
grant execute on function public.business_programme_registration_order_reserve(uuid) to service_role;
grant execute on function public.business_programme_registration_order_attach(uuid,uuid,text) to service_role;
grant execute on function public.business_programme_registration_order_release(uuid,uuid) to service_role;
grant execute on function public.business_programme_registration_claim(uuid,jsonb) to service_role;
