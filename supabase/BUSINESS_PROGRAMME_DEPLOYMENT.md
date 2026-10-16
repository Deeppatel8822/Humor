# Business Programme deployment and verification

This checklist documents the Humor Luxury Business Programme. Real payment and end-to-end tests are intentionally deferred.

## 1. Current production verification (16 October 2026)

- Supabase project `kxccwbahakfvdujrbard` reports `ACTIVE_HEALTHY`.
- Vercel's check for commit `7500483d7355cd4581f9e2ec9584fd0793eb8de6` reported `success` on 15 October 2026: https://vercel.com/nexus-2d75/humor/5sNGo5eecXuYVG19PSHo8DPkLgyr
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
15. `20261016071056_admin_otp_rate_limit.sql`

The order unique-index migration may skip creating its index if duplicate Razorpay order IDs exist. Review duplicates before retrying; never delete paid-order records to force the index through.

## 3. Deployment environment checklist

The current connector access does not expose Vercel environment-variable values. The following names are derived from the current application source, but their presence and correctness in Vercel are **not verified** until checked in Vercel Dashboard → Humor → Settings → Environment Variables.

Required for Supabase-backed application routes:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public/anon key; safe for browser use with RLS)
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only; never expose to browser code)
- `BUSINESS_PROGRAMME_WALLET_LEDGER_ENABLED=true`
- `BUSINESS_PROGRAMME_ADMIN_EMAILS` with authorised admin emails separated by commas (admin withdrawal review)

Admin login / OTP:
- `ADMIN_EMAIL` (registered admin email and OTP destination)
- `ADMIN_MOBILE` if admin login by mobile number is intended
- `RESEND_API_KEY` (required to send email OTP)
- `RESEND_FROM_EMAIL` (optional; source has a fallback sender, but use a verified sender for production)
- `ADMIN_OTP_SECRET` (optional; source falls back to `SUPABASE_SERVICE_ROLE_KEY` when absent)

Admin OTP now uses a persistent database-backed rate limiter: maximum 3 OTP requests per 15 minutes and 5 verification attempts per 10 minutes per hashed IP + admin identifier. It fails closed with HTTP 503 if the shared limiter cannot be reached. This requires the Supabase URL and `SUPABASE_SERVICE_ROLE_KEY` to be present in Vercel Production.

Payment integration is intentionally outside this non-payment completion pass:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

After changing any Vercel environment variable, redeploy production. Never paste secret values into GitHub, source code, issue comments, or chat. Check only that names exist and the intended environment is selected; keep secret values private.

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
