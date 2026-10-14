-- Read-only Business Programme registration integrity checks.
-- Run in Supabase SQL Editor after the programme's registration and wallet migrations.
-- These queries do not modify data. Investigate any returned rows before real testing.

-- 1) Duplicate Razorpay payment IDs attached to multiple programme accounts. Expected: zero rows.
select
  u.raw_user_meta_data->'business_programme'->>'razorpayPaymentId' as razorpay_payment_id,
  count(*) as account_count,
  array_agg(u.id order by u.created_at) as user_ids
from auth.users u
where coalesce(u.raw_user_meta_data->'business_programme'->>'razorpayPaymentId', '') <> ''
group by u.raw_user_meta_data->'business_programme'->>'razorpayPaymentId'
having count(*) > 1;

-- 2) Duplicate Razorpay order IDs attached to multiple programme accounts. Expected: zero rows.
select
  u.raw_user_meta_data->'business_programme'->>'razorpayOrderId' as razorpay_order_id,
  count(*) as account_count,
  array_agg(u.id order by u.created_at) as user_ids
from auth.users u
where coalesce(u.raw_user_meta_data->'business_programme'->>'razorpayOrderId', '') <> ''
group by u.raw_user_meta_data->'business_programme'->>'razorpayOrderId'
having count(*) > 1;

-- 3) Submitted or approved applications missing required payment/terms evidence. Expected: zero rows.
select
  u.id as user_id,
  u.email,
  bp->>'status' as application_status,
  bp->>'razorpayOrderId' as razorpay_order_id,
  bp->>'razorpayPaymentId' as razorpay_payment_id,
  bp->>'termsAccepted' as terms_accepted,
  bp->>'termsVersion' as terms_version,
  bp->>'registrationFeeInr' as registration_fee_inr
from auth.users u
cross join lateral (select u.raw_user_meta_data->'business_programme' as bp) app
where bp is not null
  and bp->>'status' in ('pending_verification', 'approved')
  and (
    coalesce(bp->>'razorpayOrderId', '') = ''
    or coalesce(bp->>'razorpayPaymentId', '') = ''
    or coalesce(bp->>'termsAccepted', 'false') <> 'true'
    or coalesce(bp->>'termsVersion', '') <> '2026-10-12-v1'
    or coalesce(bp->>'registrationFeeInr', '') <> '9'
  );

-- 4) Approved Business Programme applications without an approved partner code. Expected: zero rows.
select
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->'business_programme'->>'status' as application_status,
  u.raw_app_meta_data->'marketing_partner'->>'status' as partner_status,
  u.raw_app_meta_data->'marketing_partner'->>'code' as partner_code
from auth.users u
where u.raw_user_meta_data->'business_programme'->>'status' = 'approved'
  and (
    u.raw_app_meta_data->'marketing_partner'->>'status' is distinct from 'approved'
    or coalesce(u.raw_app_meta_data->'marketing_partner'->>'code', '') = ''
  );

-- 5) Pending applications whose business proof path is outside the account's own folder. Expected: zero rows.
select
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->'business_programme'->>'proofPath' as proof_path
from auth.users u
where u.raw_user_meta_data->'business_programme'->>'status' = 'pending_verification'
  and (
    coalesce(u.raw_user_meta_data->'business_programme'->>'proofPath', '') = ''
    or split_part(u.raw_user_meta_data->'business_programme'->>'proofPath', '/', 1) <> u.id::text
    or array_length(string_to_array(u.raw_user_meta_data->'business_programme'->>'proofPath', '/'), 1) <> 2
  );
