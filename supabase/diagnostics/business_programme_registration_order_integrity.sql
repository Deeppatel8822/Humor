-- Read-only integrity checks for Business Programme registration-order reservations.
-- Run only AFTER applying 20261015110000_business_programme_registration_order_reservation.sql.
-- Review all returned rows; these queries do not modify data.

-- 1. Multiple active registration reservations for the same user. Expected: zero rows.
select
  user_id,
  count(*) as active_reservation_count,
  array_agg(status order by created_at) as statuses,
  array_agg(razorpay_order_id order by created_at) as razorpay_order_ids
from public.business_programme_registration_orders
where status in ('creating', 'created')
group by user_id
having count(*) > 1
order by active_reservation_count desc;

-- 2. Created reservations missing a provider order ID. Expected: zero rows.
select id, user_id, status, created_at, updated_at
from public.business_programme_registration_orders
where status = 'created'
  and coalesce(razorpay_order_id, '') = ''
order by created_at desc;

-- 3. Stale empty reservations. Informational; the reserve RPC can reclaim these after five minutes.
select id, user_id, status, created_at, updated_at
from public.business_programme_registration_orders
where status = 'creating'
  and razorpay_order_id is null
  and updated_at < now() - interval '5 minutes'
order by updated_at asc;

-- 4. Submitted reservation without a pending or approved application. Review legacy orders and interrupted flows.
select
  r.id,
  r.user_id,
  r.razorpay_order_id,
  r.status as reservation_status,
  u.raw_user_meta_data->'business_programme'->>'status' as application_status,
  u.raw_user_meta_data->'business_programme'->>'razorpayPaymentId' as application_payment_id,
  r.updated_at
from public.business_programme_registration_orders r
join auth.users u on u.id = r.user_id
where r.status = 'submitted'
  and coalesce(u.raw_user_meta_data->'business_programme'->>'status', '') not in ('pending_verification', 'approved')
order by r.updated_at desc;

-- 5. Application/order reference mismatch. Expected: zero rows for new registrations.
select
  u.id as user_id,
  u.raw_user_meta_data->'business_programme'->>'status' as application_status,
  u.raw_user_meta_data->'business_programme'->>'razorpayOrderId' as application_order_id,
  r.razorpay_order_id as reservation_order_id,
  r.status as reservation_status
from auth.users u
join public.business_programme_registration_orders r
  on r.user_id = u.id
 and r.razorpay_order_id = u.raw_user_meta_data->'business_programme'->>'razorpayOrderId'
where u.raw_user_meta_data->'business_programme'->>'status' in ('pending_verification', 'approved')
  and r.status not in ('submitted');
