-- Delivery history for temporary workers logistics
-- Safe to run multiple times

create table if not exists public.delivery_persons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint delivery_persons_name_not_empty check (length(btrim(name)) > 0)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'delivery_persons_name_key'
  ) then
    alter table public.delivery_persons
      add constraint delivery_persons_name_key unique (name);
  end if;
end $$;

create table if not exists public.delivery_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  courier_name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  is_paid boolean not null default false,
  paid_by_supplier_id uuid null references public.suppliers(id) on update cascade on delete set null,
  paid_at timestamptz null,
  created_by uuid null,
  created_at timestamptz not null default now(),
  constraint delivery_logs_courier_name_not_empty check (length(btrim(courier_name)) > 0)
);

create table if not exists public.delivery_items (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.delivery_logs(id) on update cascade on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on update cascade on delete restrict,
  boxes numeric(12, 2) not null check (boxes > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_delivery_logs_date on public.delivery_logs(date desc);
create index if not exists idx_delivery_logs_is_paid on public.delivery_logs(is_paid);
create index if not exists idx_delivery_logs_paid_by_supplier_id on public.delivery_logs(paid_by_supplier_id);
create index if not exists idx_delivery_items_delivery_id on public.delivery_items(delivery_id);
create index if not exists idx_delivery_items_supplier_id on public.delivery_items(supplier_id);

alter table public.delivery_persons enable row level security;
alter table public.delivery_logs enable row level security;
alter table public.delivery_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_persons' and policyname = 'delivery_persons_select_all'
  ) then
    create policy delivery_persons_select_all
      on public.delivery_persons
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_persons' and policyname = 'delivery_persons_insert_all'
  ) then
    create policy delivery_persons_insert_all
      on public.delivery_persons
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_persons' and policyname = 'delivery_persons_update_all'
  ) then
    create policy delivery_persons_update_all
      on public.delivery_persons
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_persons' and policyname = 'delivery_persons_delete_all'
  ) then
    create policy delivery_persons_delete_all
      on public.delivery_persons
      for delete
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_logs' and policyname = 'delivery_logs_select_all'
  ) then
    create policy delivery_logs_select_all
      on public.delivery_logs
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_logs' and policyname = 'delivery_logs_insert_all'
  ) then
    create policy delivery_logs_insert_all
      on public.delivery_logs
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_logs' and policyname = 'delivery_logs_update_all'
  ) then
    create policy delivery_logs_update_all
      on public.delivery_logs
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_logs' and policyname = 'delivery_logs_delete_all'
  ) then
    create policy delivery_logs_delete_all
      on public.delivery_logs
      for delete
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_items' and policyname = 'delivery_items_select_all'
  ) then
    create policy delivery_items_select_all
      on public.delivery_items
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_items' and policyname = 'delivery_items_insert_all'
  ) then
    create policy delivery_items_insert_all
      on public.delivery_items
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_items' and policyname = 'delivery_items_update_all'
  ) then
    create policy delivery_items_update_all
      on public.delivery_items
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'delivery_items' and policyname = 'delivery_items_delete_all'
  ) then
    create policy delivery_items_delete_all
      on public.delivery_items
      for delete
      to anon, authenticated
      using (true);
  end if;
end $$;
