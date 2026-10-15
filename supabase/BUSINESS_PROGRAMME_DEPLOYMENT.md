# Business Programme deployment checklist

This checklist is for deploying the Humor Luxury Business Programme changes. It is not a substitute for the real end-to-end tests.

## 1. Before enabling ledger operations

In Supabase SQL Editor, inspect the migration history first. Do not re-run migrations already applied. Apply any missing migration files in this order:

1. `20261012000000_business_programme_wallet_ledger.sql`
2. `20261014000000_business_programme_withdrawal_decisions.sql`
3. `20261014010000_business_programme_withdrawal_reservations.sql`
4. `20261014020000_business_programme_withdrawal_approval_status.sql`
5. `20261014030000_business_programme_withdrawal_decision_atomic.sql`
6. `20261014040000_business_programme_withdrawal_amount_guard.sql`
7. `20261014050000_business_programme_atomic_rewards.sql`
8. `20261014060000_business_programme_reward_reversal.sql`
9. `20261014070000_business_programme_withdrawal_reservation_status.sql`
10. `20261014080000_business_programme_withdrawal_payout_record.sql`
11. `20261014090000_orders_razorpay_order_unique.sql`
12. `20261015100000_business_programme_registration_claim.sql`
13. `20261015110000_business_programme_registration_order_reservation.sql`

The order unique-index migration emits a warning and skips creating the index if duplicate Razorpay order IDs already exist. Review those duplicates before retrying that migration; do not delete paid-order records to force the index through.

## 2. Environment configuration

In the deployment provider's server-side environment settings, confirm these exist and are configured for the same production Supabase and Razorpay accounts:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side secret only, never expose to browser code)
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET` (server-side secret only)
- `BUSINESS_PROGRAMME_WALLET_LEDGER_ENABLED=true`
- `BUSINESS_PROGRAMME_ADMIN_EMAILS` with the authorised admin email addresses separated by commas
- `ADMIN_EMAIL` if the existing admin partner/refund routes use the HMAC admin cookie flow

After changing environment variables, redeploy the production project. Do not paste secret values into GitHub, source code, issue comments, or chat.

## 3. Read-only integrity diagnostics

Run these SQL files after their prerequisite migrations have been applied. Review returned rows before manually changing any production data:

- `diagnostics/razorpay_order_integrity.sql`
- `diagnostics/business_programme_registration_integrity.sql`
- `diagnostics/business_programme_registration_order_integrity.sql`
- `diagnostics/business_programme_reward_integrity.sql`
- `diagnostics/business_programme_tier_integrity.sql`
- `diagnostics/business_programme_withdrawal_integrity.sql`

Expected-zero-row queries are labelled in each file. Some rows are informational or require manual review; do not automatically delete or rewrite them.

## 4. Important operational boundaries

- The registration reservation RPC prevents multiple active ₹9 registration orders per user once its migration is applied. During a staged rollout, the API retains a legacy fallback if that specific RPC is not yet present; duplicate-order protection is not active during that fallback.
- The registration claim RPC is idempotent for the same payment/order and rejects a conflicting second application.
- A withdrawal approval is not a bank transfer. Only record `withdrawal_paid` after the external payout has actually settled and the payout reference is available.
- The refund-reversal route records an already-completed refund and partner reward reversal. It does not initiate a Razorpay refund.
- Never mark a payment, refund, or payout as completed based only on a screenshot or client-submitted status.

## 5. Real testing is a separate final stage

After migrations, environment configuration, and integrity review are complete, run the real registration/payment, approval, reward-tier, withdrawal, refund-reversal, dashboard, and checkout smoke tests before declaring the programme production-verified.
