-- Business Programme wallet ledger.
-- Apply this migration in the Supabase SQL Editor before wiring ledger writes into the APIs.
create table if not exists public.business_programme_wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  partner_user_id uuid not null references auth.users(id) on delete restrict,
  transaction_type text not null check (transaction_type in (
    'reward', 'withdrawal_request', 'withdrawal_rejected', 'withdrawal_paid',
    'wallet_spend', 'wallet_refund', 'manual_adjustment'
  )),
  amount_inr numeric(12,2) not null check (amount_inr >= 0),
  balance_after_inr numeric(12,2),
  reference_id text,
  status text not null default 'completed' check (status in (
    'pending', 'completed', 'rejected', 'reversed'
  )),
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists business_programme_wallet_transactions_partner_created_idx
  on public.business_programme_wallet_transactions (partner_user_id, created_at desc);

create index if not exists business_programme_wallet_transactions_reference_idx
  on public.business_programme_wallet_transactions (reference_id)
  where reference_id is not null;

-- One reward per partner/order. This makes retries idempotent once application
-- code writes rewards to the ledger.
create unique index if not exists business_programme_wallet_transactions_reward_once_idx
  on public.business_programme_wallet_transactions (partner_user_id, reference_id)
  where transaction_type = 'reward' and reference_id is not null;

alter table public.business_programme_wallet_transactions enable row level security;

-- No client-side policies are intentionally created. Server routes using the
-- Supabase service-role key must perform writes after authenticating the user.
