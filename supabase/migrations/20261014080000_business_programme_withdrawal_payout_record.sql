-- Record an external bank payout after the transfer is confirmed.
-- This function never transfers money; it records an already-completed payout.

create or replace function public.business_programme_withdrawal_mark_paid(
  p_partner_user_id uuid,
  p_reference_id text,
  p_amount_inr numeric,
  p_payout_reference text,
  p_paid_by uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_approved public.business_programme_wallet_transactions%rowtype;
  v_paid public.business_programme_wallet_transactions%rowtype;
  v_balance numeric(12,2);
begin
  if p_partner_user_id is null or p_reference_id is null or length(trim(p_reference_id)) = 0
     or p_payout_reference is null or length(trim(p_payout_reference)) = 0 then
    raise exception 'Partner, withdrawal reference and payout reference are required';
  end if;
  if p_amount_inr is null or p_amount_inr <= 0 then
    raise exception 'Payout amount must be positive';
  end if;

  perform 1
  from public.business_programme_withdrawal_decisions
  where partner_user_id = p_partner_user_id
    and reference_id = p_reference_id
    and decision = 'approve'
  for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'WITHDRAWAL_NOT_APPROVED');
  end if;

  select * into v_approved
  from public.business_programme_wallet_transactions
  where partner_user_id = p_partner_user_id
    and reference_id = p_reference_id
    and transaction_type = 'withdrawal_approved'
  for update;
  if not found then
    return jsonb_build_object('success', false, 'error', 'APPROVAL_LEDGER_MISSING');
  end if;
  if v_approved.amount_inr <> p_amount_inr then
    return jsonb_build_object('success', false, 'error', 'WITHDRAWAL_AMOUNT_MISMATCH');
  end if;

  select * into v_paid
  from public.business_programme_wallet_transactions
  where partner_user_id = p_partner_user_id
    and reference_id = p_reference_id
    and transaction_type = 'withdrawal_paid'
  for update;
  if found then
    if v_paid.amount_inr <> p_amount_inr
       or coalesce(v_paid.metadata->>'payoutReference','') <> trim(p_payout_reference) then
      return jsonb_build_object('success', false, 'error', 'PAYOUT_ALREADY_RECORDED');
    end if;
    select balance_inr into v_balance
    from public.business_programme_wallet_accounts
    where partner_user_id = p_partner_user_id;
    return jsonb_build_object('success', true, 'duplicate', true, 'balance', coalesce(v_balance,0),
      'amount', v_paid.amount_inr, 'payoutReference', v_paid.metadata->>'payoutReference');
  end if;

  select balance_inr into v_balance
  from public.business_programme_wallet_accounts
  where partner_user_id = p_partner_user_id
  for update;

  insert into public.business_programme_wallet_transactions(
    partner_user_id, transaction_type, amount_inr, balance_after_inr,
    reference_id, status, description, metadata
  ) values (
    p_partner_user_id, 'withdrawal_paid', p_amount_inr, coalesce(v_balance,0),
    p_reference_id, 'completed', 'External bank payout confirmed',
    jsonb_build_object('payoutReference', trim(p_payout_reference), 'paidBy', p_paid_by,
      'approvedTransactionId', v_approved.id)
  ) returning * into v_paid;

  return jsonb_build_object('success', true, 'duplicate', false, 'balance', coalesce(v_balance,0),
    'amount', v_paid.amount_inr, 'payoutReference', trim(p_payout_reference));
end;
$$;

revoke all on function public.business_programme_withdrawal_mark_paid(uuid,text,numeric,text,uuid) from public, anon, authenticated;
grant execute on function public.business_programme_withdrawal_mark_paid(uuid,text,numeric,text,uuid) to service_role;
