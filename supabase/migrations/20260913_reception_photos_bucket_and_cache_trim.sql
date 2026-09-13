-- Фото приёмок — в хранилище файлов, а не base64 в строке receptions.
-- Бакет публичный (как orders): ссылки на фото открываются в <img> и уходят в Telegram.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reception-photos', 'reception-photos', true, 20971520,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'])
on conflict (id) do nothing;

drop policy if exists reception_photos_select on storage.objects;
create policy reception_photos_select on storage.objects
  for select to anon, authenticated using (bucket_id = 'reception-photos');

drop policy if exists reception_photos_insert on storage.objects;
create policy reception_photos_insert on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'reception-photos');

drop policy if exists reception_photos_update on storage.objects;
create policy reception_photos_update on storage.objects
  for update to anon, authenticated using (bucket_id = 'reception-photos') with check (bucket_id = 'reception-photos');

drop policy if exists reception_photos_delete on storage.objects;
create policy reception_photos_delete on storage.objects
  for delete to anon, authenticated using (bucket_id = 'reception-photos');

-- Кэш карточек WB: храним только то, что сайт читает.
-- Описание, документы, видео и все фото кроме первого занимали ~2/3 таблицы и
-- скачивались при каждом выборе поставщика. Сайт берёт только photos[0].
create or replace function public.wb_products_cache_trim()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.product_json is not null and jsonb_typeof(new.product_json) = 'object' then
    new.product_json := new.product_json - 'description' - 'documents' - 'video' - 'nmUUID';
    if jsonb_typeof(new.product_json -> 'photos') = 'array'
       and jsonb_array_length(new.product_json -> 'photos') > 1 then
      new.product_json := jsonb_set(new.product_json, '{photos}',
                                    jsonb_build_array(new.product_json -> 'photos' -> 0));
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists wb_products_cache_trim on public.wb_products_cache;
create trigger wb_products_cache_trim
  before insert or update of product_json on public.wb_products_cache
  for each row execute function public.wb_products_cache_trim();

-- Уже лежащие карточки прогоняем через триггер.
update public.wb_products_cache set product_json = product_json;
