-- Read-only checks for duplicate or incomplete Razorpay order persistence.
-- Run in Supabase SQL Editor. Review rows before making any manual corrections.

-- 1. Duplicate Razorpay order IDs: these prevent the unique index from being created.
select
  razorpay_order_id,
  count(*) as order_count,
  array_agg(order_number order by created_at) as order_numbers,
  array_agg(id::text order by created_at) as order_ids,
  array_agg(payment_status order by created_at) as payment_statuses
from public.orders
where razorpay_order_id is not null
group by razorpay_order_id
having count(*) > 1
order by order_count desc, razorpay_order_id;

-- 2. Paid Razorpay orders that have no order items.
select
  o.id,
  o.order_number,
  o.razorpay_order_id,
  o.razorpay_payment_id,
  o.payment_status,
  o.created_at
from public.orders o
where o.razorpay_order_id is not null
  and o.payment_status = 'paid'
  and not exists (
    select 1 from public.order_items oi where oi.order_id = o.id
  )
order by o.created_at desc;

-- 3. Razorpay order IDs linked to multiple payment IDs.
select
  razorpay_order_id,
  count(distinct razorpay_payment_id) as payment_id_count,
  array_agg(distinct razorpay_payment_id) as payment_ids,
  array_agg(order_number order by order_number) as order_numbers
from public.orders
where razorpay_order_id is not null
group by razorpay_order_id
having count(distinct razorpay_payment_id) > 1
order by razorpay_order_id;
