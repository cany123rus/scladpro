-- Оптимизация 13.09.2026.
--
-- 1. Realtime: в публикации было 13 таблиц, а слушали из них три.
--    Разбор WAL для realtime занимал 91% всего времени работы базы
--    (pg_stat_statements с 17.04.2026), причём больше всего весили таблицы,
--    которые никто не слушает: app_settings (перезапись блоков сканов до
--    150 кБ, ~29 тыс. раз) и activity_logs (83 МБ).
--
--    Оставляем то, на что реально подписан сайт:
--      employees  — принудительный выход и список сотрудников;
--      suppliers  — обновление списка поставщиков;
--      tasks      — «Задачи» подписаны на неё, но таблицы в публикации не было,
--                   и подписка молча не работала.
--    Было до правки (для отката):
--      activity_logs, app_settings, boxes, employees, print_files, products,
--      profiles, receptions, settings, suppliers, supply_items, work_rates
--
-- 2. Индекс для проверки дубля ЧЗ на приёмке ФБО: 48 тыс. поисков по
--    supply_items.honest_sign_code шли полным перебором таблицы.

do $$
declare
  t text;
begin
  foreach t in array array[
    'activity_logs', 'app_settings', 'boxes', 'print_files', 'products',
    'profiles', 'receptions', 'settings', 'supply_items', 'work_rates'
  ] loop
    if exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime drop table public.%I', t);
    end if;
  end loop;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
  ) then
    execute 'alter publication supabase_realtime add table public.tasks';
  end if;
end $$;

create index if not exists supply_items_honest_sign_code_idx
  on public.supply_items (honest_sign_code)
  where honest_sign_code is not null;
