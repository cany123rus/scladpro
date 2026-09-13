-- Живые сканы ЧЗ между рабочими местами (13.09.2026).
--
-- Окно «Скан ЧЗ», открытое на двух компьютерах одновременно, не видело сканы
-- друг друга до повторного открытия. Окно подписывается на строки своей
-- поставки (фильтр supply_id) только пока открыто.
--
-- Нагрузка: около 200 записей в сутки строками меньше килобайта — несравнимо
-- с убранными из realtime app_settings. Без REPLICA IDENTITY FULL: событие
-- удаления несёт только id, и окно в этом случае перечитывает сканы поставки
-- одним запросом по индексу (supplier_id, supply_id).

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'fbs_order_codes'
  ) then
    execute 'alter publication supabase_realtime add table public.fbs_order_codes';
  end if;
end $$;
