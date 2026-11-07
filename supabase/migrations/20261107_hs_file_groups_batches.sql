-- Список загрузок ЧЗ: каждая загрузка файла — отдельная группа.
--
-- Раньше группы склеивались по часу вставки: два файла с одним именем, загруженные в один
-- час, показывались одной строкой с общим количеством и отвязывались только оба сразу.
-- Теперь загрузка определяется по разрыву во времени: коды одного файла вставляются
-- подряд (секунды), следующая загрузка того же имени — минутами позже (разрыв > 2 минут).
-- Колонки результата не менялись. Можно запускать повторно, данные не меняет.

create or replace function public.hs_file_groups(p_supplier uuid)
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
  with base as (
    select
      u.file_name, u.created_at, u.category, u.gender, u.size, u.nm_ids, u.color, u.article,
      case
        when u.created_at - lag(u.created_at) over (partition by u.file_name order by u.created_at) > interval '2 minutes'
        then 1 else 0
      end as gap
    from public.unified_honest_sign_codes u
    where u.supplier_id = p_supplier
      and u.file_name is distinct from 'Напечатанные QR'
      and u.file_name is distinct from 'Отсканировано'
      and lower(coalesce(u.status, '')) not in ('printed', 'scanned')
  ),
  batched as (
    select b.*, sum(b.gap) over (partition by b.file_name order by b.created_at rows unbounded preceding) as batch
    from base b
  )
  select
    t.file_name,
    min(t.created_at) as first_at,
    max(t.created_at) as last_at,
    t.category,
    t.gender,
    t.size,
    t.nm_ids,
    count(*)::bigint as codes,
    t.color,
    t.article
  from batched t
  group by t.file_name, t.batch, t.category, t.gender, t.size, t.nm_ids, t.color, t.article
  order by min(t.created_at) desc
  limit 800
$$;

grant execute on function public.hs_file_groups(uuid) to anon, authenticated;
