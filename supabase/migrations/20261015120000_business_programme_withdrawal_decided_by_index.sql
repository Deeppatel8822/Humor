-- Cover the decided_by foreign key for admin-decision history lookups and FK maintenance.
-- Additive only; does not alter or delete existing programme data.
create index if not exists business_programme_withdrawal_decisions_decided_by_idx
  on public.business_programme_withdrawal_decisions (decided_by);
