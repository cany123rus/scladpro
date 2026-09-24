-- Кардиганы — в ту же категорию ЧЗ, что свитеры и жилеты.
--
-- Марки на них общие: в базе кодов лежит 3000 марок «Свитеры / Жилеты», а в
-- карточках WB 75 кардиганов, 153 свитера и 39 жилетов. Пока кардиганы шли
-- отдельной категорией, марка к ним не подбиралась. Старое имя оставляем во
-- входных значениях: коды в базе записаны ещё им.
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
         in ('свитеры', 'свитер', 'жилеты', 'жилет', 'жилетки', 'жилетка',
             'кардиганы', 'кардиган',
             'свитеры / жилеты', 'свитеры / жилеты / кардиганы')
      then 'Свитеры / Жилеты / Кардиганы'
    else coalesce(nullif(trim(p_category), ''), 'Без категории')
  end;
$$;

grant execute on function public.hs_norm_category(text) to anon, authenticated;
