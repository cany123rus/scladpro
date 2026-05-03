create extension if not exists pgcrypto;

create table if not exists wb_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references wb_accounts(id),
  wb_nm_id bigint not null,
  sku text not null,
  name text,
  brand text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(account_id, sku)
);

create table if not exists sales_events_raw (
  id bigserial primary key,
  account_id uuid references wb_accounts(id),
  source_hash text not null,
  event_at timestamptz not null,
  sku text not null,
  qty integer not null default 0,
  price numeric(14,2) not null default 0,
  revenue numeric(14,2) not null default 0,
  payload_json jsonb,
  created_at timestamptz not null default now(),
  unique(account_id, source_hash)
);

create table if not exists orders_events_raw (
  id bigserial primary key,
  account_id uuid references wb_accounts(id),
  source_hash text not null,
  event_at timestamptz not null,
  sku text not null,
  qty integer not null default 0,
  payload_json jsonb,
  created_at timestamptz not null default now(),
  unique(account_id, source_hash)
);

create table if not exists stocks_snapshots (
  id bigserial primary key,
  account_id uuid references wb_accounts(id),
  snapshot_at timestamptz not null,
  sku text not null,
  stock_qty integer not null default 0,
  payload_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists metrics_daily_sku (
  id bigserial primary key,
  account_id uuid references wb_accounts(id),
  day date not null,
  sku text not null,
  orders_cnt integer not null default 0,
  sales_cnt integer not null default 0,
  revenue numeric(14,2) not null default 0,
  avg_check numeric(14,2) not null default 0,
  stock_eod integer,
  updated_at timestamptz not null default now(),
  unique(account_id, day, sku)
);

create table if not exists metrics_daily_total (
  id bigserial primary key,
  account_id uuid references wb_accounts(id),
  day date not null,
  orders_cnt integer not null default 0,
  sales_cnt integer not null default 0,
  revenue numeric(14,2) not null default 0,
  avg_check numeric(14,2) not null default 0,
  updated_at timestamptz not null default now(),
  unique(account_id, day)
);

create table if not exists alert_rules (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references wb_accounts(id),
  type text not null,
  enabled boolean not null default true,
  threshold_json jsonb not null,
  schedule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists alerts_log (
  id bigserial primary key,
  account_id uuid references wb_accounts(id),
  created_at timestamptz not null default now(),
  type text not null,
  severity text not null,
  entity_type text,
  entity_id text,
  payload_json jsonb,
  sent_to text,
  dedupe_key text
);

create table if not exists sync_state (
  id bigserial primary key,
  account_id uuid references wb_accounts(id),
  source text not null,
  cursor_value text,
  updated_at timestamptz not null default now(),
  unique(account_id, source)
);
