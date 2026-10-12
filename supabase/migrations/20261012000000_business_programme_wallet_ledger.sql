-- Humor Luxury Business Programme wallet ledger.
-- Run once in Supabase SQL Editor. This migration creates a transactional wallet
-- balance and ledger; all balance mutations must go through the RPC below.

create table if not exists public.business_programme_wallet_accounts (
  partner_user_id uuid primary key references auth.users(id) on delete restrict,
  balance_inr numeric(12,2) not null default 0 check (balance_inr >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_programme_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  partner_user_id uuid not null references auth.users(id) on delete restrict,
  transaction_type text not null check (transaction_type in (
    'reward', 'withdrawal_request', 'withdrawal_rejected', 'withdrawal_paid',
    'wallet_spend', 'wallet_refund', 'manual_adjustment'
  )),
  amount_inr numeric(12,2) not null check (amount_inr > 0),
  balance_after_inr numeric(12,2) not null check (balance_after_inr >= 0),
  reference_id text not null,
  status text not null default 'completed' check (status in (
    'pending', 'completed', 'rejected', 'reversed'
  )),
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint business_programme_wallet_tx_once unique (partner_user_id, transaction_type, reference_id)
);

create index if not exists business_programme_wallet_transactions_partner_created_idx
  on public.business_programme_wallet_transactions (partner_user_id, created_at desc);

alter table public.business_programme_wallet_accounts enable row level security;
alter table public.business_programme_wallet_transactions enable row level security;

-- Keep tables server-only. Access is through the server-side service role and
-- this restricted SECURITY DEFINER function.
revoke all on public.business_programme_wallet_accounts from anon, authenticated;
revoke all on public.business_programme_wallet_transactions from anon, authenticated;
grant select, insert, update on public.business_programme_wallet_accounts to service_role;
grant select, insert on public.business_programme_wallet_transactions to service_role;

create or replace function public.business_programme_wallet_post(
  p_partner_user_id uuid,
  p_transaction_type text,
  p_amount_inr numeric,
  p_reference_id text,
  p_description text default null,
  p_metadata jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_delta numeric(12,2);
  v_balance numeric(12,2);
  v_existing public.business_programme_wallet_transactions%rowtype;
begin
  if p_partner_user_id is null or p_reference_id is null or length(trim(p_reference_id)) = 0 then
    raise exception 'Partner and transaction reference are required';
  end if;
  if p_amount_inr is null or p_amount_inr <= 0 then
    raise exception 'Transaction amount must be positive';
  end if;
  if p_transaction_type not in ('reward','withdrawal_request','withdrawal_rejected','withdrawal_paid','wallet_spend','wallet_refund','manual_adjustment') then
    raise exception 'Unsupported transaction type';
  end if;

  -- Lock the account so simultaneous requests cannot spend the same balance.
  insert into public.business_programme_wallet_accounts(partner_user_id, balance_inr)
    values (p_partner_user_id, 0)
    on conflict (partner_user_id) do nothing;
  select balance_inr into v_balance
    from public.business_programme_wallet_accounts
    where partner_user_id = p_partner_user_id
    for update;

  -- Repeated API calls with the same type/reference are idempotent.
  select * into v_existing
    from public.business_programme_wallet_transactions
    where partner_user_id = p_partner_user_id
      and transaction_type = p_transaction_type
      and reference_id = p_reference_id;
  if found then
    return jsonb_build_object(
      'success', true, 'duplicate', true,
      'balance', v_balance, 'transaction_id', v_existing.id
    );
  end if;

  v_delta := case
    when p_transaction_type in ('reward','withdrawal_rejected','wallet_refund') then p_amount_inr
    when p_transaction_type in ('withdrawal_request','wallet_spend') then -p_amount_inr
    when p_transaction_type = 'withdrawal_paid' then 0
    when p_transaction_type = 'manual_adjustment' then p_amount_inr
    else 0
  end;

  if v_balance + v_delta < 0 then
    return jsonb_build_object('success', false, 'error', 'INSUFFICIENT_BALANCE', 'balance', v_balance);
  end if;

  v_balance := v_balance + v_delta;
  update public.business_programme_wallet_accounts
    set balance_inr = v_balance, updated_at = now()
    where partner_user_id = p_partner_user_id;

  insert into public.business_programme_wallet_transactions(
    partner_user_id, transaction_type, amount_inr, balance_after_inr,
    reference_id, status, description, metadata
  ) values (
    p_partner_user_id, p_transaction_type, p_amount_inr, v_balance,
    p_reference_id,
    case when p_transaction_type = 'withdrawal_request' then 'pending' else 'completed' end,
    p_description, coalesce(p_metadata, '{}'::jsonb)
  ) returning * into v_existing;

  return jsonb_build_object(
    'success', true, 'duplicate', false,
    'balance', v_balance, 'transaction_id', v_existing.id
  );
end;
$$;

revoke all on function public.business_programme_wallet_post(uuid,text,numeric,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.business_programme_wallet_post(uuid,text,numeric,text,text,jsonb) to service_role;

-- One-time balance bootstrap from the current Auth metadata. Existing amounts
-- are copied only when an account does not already exist.
insert into public.business_programme_wallet_accounts(partner_user_id, balance_inr)
select
  u.id,
  case
    when coalesce(u.raw_app_meta_data->'marketing_partner'->>'walletBalance','') ~ '^[0-9]+(\.[0-9]+)?$'
      then (u.raw_app_meta_data->'marketing_partner'->>'walletBalance')::numeric(12,2)
    else 0
  end
from auth.users u
where u.raw_app_meta_data ? 'marketing_partner'
on conflict (partner_user_id) do nothing;
