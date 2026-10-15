# Business Programme deployment and verification

This checklist documents the Humor Luxury Business Programme. Real payment and end-to-end tests are intentionally deferred.

## 1. Current production verification (15 October 2026)

- Supabase project `kxccwbahakfvdujrbard` reports `ACTIVE_HEALTHY`.
- Vercel's check for the current `main` commit reported `success`: https://vercel.com/nexus-2d75/humor/ACM2sTJbBak8XMPu1ZSe148dSthk
- Read-only integrity checks returned no rows for duplicate active registration reservations, stale/malformed registration records, duplicate Razorpay order IDs, missing reward state, reward ledger inconsistencies, withdrawal/ledger mismatches, and missing payout records for approved withdrawals.
- Registration reservation and claim RPCs are restricted to `service_role`; `anon` and `authenticated` cannot execute them.
- The wallet ledger and reward RPCs are also restricted to `service_role`. The trigger helper `business_programme_sync_withdrawal_reservation_status` is not directly executable by application roles.
- No real payment, refund, payout, or end-to-end test was run.

## 2. Important migration-history caveat

The live database already contained Business Programme wallet and withdrawal objects when its migration history was initially empty. The new safeguards were applied to the live database and recorded with generated versions such as `20261015085640` through `20261015085813`, rather than all matching the timestamped filenames in `supabase/migrations/`.

**Do not blindly replay the repository's timestamped migrations against production.** Several of those migrations create or replace functions, constraints, or indexes that already exist. Before using Supabase CLI migration commands or deploying from a clean database, reconcile the source migration history with the verified live schema. Use the supported Supabase migration-repair workflow only after reviewing each source migration against the live objects. Do not edit `supabase_migrations.schema_migrations` manually or delete live records to make the histories appear aligned.

Source migrations in the repo include:

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
14. `20261015120000_business_programme_withdrawal_decided_by_index.sql`

The order unique-index migration may skip creating its index if duplicate Razorpay order IDs exist. Review duplicates before retrying; never delete paid-order records to force the index through.

## 3. Deployment environment checklist

These settings must be checked in the production deployment provider. The current connector access does not expose Vercel environment-variable values, so their presence and correctness are **not verified** here.

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only, never expose to browser code)
- `BUSINESS_PROGRAMME_WALLET_LEDGER_ENABLED=true`
- `BUSINESS_PROGRAMME_ADMIN_EMAILS` with authorised admin emails separated by commas
- `ADMIN_EMAIL` if existing admin partner/refund routes use the HMAC admin cookie flow
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are required by the payment integration, which is outside this non-payment completion pass

After changing environment variables, redeploy production. Never paste secret values into GitHub, source code, issue comments, or chat.

## 4. Security advisor follow-up

Supabase's security advisor reports that leaked-password protection is disabled. The user confirmed that the setting is available only on the Supabase Pro plan. **This is a known Free-plan limitation and is not an available configuration change on the current plan.** Do not keep searching for a missing toggle or treat it as completed. Revisit this control if the project plan changes.

The advisor also reports tables with RLS enabled but no policies. The Business Programme ledger tables are intentionally server-only and have no grants to `anon` or `authenticated`; do not add broad policies merely to silence the advisor. Other tables in the advisor output should be reviewed against their actual access pattern before changing policies.

Performance advisors report unindexed foreign keys and unused indexes. The Business Programme `decided_by` foreign key now has the additive index `business_programme_withdrawal_decisions_decided_by_idx` (migration recorded as `20261015091658`). Other findings include unrelated application tables; do not drop indexes solely because they are currently unused. Review query patterns before changing them.

## 5. Read-only integrity diagnostics

SQL diagnostics live in `supabase/diagnostics/`:

- `razorpay_order_integrity.sql`
- `business_programme_registration_integrity.sql`
- `business_programme_registration_order_integrity.sql`
- `business_programme_reward_integrity.sql`
- `business_programme_tier_integrity.sql`
- `business_programme_withdrawal_integrity.sql`
- `business_programme_migration_history_audit.sql` (read-only inventory of key live objects; does not repair or modify migration history)

Review returned rows before manually changing production data. Some results are informational rather than automatic errors.

## 6. Operational boundaries

- Registration fee is ₹9; terms version is `2026-10-12-v1`.
- Rewards use the agreed 25% / 27% / 30% tiers, a 30-day qualification period, and permanent tier upgrades.
- Minimum withdrawal request is ₹1,000.
- A withdrawal approval is not a bank transfer. Record `withdrawal_paid` only after the external payout settles and a payout reference is available.
- The admin refund route records an already-completed refund and reward reversal. It does not initiate a Razorpay refund.
- Never mark a payment, refund, or payout complete based only on a screenshot or client-submitted status.

## 7. Deferred final stage

Real payment and end-to-end tests remain intentionally deferred. Before calling the programme production-verified, run the registration, admin approval, reward-tier, withdrawal, refund-reversal, dashboard, and checkout smoke tests in the intended test/production-safe environment.
