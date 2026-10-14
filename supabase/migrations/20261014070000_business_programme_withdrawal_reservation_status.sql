-- Keep the original withdrawal reservation's status in sync with its
-- atomic admin decision. Also repairs reservations decided before this trigger existed.

update public.business_programme_wallet_transactions r
set status = case d.decision when 'approve' then 'completed' else 'rejected' end
from public.business_programme_withdrawal_decisions d
where r.partner_user_id = d.partner_user_id
  and r.reference_id = d.reference_id
  and r.transaction_type = 'withdrawal_request'
  and r.status = 'pending';

create or replace function public.business_programme_sync_withdrawal_reservation_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.business_programme_wallet_transactions
  set status = case new.decision when 'approve' then 'completed' else 'rejected' end
  where partner_user_id = new.partner_user_id
    and reference_id = new.reference_id
    and transaction_type = 'withdrawal_request'
    and status = 'pending';
  return new;
end;
$$;

revoke all on function public.business_programme_sync_withdrawal_reservation_status() from public, anon, authenticated, service_role;

drop trigger if exists business_programme_sync_withdrawal_reservation_status
  on public.business_programme_withdrawal_decisions;

create trigger business_programme_sync_withdrawal_reservation_status
after insert on public.business_programme_withdrawal_decisions
for each row
execute function public.business_programme_sync_withdrawal_reservation_status();
