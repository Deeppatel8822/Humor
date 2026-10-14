-- Atomically reserve a withdrawal and deduplicate concurrent requests for the same amount.
-- Apply this migration in Supabase before deploying the route that calls the RPC.

create or replace function public.business_programme_withdrawal_reserve(
  p_partner_user_id uuid,
  p_amount_inr numeric,
  p_reference_id text,
  p_requested_at timestamptz,
  p_description text default 'Partner withdrawal request'
) returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_balance numeric(12,2);
  v_existing public.business_programme_wallet_transactions%rowtype;
begin
  if p_partner_user_id is null or p_reference_id is null or length(trim(p_reference_id)) = 0 then
    raise exception 'Partner and withdrawal reference are required';
  end if;
  if p_amount_inr is null or p_amount_inr <= 0 then
    raise exception 'Withdrawal amount must be positive';
  end if;

  insert into public.business_programme_wallet_accounts(partner_user_id, balance_inr)
  values (p_partner_user_id, 0)
  on conflict (partner_user_id) do nothing;

  -- Serialize all withdrawal reservations for this partner.
  select balance_inr into v_balance
  from public.business_programme_wallet_accounts
  where partner_user_id = p_partner_user_id
  for update;

  -- Same-amount request already awaiting a decision? Return it, without
  -- reserving funds a second time. The account lock prevents concurrent races.
  select tx.* into v_existing
  from public.business_programme_wallet_transactions tx
  where tx.partner_user_id = p_partner_user_id
    and tx.transaction_type = 'withdrawal_request'
    and tx.amount_inr = p_amount_inr
    and tx.status = 'pending'
    and not exists (
      select 1 from public.business_programme_withdrawal_decisions d
      where d.partner_user_id = tx.partner_user_id
        and d.reference_id = tx.reference_id
    )
  order by tx.created_at desc
  limit 1;

  if found then
    return jsonb_build_object(
      'success', true, 'duplicate', true, 'balance', v_balance,
      'reference_id', v_existing.reference_id, 'created_at', v_existing.created_at
    );
  end if;

  if v_balance < p_amount_inr then
    return jsonb_build_object('success', false, 'error', 'INSUFFICIENT_BALANCE', 'balance', v_balance);
  end if;

  v_balance := v_balance - p_amount_inr;
  update public.business_programme_wallet_accounts
  set balance_inr = v_balance, updated_at = now()
  where partner_user_id = p_partner_user_id;

  insert into public.business_programme_wallet_transactions(
    partner_user_id, transaction_type, amount_inr, balance_after_inr,
    reference_id, status, description, metadata
  ) values (
    p_partner_user_id, 'withdrawal_request', p_amount_inr, v_balance,
    p_reference_id, 'pending', p_description,
    jsonb_build_object('requestedAt', p_requested_at)
  );

  return jsonb_build_object(
    'success', true, 'duplicate', false, 'balance', v_balance,
    'reference_id', p_reference_id, 'created_at', p_requested_at
  );
end;
$$;

revoke all on function public.business_programme_withdrawal_reserve(uuid,numeric,text,timestamptz,text) from public, anon, authenticated;
grant execute on function public.business_programme_withdrawal_reserve(uuid,numeric,text,timestamptz,text) to service_role;
