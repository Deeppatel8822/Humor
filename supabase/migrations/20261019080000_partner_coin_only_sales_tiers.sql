create or replace function public.business_programme_reward_credit(
  p_partner_user_id uuid,
  p_order_number text,
  p_billed_amount_inr numeric
) returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  v_state public.business_programme_partner_reward_state%rowtype;
  v_tx public.business_programme_wallet_transactions%rowtype;
  v_balance numeric(12,2);
  v_now timestamptz := now();
  v_period_start timestamptz;
  v_period_sales numeric(12,2);
  v_rate numeric(5,4);
  v_reward numeric(12,2);
  v_tier_before text;
  v_tier_after text;
begin
  if p_partner_user_id is null or p_order_number is null or length(trim(p_order_number)) = 0 then
    raise exception 'Partner and order reference are required';
  end if;
  if p_billed_amount_inr is null or p_billed_amount_inr <= 0 then
    raise exception 'Billed amount must be positive';
  end if;

  insert into public.business_programme_wallet_accounts(partner_user_id, balance_inr)
  values (p_partner_user_id, 0)
  on conflict (partner_user_id) do nothing;
  select balance_inr into v_balance from public.business_programme_wallet_accounts
  where partner_user_id = p_partner_user_id for update;

  insert into public.business_programme_partner_reward_state (
    partner_user_id, reward_tier, qualification_coins, qualification_period_started_at,
    lifetime_rewards, total_sales, referred_orders, coupon_usage_count
  )
  select u.id,
    case when u.raw_app_meta_data->'marketing_partner'->>'rewardTier' in ('basic','silver','gold')
      then u.raw_app_meta_data->'marketing_partner'->>'rewardTier' else 'basic' end,
    0, now(),
    case when coalesce(u.raw_app_meta_data->'marketing_partner'->>'totalRewards','') ~ '^[0-9]+(\.[0-9]+)?$'
      then greatest(0, (u.raw_app_meta_data->'marketing_partner'->>'totalRewards')::numeric) else 0 end,
    case when coalesce(u.raw_app_meta_data->'marketing_partner'->>'totalSales','') ~ '^[0-9]+(\.[0-9]+)?$'
      then greatest(0, (u.raw_app_meta_data->'marketing_partner'->>'totalSales')::numeric) else 0 end,
    case when coalesce(u.raw_app_meta_data->'marketing_partner'->>'referredCustomers','') ~ '^[0-9]+$'
      then greatest(0, (u.raw_app_meta_data->'marketing_partner'->>'referredCustomers')::bigint) else 0 end,
    case when coalesce(u.raw_app_meta_data->'marketing_partner'->>'usageCount','') ~ '^[0-9]+$'
      then greatest(0, (u.raw_app_meta_data->'marketing_partner'->>'usageCount')::bigint) else 0 end
  from auth.users u where u.id = p_partner_user_id and u.raw_app_meta_data ? 'marketing_partner'
  on conflict (partner_user_id) do nothing;

  select * into v_state from public.business_programme_partner_reward_state
  where partner_user_id = p_partner_user_id for update;
  if not found then raise exception 'Partner reward state could not be initialized'; end if;

  select * into v_tx from public.business_programme_wallet_transactions
  where partner_user_id = p_partner_user_id and transaction_type = 'reward'
    and reference_id = 'order:' || p_order_number;
  if found then
    if coalesce((v_tx.metadata->>'billedAmountInr')::numeric, p_billed_amount_inr) <> p_billed_amount_inr then
      return jsonb_build_object('success', false, 'duplicate', true, 'error', 'ORDER_AMOUNT_MISMATCH');
    end if;
    return jsonb_build_object(
      'success', true, 'duplicate', true, 'reward', v_tx.amount_inr,
      'rewardRate', coalesce((v_tx.metadata->>'rewardRate')::numeric, 0.25),
      'rewardTier', coalesce(v_tx.metadata->>'rewardTier', v_state.reward_tier),
      'balance', v_balance, 'rewardTierAfter', v_state.reward_tier,
      'qualificationCoins', v_state.qualification_coins,
      'qualificationPeriodStartedAt', v_state.qualification_period_started_at,
      'totalRewards', v_state.lifetime_rewards, 'totalSales', v_state.total_sales,
      'referredCustomers', v_state.referred_orders, 'usageCount', v_state.coupon_usage_count
    );
  end if;

  v_period_start := v_state.qualification_period_started_at;
  if v_period_start is null or v_period_start > v_now or v_now - v_period_start >= interval '30 days' then
    v_period_start := v_now;
    v_period_sales := 0;
  else
    v_period_sales := greatest(0, v_state.qualification_coins);
  end if;

  v_tier_before := v_state.reward_tier;
  v_rate := case v_tier_before when 'gold' then 0.30 when 'silver' then 0.27 else 0.25 end;
  v_reward := round(p_billed_amount_inr * v_rate, 0);
  if v_reward <= 0 then return jsonb_build_object('success', false, 'error', 'REWARD_ROUNDS_TO_ZERO'); end if;

  v_tier_after := v_tier_before;
  if v_tier_after in ('basic','silver') and v_period_sales + p_billed_amount_inr >= 3000 then v_tier_after := 'silver'; end if;
  if v_period_sales + p_billed_amount_inr >= 5000 then v_tier_after := 'gold'; end if;

  v_balance := v_balance + v_reward;
  update public.business_programme_wallet_accounts set balance_inr = v_balance, updated_at = v_now
  where partner_user_id = p_partner_user_id;

  insert into public.business_programme_wallet_transactions(
    partner_user_id, transaction_type, amount_inr, balance_after_inr,
    reference_id, status, description, metadata
  ) values (
    p_partner_user_id, 'reward', v_reward, v_balance, 'order:' || p_order_number, 'completed',
    'Partner reward coins for order ' || p_order_number,
    jsonb_build_object('orderNumber', p_order_number, 'rewardRate', v_rate,
      'rewardTier', v_tier_before, 'billedAmountInr', p_billed_amount_inr, 'rewardType', 'coins_only')
  ) returning * into v_tx;

  update public.business_programme_partner_reward_state
  set reward_tier = v_tier_after,
      qualification_coins = v_period_sales + p_billed_amount_inr,
      qualification_period_started_at = v_period_start,
      lifetime_rewards = lifetime_rewards + v_reward,
      total_sales = total_sales + p_billed_amount_inr,
      referred_orders = referred_orders + 1,
      coupon_usage_count = coupon_usage_count + 1,
      updated_at = v_now
  where partner_user_id = p_partner_user_id returning * into v_state;

  return jsonb_build_object(
    'success', true, 'duplicate', false, 'reward', v_reward,
    'rewardRate', v_rate, 'rewardTier', v_tier_before, 'rewardTierAfter', v_state.reward_tier,
    'balance', v_balance, 'qualificationCoins', v_state.qualification_coins,
    'qualificationPeriodStartedAt', v_state.qualification_period_started_at,
    'totalRewards', v_state.lifetime_rewards, 'totalSales', v_state.total_sales,
    'referredCustomers', v_state.referred_orders, 'usageCount', v_state.coupon_usage_count
  );
end;
$function$;

-- qualification_coins now stores eligible sales amount (INR) for the current 30-day window.
-- Reset old counters so previously accumulated coin rewards are not treated as sales.
update public.business_programme_partner_reward_state
set qualification_coins = 0, qualification_period_started_at = now(), updated_at = now();
