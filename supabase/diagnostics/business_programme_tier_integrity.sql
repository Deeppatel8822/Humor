-- Read-only Business Programme tier-state review.
-- Run in Supabase SQL Editor after applying the atomic reward migration.
-- This does not modify data. Review any returned rows manually.

-- 1) Active qualification windows whose coin total appears inconsistent with the stored tier.
-- Basic should normally be below 3000; Silver should be at least 3000 and below 5000;
-- Gold should be at least 5000. Expired/future windows are excluded.
select
  partner_user_id,
  reward_tier,
  qualification_coins,
  qualification_period_started_at,
  now() - qualification_period_started_at as window_age
from public.business_programme_partner_reward_state
where qualification_period_started_at is not null
  and qualification_period_started_at <= now()
  and now() - qualification_period_started_at < interval '30 days'
  and (
    (reward_tier = 'basic' and qualification_coins >= 3000)
    or (reward_tier = 'silver' and (qualification_coins < 3000 or qualification_coins >= 5000))
    or (reward_tier = 'gold' and qualification_coins < 5000)
  )
order by qualification_coins desc;

-- 2) Negative or invalid reward state should never exist (expected: zero rows).
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

-- 3) Duplicate reward reference IDs (expected: zero rows).
select partner_user_id, reference_id, count(*) as duplicate_count
from public.business_programme_wallet_transactions
where transaction_type = 'reward'
group by partner_user_id, reference_id
having count(*) > 1;
