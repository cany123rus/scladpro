-- Supplier marketing / barters money balance log
-- Safe to run multiple times

create table if not exists public.supplier_marketing_money_log (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers(id) on update cascade on delete cascade,
  amount numeric(12, 2) not null check (amount <> 0),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_supplier_marketing_money_log_supplier_id
  on public.supplier_marketing_money_log(supplier_id);

create index if not exists idx_supplier_marketing_money_log_created_at
  on public.supplier_marketing_money_log(created_at desc);

alter table public.supplier_marketing_money_log enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'supplier_marketing_money_log' and policyname = 'supplier_marketing_money_log_select_all'
  ) then
    create policy supplier_marketing_money_log_select_all
      on public.supplier_marketing_money_log
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'supplier_marketing_money_log' and policyname = 'supplier_marketing_money_log_insert_all'
  ) then
    create policy supplier_marketing_money_log_insert_all
      on public.supplier_marketing_money_log
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'supplier_marketing_money_log' and policyname = 'supplier_marketing_money_log_update_all'
  ) then
    create policy supplier_marketing_money_log_update_all
      on public.supplier_marketing_money_log
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'supplier_marketing_money_log' and policyname = 'supplier_marketing_money_log_delete_all'
  ) then
    create policy supplier_marketing_money_log_delete_all
      on public.supplier_marketing_money_log
      for delete
      to anon, authenticated
      using (true);
  end if;
end $$;
