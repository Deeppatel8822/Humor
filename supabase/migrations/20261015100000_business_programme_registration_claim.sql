-- Atomically claim a Business Programme registration after payment validation.
-- This prevents two captured registration payments racing to overwrite the same user's application metadata.
-- The function is service-role-only and updates the canonical Supabase Auth user_metadata field in one DB transaction.

create or replace function public.business_programme_registration_claim(
  p_user_id uuid,
  p_programme jsonb
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_user auth.users%rowtype;
  v_existing jsonb;
  v_status text;
begin
  if p_user_id is null or p_programme is null or jsonb_typeof(p_programme) <> 'object' then
    raise exception 'A valid user and programme object are required';
  end if;

  select * into v_user
  from auth.users
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'USER_NOT_FOUND');
  end if;

  v_existing := coalesce(v_user.raw_user_meta_data->'business_programme', '{}'::jsonb);
  v_status := v_existing->>'status';

  if v_status in ('pending_verification', 'approved') then
    if v_existing->>'razorpayPaymentId' = p_programme->>'razorpayPaymentId'
       and v_existing->>'razorpayOrderId' = p_programme->>'razorpayOrderId' then
      return jsonb_build_object('success', true, 'duplicate', true, 'programme', v_existing);
    end if;

    return jsonb_build_object('success', false, 'conflict', true, 'error', 'APPLICATION_ALREADY_SUBMITTED');
  end if;

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
        || jsonb_build_object('business_programme', p_programme),
      updated_at = now()
  where id = p_user_id;

  return jsonb_build_object('success', true, 'duplicate', false, 'programme', p_programme);
end;
$$;

revoke all on function public.business_programme_registration_claim(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.business_programme_registration_claim(uuid, jsonb) to service_role;
