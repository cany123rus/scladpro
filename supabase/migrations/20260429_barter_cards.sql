-- SkladPro: move barter cards from app_settings JSON storage to relational DB rows
-- One barter card = one DB row
-- Safe to run multiple times

create table if not exists public.barter_cards (
  id text primary key,
  month text not null,
  supplier_id uuid not null references public.suppliers(id) on update cascade on delete cascade,
  supplier_name text not null default '',
  product_id text not null default '',
  product_name text not null default '',
  product_photo text not null default '',
  product_photos jsonb not null default '[]'::jsonb,
  product_group_key text not null default '',
  product_group_name text not null default '',
  product_ids jsonb not null default '[]'::jsonb,
  product_variant_labels jsonb not null default '[]'::jsonb,
  product_variants_count integer not null default 1 check (product_variants_count >= 1),
  barter_links text[] not null default '{}'::text[],
  barter_dates text[] not null default '{}'::text[],
  barter_prices text[] not null default '{}'::text[],
  barter_views text[] not null default '{}'::text[],
  barter_ratings text[] not null default '{}'::text[],
  barter_published boolean[] not null default '{}'::boolean[],
  ad_links text[] not null default '{}'::text[],
  ad_dates text[] not null default '{}'::text[],
  ad_prices text[] not null default '{}'::text[],
  ad_views text[] not null default '{}'::text[],
  ad_ratings text[] not null default '{}'::text[],
  ad_published boolean[] not null default '{}'::boolean[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_barter_cards_supplier_month on public.barter_cards(supplier_id, month);
create index if not exists idx_barter_cards_month on public.barter_cards(month);
create index if not exists idx_barter_cards_product_id on public.barter_cards(product_id);

create or replace function public.set_barter_cards_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_barter_cards_updated_at on public.barter_cards;
create trigger trg_barter_cards_updated_at
before update on public.barter_cards
for each row
execute function public.set_barter_cards_updated_at();

alter table public.barter_cards enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'barter_cards' and policyname = 'barter_cards_select_all'
  ) then
    create policy barter_cards_select_all
      on public.barter_cards
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'barter_cards' and policyname = 'barter_cards_insert_all'
  ) then
    create policy barter_cards_insert_all
      on public.barter_cards
      for insert
      to anon, authenticated
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'barter_cards' and policyname = 'barter_cards_update_all'
  ) then
    create policy barter_cards_update_all
      on public.barter_cards
      for update
      to anon, authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'barter_cards' and policyname = 'barter_cards_delete_all'
  ) then
    create policy barter_cards_delete_all
      on public.barter_cards
      for delete
      to anon, authenticated
      using (true);
  end if;
end $$;

with settings_source as (
  select
    2 as priority,
    key,
    case
      when value is null then '{}'::jsonb
      when jsonb_typeof(value::jsonb) in ('object', 'array') then value::jsonb
      else '{}'::jsonb
    end as payload
  from public.app_settings
  where key = 'barters_external_ads_v1'

  union all

  select
    1 as priority,
    key,
    case
      when value is null then '{}'::jsonb
      when jsonb_typeof(value::jsonb) in ('object', 'array') then value::jsonb
      else '{}'::jsonb
    end as payload
  from public.app_settings
  where key = 'barters_v1'
),
rows_source as (
  select
    s.priority,
    row_item.row
  from settings_source s
  cross join lateral jsonb_array_elements(
    case
      when jsonb_typeof(s.payload) = 'array' then s.payload
      when jsonb_typeof(s.payload -> 'rows') = 'array' then s.payload -> 'rows'
      else '[]'::jsonb
    end
  ) as row_item(row)
),
normalized as (
  select
    priority,
    row,
    coalesce(
      nullif(row ->> 'id', ''),
      concat_ws(':', row ->> 'supplier_id', row ->> 'product_id', row ->> 'month', row ->> 'product_name')
    ) as dedupe_key
  from rows_source
  where row is not null
    and coalesce(nullif(row ->> 'supplier_id', ''), '') <> ''
),
ranked as (
  select *, row_number() over (partition by dedupe_key order by priority desc) as rn
  from normalized
)
insert into public.barter_cards (
  id,
  month,
  supplier_id,
  supplier_name,
  product_id,
  product_name,
  product_photo,
  product_photos,
  product_group_key,
  product_group_name,
  product_ids,
  product_variant_labels,
  product_variants_count,
  barter_links,
  barter_dates,
  barter_prices,
  barter_views,
  barter_ratings,
  barter_published,
  ad_links,
  ad_dates,
  ad_prices,
  ad_views,
  ad_ratings,
  ad_published
)
select
  dedupe_key as id,
  coalesce(nullif(row ->> 'month', ''), to_char(now(), 'YYYY-MM')) as month,
  (row ->> 'supplier_id')::uuid as supplier_id,
  coalesce(row ->> 'supplier_name', '') as supplier_name,
  coalesce(row ->> 'product_id', '') as product_id,
  coalesce(row ->> 'product_name', '') as product_name,
  coalesce(row ->> 'product_photo', '') as product_photo,
  case when jsonb_typeof(row -> 'product_photos') = 'array' then row -> 'product_photos' else '[]'::jsonb end as product_photos,
  coalesce(row ->> 'product_group_key', '') as product_group_key,
  coalesce(row ->> 'product_group_name', '') as product_group_name,
  case
    when jsonb_typeof(row -> 'product_ids') = 'array' then row -> 'product_ids'
    when coalesce(row ->> 'product_id', '') <> '' then jsonb_build_array(row ->> 'product_id')
    else '[]'::jsonb
  end as product_ids,
  case when jsonb_typeof(row -> 'product_variant_labels') = 'array' then row -> 'product_variant_labels' else '[]'::jsonb end as product_variant_labels,
  greatest(coalesce(nullif(row ->> 'product_variants_count', '')::integer, 0), 1) as product_variants_count,
  array(select jsonb_array_elements_text(case when jsonb_typeof(row -> 'barter_links') = 'array' then row -> 'barter_links' else '[]'::jsonb end)) as barter_links,
  array(select jsonb_array_elements_text(case when jsonb_typeof(row -> 'barter_dates') = 'array' then row -> 'barter_dates' else '[]'::jsonb end)) as barter_dates,
  array(select jsonb_array_elements_text(case when jsonb_typeof(row -> 'barter_prices') = 'array' then row -> 'barter_prices' else '[]'::jsonb end)) as barter_prices,
  array(select jsonb_array_elements_text(case when jsonb_typeof(row -> 'barter_views') = 'array' then row -> 'barter_views' else '[]'::jsonb end)) as barter_views,
  array(select jsonb_array_elements_text(case when jsonb_typeof(row -> 'barter_ratings') = 'array' then row -> 'barter_ratings' else '[]'::jsonb end)) as barter_ratings,
  array(select coalesce(nullif(trim(both '"' from value::text), '')::boolean, false) from jsonb_array_elements(case when jsonb_typeof(row -> 'barter_published') = 'array' then row -> 'barter_published' else '[]'::jsonb end)) as barter_published,
  array(select jsonb_array_elements_text(case when jsonb_typeof(row -> 'ad_links') = 'array' then row -> 'ad_links' else '[]'::jsonb end)) as ad_links,
  array(select jsonb_array_elements_text(case when jsonb_typeof(row -> 'ad_dates') = 'array' then row -> 'ad_dates' else '[]'::jsonb end)) as ad_dates,
  array(select jsonb_array_elements_text(case when jsonb_typeof(row -> 'ad_prices') = 'array' then row -> 'ad_prices' else '[]'::jsonb end)) as ad_prices,
  array(select jsonb_array_elements_text(case when jsonb_typeof(row -> 'ad_views') = 'array' then row -> 'ad_views' else '[]'::jsonb end)) as ad_views,
  array(select jsonb_array_elements_text(case when jsonb_typeof(row -> 'ad_ratings') = 'array' then row -> 'ad_ratings' else '[]'::jsonb end)) as ad_ratings,
  array(select coalesce(nullif(trim(both '"' from value::text), '')::boolean, false) from jsonb_array_elements(case when jsonb_typeof(row -> 'ad_published') = 'array' then row -> 'ad_published' else '[]'::jsonb end)) as ad_published
from ranked
where rn = 1
on conflict (id)
do update set
  month = excluded.month,
  supplier_id = excluded.supplier_id,
  supplier_name = excluded.supplier_name,
  product_id = excluded.product_id,
  product_name = excluded.product_name,
  product_photo = excluded.product_photo,
  product_photos = excluded.product_photos,
  product_group_key = excluded.product_group_key,
  product_group_name = excluded.product_group_name,
  product_ids = excluded.product_ids,
  product_variant_labels = excluded.product_variant_labels,
  product_variants_count = excluded.product_variants_count,
  barter_links = excluded.barter_links,
  barter_dates = excluded.barter_dates,
  barter_prices = excluded.barter_prices,
  barter_views = excluded.barter_views,
  barter_ratings = excluded.barter_ratings,
  barter_published = excluded.barter_published,
  ad_links = excluded.ad_links,
  ad_dates = excluded.ad_dates,
  ad_prices = excluded.ad_prices,
  ad_views = excluded.ad_views,
  ad_ratings = excluded.ad_ratings,
  ad_published = excluded.ad_published,
  updated_at = now();
