# dev-tasks-bot — Telegram → очередь задач по проекту

Telegram-бот складывает задачи в таблицу `public.dev_tasks`. Реальную работу
(правки кода, сборка, деплой) делает агент (Claude Code) на компьютере: читает
`status='new'`, выполняет, пишет `result` и `status='done'`. Пользователь видит
статусы в боте по `/list`.

## Таблица
`public.dev_tasks(id, chat_id, text, status[new|in_progress|done|rejected], result, created_at, updated_at)`.
RLS включён, политик нет → доступ только `service_role` (бот) и через MCP (агент).

## Команды бота
- любой текст / `/task <текст>` — создать задачу
- `/list` (или `/tasks`) — последние 10 задач со статусом и результатом
- `/start` — справка

## Настройка (делает владелец — токен это секрет)
1. @BotFather → `/newbot` → токен (или переиспользовать существующий бот).
2. @userinfobot → свой `chat_id`.
3. Secrets (Supabase → Edge Functions → Secrets):
   - `TELEGRAM_TASK_BOT_TOKEN` — токен бота
   - `TELEGRAM_TASK_WEBHOOK_SECRET` — случайная строка
   - `ALLOWED_TASK_CHAT_IDS` — ваш chat_id (через запятую для нескольких)
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — Supabase подставляет сам
4. Вебхук (один раз, подставьте свои значения):
   ```
   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://blygwkxjogmioebutiwn.supabase.co/functions/v1/dev-tasks-bot&secret_token=<TELEGRAM_TASK_WEBHOOK_SECRET>
   ```

## Как выполняются задачи
Агент в сессии Claude Code по команде «разбери задачи из телеграма»:
`select * from dev_tasks where status='new'` → `in_progress` → делает → `done` + `result`.
Можно автоматизировать опрос через `/loop`.
