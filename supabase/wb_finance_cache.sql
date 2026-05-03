-- WB finance cache tables

create table if not exists public.wb_financial_reports_raw (
  id bigserial primary key,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  supplier_name text not null,
  rrd_id bigint,
  report_year int,
  report_date date,
  nm_id bigint,
  sa_name text,
  doc_type_name text,
  retail_amount numeric default 0,
  ppvz_for_pay numeric default 0,
  delivery_rub numeric default 0,
  penalty numeric default 0,
  storage_fee numeric default 0,
  deduction numeric default 0,
  created_at timestamptz default now(),
  unique (supplier_id, rrd_id)
);

create index if not exists idx_wb_fin_raw_supplier_year on public.wb_financial_reports_raw(supplier_id, report_year);
create index if not exists idx_wb_fin_raw_supplier_nm on public.wb_financial_reports_raw(supplier_id, nm_id);

create table if not exists public.wb_financial_reports_agg (
  id bigserial primary key,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  supplier_name text not null,
  nm_id bigint,
  sa_name text,
  sales_gross numeric default 0,
  returns_gross numeric default 0,
  sales_net numeric default 0,
  payout_sales_gross numeric default 0,
  payout_returns_gross numeric default 0,
  payout_net numeric default 0,
  logistics_sum numeric default 0,
  storage_sum numeric default 0,
  fines_sum numeric default 0,
  withhold_sum numeric default 0,
  to_pay_total numeric default 0,
  updated_at timestamptz default now(),
  unique (supplier_id, nm_id, sa_name)
);

create index if not exists idx_wb_fin_agg_supplier on public.wb_financial_reports_agg(supplier_id);

alter table public.wb_financial_reports_raw enable row level security;
alter table public.wb_financial_reports_agg enable row level security;

-- simple authenticated read/write policies (tighten later if needed)
do $$ begin
  create policy wb_fin_raw_rw_auth on public.wb_financial_reports_raw
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy wb_fin_agg_rw_auth on public.wb_financial_reports_agg
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
