-- Read-only Business Programme tier-state review.
-- Reward tiers are permanent; qualification coins are only the current rolling 30-day
-- window. Therefore current coins must NOT be used to infer or downgrade a permanent tier.
-- Run after applying the atomic reward migration. No data is modified.

-- 1) Invalid or negative canonical reward state. Expected: zero rows.
select
  partner_user_id,
  reward_tier,
  qualification_coins,
  lifetime_rewards,
  total_sales,
  referred_orders,
  coupon_usage_count
from public.business_programme_partner_reward_state
where reward_tier not in ('basic', 'silver', 'gold')
   or qualification_coins < 0
   or lifetime_rewards < 0
   or total_sales < 0
   or referred_orders < 0
   or coupon_usage_count < 0;

-- 2) Missing canonical reward state for approved/pending partner metadata. Expected: zero rows.
select
  u.id as partner_user_id,
  u.raw_app_meta_data->'marketing_partner'->>'status' as partner_status,
  u.raw_app_meta_data->'marketing_partner'->>'rewardTier' as metadata_tier
from auth.users u
left join public.business_programme_partner_reward_state s on s.partner_user_id = u.id
where u.raw_app_meta_data ? 'marketing_partner'
  and s.partner_user_id is null;

-- 3) Permanent tier and current qualification window, for review only.
-- This query intentionally reports state rather than flagging low coins for Silver/Gold.
select
  partner_user_id,
  reward_tier,
  qualification_coins,
  qualification_period_started_at,
  case
    when qualification_period_started_at is null then 'window not started'
    when qualification_period_started_at > now() then 'future start needs review'
    when now() - qualification_period_started_at >= interval '30 days' then 'window expired; next qualifying order resets coins'
    else 'active window'
  end as qualification_window_status
from public.business_programme_partner_reward_state
order by updated_at desc;
