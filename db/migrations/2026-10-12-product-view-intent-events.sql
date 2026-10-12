-- Extend the existing cart event type constraint to include product views.
alter table public.cart_activity_events drop constraint if exists cart_activity_events_event_type_check;
alter table public.cart_activity_events add constraint cart_activity_events_event_type_check
check (event_type in ('product_view','add_to_cart','remove_from_cart','quantity_updated','checkout_started','purchase_completed','cart_cleared'));
