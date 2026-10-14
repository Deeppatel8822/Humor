-- Read-only withdrawal/wallet consistency checks.
-- Run after all Business Programme withdrawal migrations have been applied.
-- These queries do not modify data. Empty issue-query results are expected.

-- 1) Pending withdrawal reservations that already have a decision. Expected: zero rows.
select
  r.partner_user_id,
  r.reference_id,
  r.amount_inr as reserved_amount,
  r.created_at as requested_at,
  d.decision,
  d.decided_at
from public.business_programme_wallet_transactions r
join public.business_programme_withdrawal_decisions d
  on d.partner_user_id = r.partner_user_id
 and d.reference_id = r.reference_id
where r.transaction_type = 'withdrawal_request'
  and r.status = 'pending';

-- 2) Decisions missing their corresponding wallet transaction. Expected: zero rows.
select
  d.partner_user_id,
  d.reference_id,
  d.decision,
  d.decided_at
from public.business_programme_withdrawal_decisions d
left join public.business_programme_wallet_transactions t
  on t.partner_user_id = d.partner_user_id
 and t.reference_id = d.reference_id
 and t.transaction_type = case
   when d.decision = 'approve' then 'withdrawal_approved'
   when d.decision = 'reject' then 'withdrawal_rejected'
   else '__invalid__'
 end
where t.id is null;

-- 3) Reservation amount differs from decision transaction amount. Expected: zero rows.
select
  r.partner_user_id,
  r.reference_id,
  r.amount_inr as requested_amount,
  t.amount_inr as decision_amount,
  t.transaction_type as decision_transaction
from public.business_programme_wallet_transactions r
join public.business_programme_wallet_transactions t
  on t.partner_user_id = r.partner_user_id
 and t.reference_id = r.reference_id
 and t.transaction_type in ('withdrawal_approved', 'withdrawal_rejected')
where r.transaction_type = 'withdrawal_request'
  and abs(r.amount_inr - t.amount_inr) > 0.01;

-- 4) Wallet account balance differs from the most recent ledger snapshot. Expected: zero rows.
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

-- 5) Approved withdrawals without a recorded payout transaction.
-- Informational only: approval does not mean the external bank transfer was sent.
select
  d.partner_user_id,
  d.reference_id,
  t.amount_inr as approved_amount,
  t.created_at as approved_at
from public.business_programme_withdrawal_decisions d
join public.business_programme_wallet_transactions t
  on t.partner_user_id = d.partner_user_id
 and t.reference_id = d.reference_id
 and t.transaction_type = 'withdrawal_approved'
left join public.business_programme_wallet_transactions paid
  on paid.partner_user_id = d.partner_user_id
 and paid.reference_id = d.reference_id
 and paid.transaction_type = 'withdrawal_paid'
where d.decision = 'approve'
  and paid.id is null
order by t.created_at;
