-- WB products shared cache in DB (cross-device)
-- Run in Supabase SQL editor once.

create table if not exists public.wb_products_cache (
  supplier_id uuid not null,
  nm_id bigint not null,
  product_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (supplier_id, nm_id)
);

create index if not exists idx_wb_products_cache_supplier_id on public.wb_products_cache (supplier_id);
create index if not exists idx_wb_products_cache_updated_at on public.wb_products_cache (updated_at desc);

alter table public.wb_products_cache enable row level security;

-- Broad app-compatible policies (same model as current app tables)
drop policy if exists wb_products_cache_select_all on public.wb_products_cache;
create policy wb_products_cache_select_all
  on public.wb_products_cache
  for select
  to anon, authenticated
  using (true);

drop policy if exists wb_products_cache_insert_all on public.wb_products_cache;
create policy wb_products_cache_insert_all
  on public.wb_products_cache
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists wb_products_cache_update_all on public.wb_products_cache;
create policy wb_products_cache_update_all
  on public.wb_products_cache
  for update
  to anon, authenticated
  using (true)
  with check (true);
