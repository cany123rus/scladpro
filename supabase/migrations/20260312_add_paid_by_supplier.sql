-- Add who-paid tracking for temp workers + FBS box history
-- Safe to run multiple times

alter table if exists public.temporary_workers_logs
  add column if not exists paid_by_supplier_id uuid null;

alter table if exists public.box_inventory_log
  add column if not exists paid_by_supplier_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'temporary_workers_logs_paid_by_supplier_id_fkey'
  ) then
    alter table public.temporary_workers_logs
      add constraint temporary_workers_logs_paid_by_supplier_id_fkey
      foreign key (paid_by_supplier_id) references public.suppliers(id) on update cascade on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'box_inventory_log_paid_by_supplier_id_fkey'
  ) then
    alter table public.box_inventory_log
      add constraint box_inventory_log_paid_by_supplier_id_fkey
      foreign key (paid_by_supplier_id) references public.suppliers(id) on update cascade on delete set null;
  end if;
end $$;

create index if not exists idx_temp_workers_paid_by_supplier on public.temporary_workers_logs(paid_by_supplier_id);
create index if not exists idx_box_inventory_paid_by_supplier on public.box_inventory_log(paid_by_supplier_id);
