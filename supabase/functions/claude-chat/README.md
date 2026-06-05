# claude-chat — Telegram → Claude бот

Edge Function: принимает вебхуки Telegram, отвечает через Claude API (`claude-opus-4-8`),
хранит историю диалога по каждому чату в таблице `app_settings`.

## 1. Создать нового бота
@BotFather → `/newbot` → получить токен. **Не используйте старый бот приёмки файлов.**

## 2. Узнать свой chat_id
Напишите боту `@userinfobot` в Telegram — он пришлёт ваш `id`.

## 3. Задать секреты функции
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...          # ваш ключ Anthropic
supabase secrets set TELEGRAM_CHAT_BOT_TOKEN=123456:ABC... # токен нового бота
supabase secrets set ALLOWED_CHAT_IDS=123456789            # ваш chat_id (через запятую — несколько)
supabase secrets set TELEGRAM_WEBHOOK_SECRET=<случайная_строка>
```
`SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` Supabase подставляет сам.

## 4. Задеплоить
```bash
supabase functions deploy claude-chat --no-verify-jwt
```
`--no-verify-jwt` обязателен: Telegram не присылает JWT (подлинность проверяем по `secret_token`).

## 5. Подключить вебхук
```bash
curl "https://api.telegram.org/bot<TELEGRAM_CHAT_BOT_TOKEN>/setWebhook?url=https://<PROJECT_REF>.supabase.co/functions/v1/claude-chat&secret_token=<TELEGRAM_WEBHOOK_SECRET>"
```

## Команды бота
- любой текст — вопрос к Claude (с учётом истории диалога)
- `/start` — приветствие
- `/reset` — очистить историю диалога

## Безопасность
- Отвечает только chat_id из `ALLOWED_CHAT_IDS` — чужие не тратят ваш API-баланс.
- Каждый запрос проверяется по заголовку `x-telegram-bot-api-secret-token`.
- Системный промпт кэшируется (`cache_control: ephemeral`) — повторные сообщения дешевле.
- История ограничена последними 20 парами реплик на чат.
