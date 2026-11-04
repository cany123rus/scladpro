-- Привязка файлов с кодами ЧЗ к товарам.
--
-- Один скрипт: колонка nm_ids (если её ещё нет) и функция со списком загрузок.
-- Можно запускать повторно — ничего не ломает и не меняет в данных.

alter table public.unified_honest_sign_codes
  add column if not exists nm_ids bigint[];

comment on column public.unified_honest_sign_codes.nm_ids is
  'nmId карточек WB, которым подходит марка. NULL — любой карточке категории.';

-- Загрузки поставщика: файл + категория + пол + размер + привязка.
-- Напечатанные и отсканированные марки в файлах не числятся (у них другое имя файла),
-- поэтому здесь только то, что ещё лежит в базе.
-- first_at / last_at — границы времени вставки: по ним сайт точно выбирает строки файла.
create or replace function public.hs_file_groups(p_supplier uuid)
returns table(
  file_name text,
  first_at timestamptz,
  last_at timestamptz,
  category text,
  gender text,
  size text,
  nm_ids bigint[],
  codes bigint
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
    count(*)::bigint as codes
  from public.unified_honest_sign_codes u
  where u.supplier_id = p_supplier
    and u.file_name is distinct from 'Напечатанные QR'
    and u.file_name is distinct from 'Отсканировано'
    and lower(coalesce(u.status, '')) not in ('printed', 'scanned')
  group by u.file_name, date_trunc('hour', u.created_at), u.category, u.gender, u.size, u.nm_ids
  order by min(u.created_at) desc
  limit 400
$$;

grant execute on function public.hs_file_groups(uuid) to anon, authenticated;
