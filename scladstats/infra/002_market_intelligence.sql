create table if not exists market_queries (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  category text,
  region text default 'ru',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(query, coalesce(category, ''))
);

create table if not exists market_products (
  id uuid primary key default gen_random_uuid(),
  wb_nm_id bigint not null unique,
  name text,
  brand text,
  category text,
  seller text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists market_product_snapshots (
  id bigserial primary key,
  wb_nm_id bigint not null,
  query_id uuid references market_queries(id),
  snapshot_date date not null,
  snapshot_at timestamptz not null default now(),
  price numeric(14,2),
  sale_price numeric(14,2),
  rating numeric(6,3),
  feedbacks integer,
  stocks_est integer,
  orders_est integer,
  revenue_est numeric(14,2),
  rank_pos integer,
  payload_json jsonb,
  unique(wb_nm_id, query_id, snapshot_date, rank_pos)
);
create index if not exists idx_mps_nm_date on market_product_snapshots(wb_nm_id, snapshot_date);
create index if not exists idx_mps_query_date on market_product_snapshots(query_id, snapshot_date);
-- covers the LATERAL subquery ORDER BY snapshot_at DESC in the /market/products route
create index if not exists idx_mps_nm_snapshot_at on market_product_snapshots(wb_nm_id, snapshot_at desc);
-- covers the market_niche_daily max(day) subquery
create index if not exists idx_mnd_day on market_niche_daily(day desc);

create table if not exists market_niche_daily (
  id bigserial primary key,
  query_id uuid references market_queries(id),
  day date not null,
  products_count integer not null default 0,
  avg_price numeric(14,2) not null default 0,
  demand_est numeric(14,2) not null default 0,
  competition_density numeric(14,4) not null default 0,
  trend_score numeric(8,4) not null default 0,
  entry_barrier_score numeric(8,4) not null default 0,
  opportunity_score numeric(8,4) not null default 0,
  created_at timestamptz not null default now(),
  unique(query_id, day)
);

insert into market_queries(query, category)
values
  ('термокружка', 'Кухня'),
  ('органайзер для кухни', 'Дом'),
  ('кабель usb c', 'Электроника')
on conflict do nothing;
