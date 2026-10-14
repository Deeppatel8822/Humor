-- Make withdrawal decision and wallet ledger mutation atomic.
-- Apply in Supabase before relying on the updated admin route.

create or replace function public.business_programme_withdrawal_decide_and_post(
  p_partner_user_id uuid,
  p_reference_id text,
  p_decision text,
  p_amount_inr numeric,
  p_decided_by uuid,
  p_requested_at text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_existing public.business_programme_withdrawal_decisions%rowtype;
  v_tx public.business_programme_wallet_transactions%rowtype;
  v_balance numeric(12,2);
  v_tx_type text;
  v_delta numeric(12,2);
  v_inserted boolean := false;
begin
  if p_partner_user_id is null or p_reference_id is null or length(trim(p_reference_id)) = 0 then
    raise exception 'Partner and withdrawal reference are required';
  end if;
  if p_decision not in ('approve', 'reject') then
    raise exception 'Unsupported withdrawal decision';
  end if;
  if p_amount_inr is null or p_amount_inr <= 0 then
    raise exception 'Withdrawal amount must be positive';
  end if;

  v_tx_type := case when p_decision = 'approve' then 'withdrawal_approved' else 'withdrawal_rejected' end;
  v_delta := case when p_decision = 'reject' then p_amount_inr else 0 end;

  insert into public.business_programme_wallet_accounts(partner_user_id, balance_inr)
  values (p_partner_user_id, 0)
  on conflict (partner_user_id) do nothing;

  select balance_inr into v_balance
  from public.business_programme_wallet_accounts
  where partner_user_id = p_partner_user_id
  for update;

  select * into v_existing
  from public.business_programme_withdrawal_decisions
  where partner_user_id = p_partner_user_id and reference_id = p_reference_id
  for update;

  if found and v_existing.decision <> p_decision then
    return jsonb_build_object('success', false, 'conflict', true, 'decision', v_existing.decision, 'balance', v_balance);
  end if;

  if not found then
    insert into public.business_programme_withdrawal_decisions
      (partner_user_id, reference_id, decision, decided_by)
    values (p_partner_user_id, p_reference_id, p_decision, p_decided_by);
    v_inserted := true;
  end if;

  select * into v_tx
  from public.business_programme_wallet_transactions
  where partner_user_id = p_partner_user_id
    and transaction_type = v_tx_type
    and reference_id = p_reference_id;

  if found then
    return jsonb_build_object(
      'success', true, 'duplicate', not v_inserted, 'decision', p_decision,
      'balance', v_balance, 'transaction_id', v_tx.id
    );
  end if;

  v_balance := v_balance + v_delta;
  update public.business_programme_wallet_accounts
  set balance_inr = v_balance, updated_at = now()
  where partner_user_id = p_partner_user_id;

  insert into public.business_programme_wallet_transactions(
    partner_user_id, transaction_type, amount_inr, balance_after_inr,
    reference_id, status, description, metadata
  ) values (
    p_partner_user_id, v_tx_type, p_amount_inr, v_balance,
    p_reference_id, 'completed',
    case when p_decision = 'approve'
      then 'Withdrawal approved; external payout not yet confirmed'
      else 'Withdrawal rejected; reserved funds returned'
    end,
    jsonb_build_object('requestedAt', p_requested_at, 'decision', p_decision, 'decidedBy', p_decided_by)
  ) returning * into v_tx;

  return jsonb_build_object(
    'success', true, 'duplicate', not v_inserted, 'decision', p_decision,
    'balance', v_balance, 'transaction_id', v_tx.id
  );
end;
$$;

revoke all on function public.business_programme_withdrawal_decide_and_post(uuid,text,text,numeric,uuid,text) from public, anon, authenticated;
grant execute on function public.business_programme_withdrawal_decide_and_post(uuid,text,text,numeric,uuid,text) to service_role;
