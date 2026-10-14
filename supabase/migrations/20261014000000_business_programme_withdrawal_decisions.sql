-- Serialize admin decisions for each Business Programme withdrawal.
-- Apply this migration in Supabase before deploying code that calls the RPC.

create table if not exists public.business_programme_withdrawal_decisions (
  partner_user_id uuid not null references auth.users(id) on delete restrict,
  reference_id text not null,
  decision text not null check (decision in ('approve', 'reject')),
  decided_at timestamptz not null default now(),
  decided_by uuid references auth.users(id) on delete set null,
  primary key (partner_user_id, reference_id)
);

alter table public.business_programme_withdrawal_decisions enable row level security;
revoke all on public.business_programme_withdrawal_decisions from anon, authenticated;
grant select, insert on public.business_programme_withdrawal_decisions to service_role;

create or replace function public.business_programme_withdrawal_decide(
  p_partner_user_id uuid,
  p_reference_id text,
  p_decision text,
  p_decided_by uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_existing public.business_programme_withdrawal_decisions%rowtype;
begin
  if p_partner_user_id is null or p_reference_id is null or length(trim(p_reference_id)) = 0 then
    raise exception 'Partner and withdrawal reference are required';
  end if;
  if p_decision not in ('approve', 'reject') then
    raise exception 'Unsupported withdrawal decision';
  end if;

  insert into public.business_programme_withdrawal_decisions
    (partner_user_id, reference_id, decision, decided_by)
  values (p_partner_user_id, p_reference_id, p_decision, p_decided_by)
  on conflict (partner_user_id, reference_id) do nothing;

  select * into v_existing
  from public.business_programme_withdrawal_decisions
  where partner_user_id = p_partner_user_id and reference_id = p_reference_id;

  return jsonb_build_object(
    'success', true,
    'decision', v_existing.decision,
    'duplicate', v_existing.decision = p_decision,
    'conflict', v_existing.decision <> p_decision,
    'decided_at', v_existing.decided_at
  );
end;
$$;

revoke all on function public.business_programme_withdrawal_decide(uuid,text,text,uuid) from public, anon, authenticated;
grant execute on function public.business_programme_withdrawal_decide(uuid,text,text,uuid) to service_role;
