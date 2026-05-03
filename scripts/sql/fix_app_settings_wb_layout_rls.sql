-- Разрешить клиенту сохранять/читать ТОЛЬКО ключ макета wb_label_layout_v1
-- (без открытия доступа ко всем app_settings)

alter table public.app_settings enable row level security;

-- SELECT для чтения макета
create policy if not exists app_settings_wb_layout_select
on public.app_settings
for select
to anon, authenticated
using (key = 'wb_label_layout_v1');

-- UPDATE для изменения существующего макета
create policy if not exists app_settings_wb_layout_update
on public.app_settings
for update
to anon, authenticated
using (key = 'wb_label_layout_v1')
with check (key = 'wb_label_layout_v1');

-- INSERT для первого сохранения макета
create policy if not exists app_settings_wb_layout_insert
on public.app_settings
for insert
to anon, authenticated
with check (key = 'wb_label_layout_v1');
