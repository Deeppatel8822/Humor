-- Read-only Business Programme reward integrity checks.
-- Run in Supabase SQL Editor AFTER applying 20261014050000_business_programme_atomic_rewards.sql.
-- These queries do not modify data. Legacy rewards may predate the ledger, so checks compare for under-counts rather than requiring exact equality.

-- 1) Reward-state totals versus the canonical reward ledger.
with ledger as (
  select
    partner_user_id,
    count(*) filter (where transaction_type = 'reward') as reward_transactions,
    coalesce(sum(case
      when transaction_type = 'reward' then amount_inr
      when transaction_type = 'reward_reversal' then -amount_inr
      else 0 end), 0)::numeric(12,2) as ledger_lifetime_rewards,
    coalesce(sum(case
      when transaction_type = 'reward' and coalesce(metadata->>'billedAmountInr','') ~ '^[0-9]+(\\.[0-9]+)?$'
        then (metadata->>'billedAmountInr')::numeric
      when transaction_type = 'reward_reversal' and coalesce(metadata->>'billedAmountInr','') ~ '^[0-9]+(\\.[0-9]+)?$'
        then -(metadata->>'billedAmountInr')::numeric
      else 0 end), 0)::numeric(12,2) as ledger_total_sales
  from public.business_programme_wallet_transactions
  where transaction_type in ('reward', 'reward_reversal')
  group by partner_user_id
)
select
  s.partner_user_id,
  s.reward_tier,
  s.lifetime_rewards as state_lifetime_rewards,
  coalesce(l.ledger_lifetime_rewards, 0) as ledger_lifetime_rewards,
  s.total_sales as state_total_sales,
  coalesce(l.ledger_total_sales, 0) as ledger_total_sales,
  coalesce(l.reward_transactions, 0) as reward_transactions
from public.business_programme_partner_reward_state s
left join ledger l using (partner_user_id)
where s.lifetime_rewards + 0.01 < coalesce(l.ledger_lifetime_rewards, 0)
   or s.total_sales + 0.01 < coalesce(l.ledger_total_sales, 0)
order by s.updated_at desc;

-- 2) Duplicate reward references. Expected: zero rows.
select partner_user_id, reference_id, count(*) as duplicate_count
from public.business_programme_wallet_transactions
where transaction_type = 'reward'
group by partner_user_id, reference_id
having count(*) > 1;

-- 3) Wallet account balance versus latest transaction snapshot. Expected: zero rows.
with latest as (
  select distinct on (partner_user_id)
    partner_user_id, balance_after_inr, created_at, id
  from public.business_programme_wallet_transactions
  order by partner_user_id, created_at desc, id desc
)
select
  a.partner_user_id,
  a.balance_inr as account_balance,
  l.balance_after_inr as latest_ledger_balance,
  l.created_at as latest_transaction_at
from public.business_programme_wallet_accounts a
join latest l using (partner_user_id)
where abs(a.balance_inr - l.balance_after_inr) > 0.01;

-- 4) Qualification coins versus reward rows in the active 30-day window.
-- Expected: zero rows. A row may need investigation if older rewards predate the ledger.
with active_rewards as (
  select
    s.partner_user_id,
    coalesce(sum(t.amount_inr - coalesce((
      select sum(r.amount_inr)
      from public.business_programme_wallet_transactions r
      where r.partner_user_id = t.partner_user_id
        and r.transaction_type = 'reward_reversal'
        and r.metadata->>'originalRewardTransactionId' = t.id::text
    ), 0)), 0)::numeric(12,2) as ledger_window_coins
  from public.business_programme_partner_reward_state s
  left join public.business_programme_wallet_transactions t
    on t.partner_user_id = s.partner_user_id
   and t.transaction_type = 'reward'
   and s.qualification_period_started_at is not null
   and s.qualification_period_started_at <= now()
   and t.created_at >= s.qualification_period_started_at
   and t.created_at < s.qualification_period_started_at + interval '30 days'
  group by s.partner_user_id
)
select
  s.partner_user_id,
  s.qualification_coins as state_qualification_coins,
  a.ledger_window_coins,
  s.qualification_period_started_at
from public.business_programme_partner_reward_state s
join active_rewards a using (partner_user_id)
where s.qualification_period_started_at is not null
  and s.qualification_period_started_at <= now()
  and now() - s.qualification_period_started_at < interval '30 days'
  and s.qualification_coins + 0.01 < a.ledger_window_coins;

-- 5) Missing canonical reward state for users with partner metadata. Expected: zero rows.
select u.id as partner_user_id, u.raw_app_meta_data->'marketing_partner'->>'rewardTier' as metadata_tier
from auth.users u
left join public.business_programme_partner_reward_state s on s.partner_user_id = u.id
where u.raw_app_meta_data ? 'marketing_partner'
  and s.partner_user_id is null;

-- 6) Reward reversals without their original reward transaction. Expected: zero rows.
select r.partner_user_id, r.reference_id, r.metadata->>'orderNumber' as order_number
from public.business_programme_wallet_transactions r
left join public.business_programme_wallet_transactions original
  on original.id::text = r.metadata->>'originalRewardTransactionId'
 and original.partner_user_id = r.partner_user_id
 and original.transaction_type = 'reward'
where r.transaction_type = 'reward_reversal'
  and original.id is null;

-- 7) More than one full reward reversal for an order. Expected: zero rows.
select partner_user_id, metadata->>'orderNumber' as order_number, count(*) as reversal_count
from public.business_programme_wallet_transactions
where transaction_type = 'reward_reversal'
group by partner_user_id, metadata->>'orderNumber'
having count(*) > 1;
