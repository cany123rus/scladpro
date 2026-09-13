-- Остаток честного знака поставщика и расход по сканам ФБС — для прогноза
-- «на сколько хватит» в разделе «Управление FBS».
--
-- Остаток — коды в базе (не напечатаны и не отсканированы), как в hs_category_stats.
-- Расход — марки, отсканированные на заданиях ФБС за p_days дней; категория и пол
-- берутся из карточки товара (предмет и характеристика «Пол»).
-- period_days — сколько дней реально покрывает статистика: если сканы в базе
-- начались позже, делить на 30 значило бы занизить расход.
create or replace function public.hs_fbs_stock_forecast(p_supplier uuid, p_days int default 30)
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
  scans as (
    select f.scanned_at, c.product_json
    from public.fbs_order_codes f
    left join public.wb_products_cache c on c.supplier_id = f.supplier_id and c.nm_id = f.nm_id
    where f.supplier_id = p_supplier
      and f.scanned_at >= now() - make_interval(days => p_days)
      and coalesce(f.chz_code, '') <> ''
      and coalesce(f.looks_like_chz, true)
  ),
  usage as (
    select
      case
        when lower(coalesce(nullif(trim(s.product_json ->> 'subjectName'), ''), '')) in ('костюмы', 'костюмы спортивные')
          then 'Костюмы / Костюмы спортивные'
        else coalesce(nullif(trim(s.product_json ->> 'subjectName'), ''), 'Без категории')
      end as category,
      (
        select case
          when lower(ch -> 'value' ->> 0) like 'муж%' then 'male'
          when lower(ch -> 'value' ->> 0) like 'жен%' then 'female'
          else null
        end
        from jsonb_array_elements(coalesce(s.product_json -> 'characteristics', '[]'::jsonb)) ch
        where ch ->> 'name' = 'Пол'
        limit 1
      ) as gender,
      count(*)::bigint as used
    from scans s
    group by 1, 2
  ),
  period as (
    select greatest(1, least(p_days::numeric,
      extract(epoch from now() - min(f.scanned_at)) / 86400.0))::numeric(10, 2) as days
    from public.fbs_order_codes f
    where f.supplier_id = p_supplier and f.scanned_at is not null
  )
  select
    coalesce(st.category, us.category) as category,
    coalesce(st.gender, us.gender) as gender,
    coalesce(st.in_base, 0) as in_base,
    coalesce(us.used, 0) as used,
    coalesce((select days from period), p_days) as period_days
  from stock st
  full outer join usage us
    on us.category = st.category and us.gender is not distinct from st.gender
  order by 1, 2 nulls last;
$$;

grant execute on function public.hs_fbs_stock_forecast(uuid, int) to anon, authenticated;
