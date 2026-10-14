-- Separate admin approval from actual payout so the ledger never implies
-- an external bank transfer happened merely because an admin approved it.

alter table public.business_programme_wallet_transactions
  drop constraint if exists business_programme_wallet_transactions_transaction_type_check;

alter table public.business_programme_wallet_transactions
  add constraint business_programme_wallet_transactions_transaction_type_check
  check (transaction_type in (
    'reward', 'withdrawal_request', 'withdrawal_approved', 'withdrawal_rejected',
    'withdrawal_paid', 'wallet_spend', 'wallet_refund', 'manual_adjustment'
  ));

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
  if p_transaction_type not in ('reward','withdrawal_request','withdrawal_approved','withdrawal_rejected','withdrawal_paid','wallet_spend','wallet_refund','manual_adjustment') then
    raise exception 'Unsupported transaction type';
  end if;

  insert into public.business_programme_wallet_accounts(partner_user_id, balance_inr)
    values (p_partner_user_id, 0)
    on conflict (partner_user_id) do nothing;
  select balance_inr into v_balance
    from public.business_programme_wallet_accounts
    where partner_user_id = p_partner_user_id
    for update;

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
    when p_transaction_type in ('withdrawal_approved','withdrawal_paid') then 0
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
