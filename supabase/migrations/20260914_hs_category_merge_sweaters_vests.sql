-- Категории ЧЗ: одно правило нормализации на всю базу.
--
-- «Костюмы» и «Костюмы спортивные» уже считались одной категорией, теперь так же
-- «Свитеры» и «Жилеты»/«Жилетки»: марки у них общие. Правило было размножено
-- CASE-ом по функциям — вынесено в hs_norm_category, чтобы не разъехалось.
create or replace function public.hs_norm_category(p_category text)
returns text
language sql
immutable
set search_path to ''
as $$
  select case
    when lower(coalesce(nullif(trim(p_category), ''), 'Без категории'))
         in ('костюмы', 'костюмы спортивные', 'костюмы / костюмы спортивные')
      then 'Костюмы / Костюмы спортивные'
    when lower(coalesce(nullif(trim(p_category), ''), ''))
         in ('свитеры', 'свитер', 'жилеты', 'жилет', 'жилетки', 'жилетка', 'свитеры / жилеты')
      then 'Свитеры / Жилеты'
    else coalesce(nullif(trim(p_category), ''), 'Без категории')
  end;
$$;

create or replace function public.hs_category_stats(p_supplier uuid)
returns table(category text, total bigint, in_base bigint, printed bigint, scanned bigint)
language sql
stable
set search_path to 'public'
as $$
  with norm as (
    select
      public.hs_norm_category(u.category) as category,
      u.file_name,
      lower(coalesce(u.status, '')) as status
    from public.unified_honest_sign_codes u
    where u.supplier_id = p_supplier
  )
  select
    category,
    count(*)::bigint as total,
    count(*) filter (
      where file_name is distinct from 'Напечатанные QR' and status <> 'printed'
        and file_name is distinct from 'Отсканировано' and status <> 'scanned'
    )::bigint as in_base,
    count(*) filter (where file_name = 'Напечатанные QR' or status = 'printed')::bigint as printed,
    count(*) filter (
      where (file_name = 'Отсканировано' or status = 'scanned')
        and file_name is distinct from 'Напечатанные QR' and status <> 'printed'
    )::bigint as scanned
  from norm
  group by category
  order by category;
$$;

create or replace function public.hs_fbs_stock_forecast(p_supplier uuid, p_nm_ids bigint[] default null, p_days int default 14)
returns table(category text, gender text, in_base bigint, used bigint, period_days numeric)
language sql
stable
set search_path to 'public'
as $$
  with stock as (
    select
      public.hs_norm_category(u.category) as category,
      case lower(coalesce(u.gender, ''))
        when 'male' then 'male' when 'мужской' then 'male'
        when 'female' then 'female' when 'женский' then 'female'
        else null
      end as gender,
      count(*)::bigint as in_base
    from public.unified_honest_sign_codes u
    where u.supplier_id = p_supplier
      and u.file_name is distinct from 'Напечатанные QR' and lower(coalesce(u.status, '')) <> 'printed'
      and u.file_name is distinct from 'Отсканировано' and lower(coalesce(u.status, '')) <> 'scanned'
    group by 1, 2
  ),
  demand as (
    select o.nm_id
    from unnest(p_nm_ids) as o(nm_id)
    where p_nm_ids is not null
    union all
    select f.nm_id
    from public.fbs_order_codes f
    where p_nm_ids is null
      and f.supplier_id = p_supplier
      and f.scanned_at >= now() - make_interval(days => p_days)
      and coalesce(f.chz_code, '') <> ''
      and coalesce(f.looks_like_chz, true)
  ),
  usage as (
    select
      public.hs_norm_category(c.product_json ->> 'subjectName') as category,
      (
        select case
          when lower(ch -> 'value' ->> 0) like 'муж%' then 'male'
          when lower(ch -> 'value' ->> 0) like 'жен%' then 'female'
          else null
        end
        from jsonb_array_elements(coalesce(c.product_json -> 'characteristics', '[]'::jsonb)) ch
        where ch ->> 'name' = 'Пол'
        limit 1
      ) as gender,
      count(*)::bigint as used
    from demand d
    left join public.wb_products_cache c on c.supplier_id = p_supplier and c.nm_id = d.nm_id
    group by 1, 2
  )
  select
    coalesce(st.category, us.category) as category,
    coalesce(st.gender, us.gender) as gender,
    coalesce(st.in_base, 0) as in_base,
    coalesce(us.used, 0) as used,
    p_days::numeric as period_days
  from stock st
  full outer join usage us
    on us.category = st.category and us.gender is not distinct from st.gender
  order by 1, 2 nulls last;
$$;

grant execute on function public.hs_norm_category(text) to anon, authenticated;
grant execute on function public.hs_fbs_stock_forecast(uuid, bigint[], int) to anon, authenticated;
