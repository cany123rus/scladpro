-- Прогноз ЧЗ: расход — по заказам ФБС за период, а не по сканам.
--
-- Сканы врали: у кабинета, где сканирование в базе началось неделю назад,
-- расход делился на 30 дней и выходил вдвое ниже реального. Теперь сайт сам
-- берёт заказы ФБС из WB за p_days дней и передаёт их nmId (по одному на заказ);
-- категория и пол — из карточки товара. Если WB недоступен, p_nm_ids = null —
-- тогда запасной путь: сканы ЧЗ за те же p_days дней.
drop function if exists public.hs_fbs_stock_forecast(uuid, int);

create or replace function public.hs_fbs_stock_forecast(p_supplier uuid, p_nm_ids bigint[] default null, p_days int default 14)
returns table(category text, gender text, in_base bigint, used bigint, period_days numeric)
language sql
stable
set search_path to 'public'
as $$
  with stock as (
    select
      case
        when lower(coalesce(nullif(trim(u.category), ''), 'Без категории'))
             in ('костюмы', 'костюмы спортивные', 'костюмы / костюмы спортивные')
          then 'Костюмы / Костюмы спортивные'
        else coalesce(nullif(trim(u.category), ''), 'Без категории')
      end as category,
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
    -- заказы ФБС из WB: один элемент массива — один заказ
    select o.nm_id
    from unnest(p_nm_ids) as o(nm_id)
    where p_nm_ids is not null
    union all
    -- запасной путь: сканы ЧЗ
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
      case
        when lower(coalesce(nullif(trim(c.product_json ->> 'subjectName'), ''), '')) in ('костюмы', 'костюмы спортивные')
          then 'Костюмы / Костюмы спортивные'
        else coalesce(nullif(trim(c.product_json ->> 'subjectName'), ''), 'Без категории')
      end as category,
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

grant execute on function public.hs_fbs_stock_forecast(uuid, bigint[], int) to anon, authenticated;
