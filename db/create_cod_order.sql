-- Run this ONCE in Supabase SQL Editor.
-- It makes COD order creation atomic: if anything fails, the order/customer/address
-- changes and stock update are rolled back together. This prevents failed checkouts
-- from consuming stock.

create or replace function public.create_cod_order(
  p_lines jsonb,
  p_shipping jsonb
)
returns table(order_number text, total_inr integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_address_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_subtotal integer := 0;
  v_shipping integer := 0;
  v_total integer := 0;
  v_line jsonb;
  v_product record;
  v_catalog_id integer;
  v_quantity integer;
begin
  if jsonb_array_length(coalesce(p_lines, '[]'::jsonb)) = 0 then
    raise exception 'Order is empty';
  end if;

  if coalesce(trim(p_shipping->>'fullName'), '') = ''
     or coalesce(trim(p_shipping->>'email'), '') = ''
     or coalesce(trim(p_shipping->>'phone'), '') = ''
     or coalesce(trim(p_shipping->>'line1'), '') = ''
     or coalesce(trim(p_shipping->>'city'), '') = ''
     or coalesce(trim(p_shipping->>'state'), '') = ''
     or (p_shipping->>'pincode') !~ '^\d{6}$' then
    raise exception 'Invalid shipping details';
  end if;

  -- Lock all requested products first and validate stock from the database.
  -- catalog_id is the stable ID used by the current frontend cart.
  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_catalog_id := (v_line->>'productId')::integer;
    v_quantity := (v_line->>'quantity')::integer;

    if v_catalog_id is null or v_catalog_id < 1 or v_quantity is null or v_quantity < 1 then
      raise exception 'Invalid product or quantity';
    end if;

    select id, name, price_inr, stock_quantity, status
      into v_product
      from public.products
     where catalog_id = v_catalog_id
     for update;

    if not found or v_product.status <> 'live' then
      raise exception 'Product % is unavailable', v_catalog_id;
    end if;

    if v_product.stock_quantity < v_quantity then
      raise exception '% does not have enough stock', v_product.name;
    end if;

    v_subtotal := v_subtotal + (v_product.price_inr * v_quantity);
  end loop;

  v_total := v_subtotal + v_shipping;

  insert into public.customers (email, phone, full_name)
  values (
    lower(trim(p_shipping->>'email')),
    trim(p_shipping->>'phone'),
    trim(p_shipping->>'fullName')
  )
  on conflict (email) do update set
    phone = excluded.phone,
    full_name = excluded.full_name
  returning id into v_customer_id;

  insert into public.addresses (
    customer_id, line1, line2, city, state, pincode, country, phone
  )
  values (
    v_customer_id,
    trim(p_shipping->>'line1'),
    nullif(trim(coalesce(p_shipping->>'line2', '')), ''),
    trim(p_shipping->>'city'),
    trim(p_shipping->>'state'),
    trim(p_shipping->>'pincode'),
    'India',
    trim(p_shipping->>'phone')
  )
  returning id into v_address_id;

  v_order_number := 'HL-' || to_char(clock_timestamp(), 'YYMMDDHH24MISSMS') || floor(random() * 10)::text;

  insert into public.orders (
    order_number, customer_id, status, subtotal_inr, discount_inr,
    shipping_inr, total_inr, shipping_address_id, payment_status
  )
  values (
    v_order_number, v_customer_id, 'pending', v_subtotal, 0,
    v_shipping, v_total, v_address_id, 'unpaid'
  )
  returning id into v_order_id;

  -- Insert order items and deduct stock inside the same transaction.
  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    v_catalog_id := (v_line->>'productId')::integer;
    v_quantity := (v_line->>'quantity')::integer;

    select id, name, price_inr, stock_quantity
      into v_product
      from public.products
     where catalog_id = v_catalog_id
     for update;

    insert into public.order_items (order_id, product_id, quantity, unit_price_inr)
    values (v_order_id, v_product.id, v_quantity, v_product.price_inr);

    update public.products
       set stock_quantity = stock_quantity - v_quantity,
           updated_at = now()
     where id = v_product.id;
  end loop;

  return query select v_order_number, v_total;
end;
$$;

revoke all on function public.create_cod_order(jsonb, jsonb) from public;
grant execute on function public.create_cod_order(jsonb, jsonb) to service_role;
