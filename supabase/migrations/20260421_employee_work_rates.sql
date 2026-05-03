-- SkladPro: move per-employee work rate settings from app_settings JSON to relational DB storage
-- Safe to run multiple times

alter table if exists public.work_rates
  add column if not exists use_shared_price boolean not null default true;

create table if not exists public.employee_work_rates (
  id uuid primary key default gen_random_uuid(),
  work_rate_id uuid not null references public.work_rates(id) on update cascade on delete cascade,
  employee_id uuid not null references public.employees(id) on update cascade on delete cascade,
  price numeric(12, 2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_work_rates_work_rate_employee_unique unique (work_rate_id, employee_id)
);

create index if not exists idx_employee_work_rates_work_rate_id on public.employee_work_rates(work_rate_id);
create index if not exists idx_employee_work_rates_employee_id on public.employee_work_rates(employee_id);

create or replace function public.set_employee_work_rates_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_employee_work_rates_updated_at on public.employee_work_rates;
create trigger trg_employee_work_rates_updated_at
before update on public.employee_work_rates
for each row
execute function public.set_employee_work_rates_updated_at();

alter table public.employee_work_rates enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'employee_work_rates' and policyname = 'employee_work_rates_select_all'
  ) then
    create policy employee_work_rates_select_all
      on public.employee_work_rates
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'employee_work_rates' and policyname = 'employee_work_rates_insert_all'
  ) then
    create policy employee_work_rates_insert_all
      on public.employee_work_rates
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'employee_work_rates' and policyname = 'employee_work_rates_update_all'
  ) then
    create policy employee_work_rates_update_all
      on public.employee_work_rates
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'employee_work_rates' and policyname = 'employee_work_rates_delete_all'
  ) then
    create policy employee_work_rates_delete_all
      on public.employee_work_rates
      for delete
      to anon, authenticated
      using (true);
  end if;
end $$;

with legacy as (
  select case
    when value is null then '{}'::jsonb
    when jsonb_typeof(value::jsonb) = 'object' then value::jsonb
    else '{}'::jsonb
  end as payload
  from public.app_settings
  where key = 'cw_work_rate_employee_prices_v1'
  limit 1
)
update public.work_rates wr
set use_shared_price = coalesce((cfg.value ->> 'useSharedPrice')::boolean, true)
from legacy,
     lateral jsonb_each(legacy.payload) as cfg(key, value)
where wr.id::text = cfg.key;

with legacy as (
  select case
    when value is null then '{}'::jsonb
    when jsonb_typeof(value::jsonb) = 'object' then value::jsonb
    else '{}'::jsonb
  end as payload
  from public.app_settings
  where key = 'cw_work_rate_employee_prices_v1'
  limit 1
)
insert into public.employee_work_rates (work_rate_id, employee_id, price)
select
  cfg.key::uuid as work_rate_id,
  price_map.key::uuid as employee_id,
  (price_map.value #>> '{}')::numeric(12, 2) as price
from legacy,
     lateral jsonb_each(legacy.payload) as cfg(key, value),
     lateral jsonb_each(coalesce(cfg.value -> 'employeePrices', '{}'::jsonb)) as price_map(key, value)
where nullif(price_map.value #>> '{}', '') is not null
on conflict (work_rate_id, employee_id)
do update set
  price = excluded.price,
  updated_at = now();
