-- Prevent concurrent Razorpay verification callbacks from creating duplicate paid orders.
-- If duplicates already exist, leave the index unapplied and report them for manual reconciliation.
-- Run the duplicate diagnostic before resolving any legacy duplicate rows.

do $$
begin
  if exists (
    select 1
    from public.orders
    where razorpay_order_id is not null
    group by razorpay_order_id
    having count(*) > 1
  ) then
    raise warning 'Unique Razorpay order index was not created: duplicate razorpay_order_id values exist. Run supabase/diagnostics/razorpay_order_integrity.sql and reconcile duplicates first.';
  else
    execute 'create unique index if not exists orders_razorpay_order_id_unique
      on public.orders (razorpay_order_id)
      where razorpay_order_id is not null';
  end if;
end;
$$;
