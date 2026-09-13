-- Входящие сообщения основного бота @scladprobot.
--
-- Раньше сайт сам забирал их у Telegram через getUpdates (импорт кодов ЧЗ из
-- Telegram, проверка бота печати). У бота теперь вебхук — кнопка «Запросить
-- остаток ЧЗ» отвечает с сервера, — а при вебхуке getUpdates Telegram отключает.
-- Поэтому вебхук складывает каждое сообщение сюда, и сайт читает его отсюда в
-- том же виде, что отдавал getUpdates.
create table if not exists public.telegram_updates (
  update_id bigint primary key,
  chat_id text,
  message jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists telegram_updates_chat_created_idx
  on public.telegram_updates (chat_id, created_at desc);
create index if not exists telegram_updates_created_idx
  on public.telegram_updates (created_at desc);

alter table public.telegram_updates enable row level security;

-- Сайт работает на anon-ключе и раньше видел те же сообщения через токен бота.
drop policy if exists telegram_updates_read on public.telegram_updates;
create policy telegram_updates_read on public.telegram_updates
  for select to anon, authenticated using (true);
-- Пишет только вебхук (service_role) — политик на запись нет.
