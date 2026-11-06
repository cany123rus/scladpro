-- Описание товара у кодов ЧЗ: цвет и артикул поставщика.
--
-- Таблица из личного кабинета «Честного знака» содержит для каждого кода тип товара,
-- цвет, пол, размер и артикул. Категория, пол и размер у кодов уже есть, добавляем цвет
-- и артикул — по ним файл раскладывается на группы «дублёнка · коричневая · S».
-- Скрипт можно запускать повторно: данные не меняет.

alter table public.unified_honest_sign_codes
  add column if not exists color text,
  add column if not exists article text;

comment on column public.unified_honest_sign_codes.color is 'Цвет из таблицы ЧЗ (в нижнем регистре). NULL — не указан.';
comment on column public.unified_honest_sign_codes.article is 'Артикул поставщика из таблицы ЧЗ. NULL — не указан.';

-- Список групп получил две новые колонки — меняется тип результата, поэтому пересоздаём.
drop function if exists public.hs_file_groups(uuid);

create function public.hs_file_groups(p_supplier uuid)
returns table(
  file_name text,
  first_at timestamptz,
  last_at timestamptz,
  category text,
  gender text,
  size text,
  nm_ids bigint[],
  codes bigint,
  color text,
  article text
)
language sql
stable
set search_path to 'public'
as $$
  select
    u.file_name,
    min(u.created_at) as first_at,
    max(u.created_at) as last_at,
    u.category,
    u.gender,
    u.size,
    u.nm_ids,
    count(*)::bigint as codes,
    u.color,
    u.article
  from public.unified_honest_sign_codes u
  where u.supplier_id = p_supplier
    and u.file_name is distinct from 'Напечатанные QR'
    and u.file_name is distinct from 'Отсканировано'
    and lower(coalesce(u.status, '')) not in ('printed', 'scanned')
  group by u.file_name, date_trunc('hour', u.created_at), u.category, u.gender, u.size, u.nm_ids, u.color, u.article
  order by min(u.created_at) desc
  limit 800
$$;

grant execute on function public.hs_file_groups(uuid) to anon, authenticated;
