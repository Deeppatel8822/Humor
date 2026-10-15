-- Read-only Business Programme migration-history audit.
-- Run in Supabase SQL Editor. This file does not repair history or modify schema/data.
-- Compare the live migration ledger with repository migrations before using Supabase CLI.
with expected_objects(object_kind, object_name) as (
  values
    ('table', 'business_programme_registration_orders'),
    ('table', 'business_programme_wallet_accounts'),
    ('table', 'business_programme_wallet_transactions'),
    ('table', 'business_programme_partner_reward_state'),
    ('table', 'business_programme_withdrawal_decisions'),
    ('function', 'business_programme_registration_claim'),
    ('function', 'business_programme_registration_order_reserve'),
    ('function', 'business_programme_registration_order_attach'),
    ('function', 'business_programme_registration_order_release'),
    ('function', 'business_programme_wallet_post'),
    ('function', 'business_programme_reward_credit'),
    ('function', 'business_programme_reward_reverse'),
    ('function', 'business_programme_withdrawal_reserve'),
    ('function', 'business_programme_withdrawal_decide'),
    ('function', 'business_programme_withdrawal_decide_and_post'),
    ('function', 'business_programme_withdrawal_mark_paid'),
    ('index', 'business_programme_withdrawal_decisions_decided_by_idx')
),
object_status as (
  select
    e.object_kind,
    e.object_name,
    case e.object_kind
      when 'table' then to_regclass('public.' || e.object_name) is not null
      when 'function' then exists (
        select 1 from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = e.object_name
      )
      when 'index' then exists (
        select 1 from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'i' and c.relname = e.object_name
      )
      else false
    end as exists_live
  from expected_objects e
)
select object_kind, object_name, exists_live
from object_status
order by object_kind, object_name;

-- Separate history query, run independently if the SQL editor only shows one result set:
-- select version, name from supabase_migrations.schema_migrations order by version;
