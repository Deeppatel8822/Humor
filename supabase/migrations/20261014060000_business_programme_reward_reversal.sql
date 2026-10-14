-- Full-refund reward reversal for the Humor Luxury Business Programme.
-- Run after the wallet ledger and atomic reward migrations.
-- This does NOT issue a Razorpay refund. It records the reversal only after an admin
-- confirms that the actual refund has already completed with the payment provider.

alter table public.business_programme_wallet_transactions
  drop constraint if exists business_programme_wallet_transactions_transaction_type_check;

alter table public.business_programme_wallet_transactions
  add constraint business_programme_wallet_transactions_transaction_type_check
  check (transaction_type in (
    'reward', 'reward_reversal',
    'withdrawal_request', 'withdrawal_approved', 'withdrawal_rejected',
    'withdrawal_paid', 'wallet_spend', 'wallet_refund', 'manual_adjustment'
  ));

create or replace function public.business_programme_reward_reverse(
  p_order_number text,
  p_refund_reference text
) returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_reward public.business_programme_wallet_transactions%rowtype;
  v_existing public.business_programme_wallet_transactions%rowtype;
  v_state public.business_programme_partner_reward_state%rowtype;
  v_balance numeric(12,2);
  v_wallet_debit numeric(12,2);
  v_unrecovered numeric(12,2);
  v_billed numeric(12,2);
  v_window_active boolean;
  v_ref text;
begin
  if p_order_number is null or length(trim(p_order_number)) = 0
     or p_refund_reference is null or length(trim(p_refund_reference)) = 0 then
    raise exception 'Order number and completed refund reference are required';
  end if;

  v_ref := 'refund:order:' || trim(p_order_number);

  select * into v_reward
  from public.business_programme_wallet_transactions
  where transaction_type = 'reward'
    and reference_id = 'order:' || trim(p_order_number)
  for update;

  if not found then
    return jsonb_build_object('success', true, 'no_partner_reward', true, 'message', 'No canonical partner reward exists for this order.');
  end if;

  select * into v_existing
  from public.business_programme_wallet_transactions
  where partner_user_id = v_reward.partner_user_id
    and transaction_type = 'reward_reversal'
    and reference_id = v_ref
  for update;

  if found then
    if coalesce(v_existing.metadata->>'refundReference','') <> trim(p_refund_reference) then
      return jsonb_build_object('success', false, 'error', 'REFUND_ALREADY_RECORDED',
        'refundReference', v_existing.metadata->>'refundReference');
    end if;
    select balance_inr into v_balance
    from public.business_programme_wallet_accounts
    where partner_user_id = v_reward.partner_user_id;
    select * into v_state
    from public.business_programme_partner_reward_state
    where partner_user_id = v_reward.partner_user_id;
    return jsonb_build_object('success', true, 'duplicate', true, 'balance', coalesce(v_balance,0),
      'reward', v_reward.amount_inr, 'partnerUserId', v_reward.partner_user_id,
      'unrecoveredAmount', coalesce((v_existing.metadata->>'unrecoveredAmount')::numeric,0),
      'rewardTier', v_state.reward_tier, 'qualificationCoins', v_state.qualification_coins,
      'lifetimeRewards', v_state.lifetime_rewards, 'totalSales', v_state.total_sales,
      'referredOrders', v_state.referred_orders, 'couponUsageCount', v_state.coupon_usage_count);
  end if;

  insert into public.business_programme_wallet_accounts(partner_user_id, balance_inr)
  values (v_reward.partner_user_id, 0)
  on conflict (partner_user_id) do nothing;

  select balance_inr into v_balance
  from public.business_programme_wallet_accounts
  where partner_user_id = v_reward.partner_user_id
  for update;

  select * into v_state
  from public.business_programme_partner_reward_state
  where partner_user_id = v_reward.partner_user_id
  for update;

  if not found then
    raise exception 'Partner reward state is missing; apply the atomic rewards migration first';
  end if;

  v_wallet_debit := least(v_balance, v_reward.amount_inr);
  v_unrecovered := greatest(0, v_reward.amount_inr - v_wallet_debit);
  v_balance := v_balance - v_wallet_debit;

  v_billed := case
    when coalesce(v_reward.metadata->>'billedAmountInr','') ~ '^[0-9]+(\.[0-9]+)?$'
    then (v_reward.metadata->>'billedAmountInr')::numeric
    else 0
  end;

  v_window_active := v_state.qualification_period_started_at is not null
    and v_state.qualification_period_started_at <= now()
    and now() - v_state.qualification_period_started_at < interval '30 days'
    and v_reward.created_at >= v_state.qualification_period_started_at
    and v_reward.created_at < v_state.qualification_period_started_at + interval '30 days';

  update public.business_programme_wallet_accounts
  set balance_inr = v_balance, updated_at = now()
  where partner_user_id = v_reward.partner_user_id;

  insert into public.business_programme_wallet_transactions(
    partner_user_id, transaction_type, amount_inr, balance_after_inr,
    reference_id, status, description, metadata
  ) values (
    v_reward.partner_user_id, 'reward_reversal', v_reward.amount_inr, v_balance,
    v_ref, 'completed',
    'Full-refund reversal for order ' || trim(p_order_number),
    jsonb_build_object(
      'orderNumber', trim(p_order_number),
      'refundReference', trim(p_refund_reference),
      'partnerUserId', v_reward.partner_user_id,
      'originalRewardTransactionId', v_reward.id,
      'originalRewardAmount', v_reward.amount_inr,
      'walletDebit', v_wallet_debit,
      'unrecoveredAmount', v_unrecovered,
      'billedAmountInr', v_billed
    )
  );

  update public.business_programme_partner_reward_state
  set qualification_coins = case when v_window_active
        then greatest(0, qualification_coins - v_reward.amount_inr)
        else qualification_coins end,
      lifetime_rewards = greatest(0, lifetime_rewards - v_reward.amount_inr),
      total_sales = greatest(0, total_sales - v_billed),
      referred_orders = greatest(0, referred_orders - 1),
      coupon_usage_count = greatest(0, coupon_usage_count - 1),
      -- Upgraded tiers are permanent under programme rules, even if an order is later refunded.
      reward_tier = reward_tier,
      updated_at = now()
  where partner_user_id = v_reward.partner_user_id
  returning * into v_state;

  return jsonb_build_object(
    'success', true, 'duplicate', false, 'balance', v_balance,
    'reward', v_reward.amount_inr, 'partnerUserId', v_reward.partner_user_id, 'walletDebit', v_wallet_debit,
    'unrecoveredAmount', v_unrecovered, 'rewardTier', v_state.reward_tier,
    'qualificationCoins', v_state.qualification_coins,
    'lifetimeRewards', v_state.lifetime_rewards, 'totalSales', v_state.total_sales,
    'referredOrders', v_state.referred_orders, 'couponUsageCount', v_state.coupon_usage_count
  );
end;
$$;

revoke all on function public.business_programme_reward_reverse(text,text) from public, anon, authenticated;
grant execute on function public.business_programme_reward_reverse(text,text) to service_role;
