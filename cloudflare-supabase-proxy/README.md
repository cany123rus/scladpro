# Supabase proxy (Cloudflare Worker) — обход блокировки в РФ

Домен `*.supabase.co` в России часто режут → сайт не грузит данные без VPN.
Этот Worker живёт на **твоём** домене (Cloudflare) и прозрачно форвардит всё на
Supabase: REST, Auth, Storage, Functions и Realtime (websocket). На фронте
меняем только `VITE_SUPABASE_URL`.

## Шаги

### Вариант A — через дашборд Cloudflare (без CLI)
1. Cloudflare → **Workers & Pages** → **Create** → **Create Worker**.
2. Имя: `supabase-proxy` → Deploy.
3. **Edit code** → вставь содержимое `src/worker.js` → Deploy.
4. Worker → **Settings → Variables** → добавь переменную
   `UPSTREAM = https://blygwkxjogmioebutiwn.supabase.co`.
5. Worker → **Settings → Domains & Routes** → **Add Custom Domain** →
   `sb.ТВОЙДОМЕН.ru` (поддомен на твоём домене в Cloudflare).
   Cloudflare сам создаст DNS-запись и выдаст SSL.

### Вариант B — через CLI (wrangler)
```bash
cd cloudflare-supabase-proxy
npx wrangler login
# раскомментируй routes в wrangler.toml и впиши свой домен/зону
npx wrangler deploy
```

## После деплоя — проверка
```bash
curl -s https://sb.ТВОЙДОМЕН.ru/auth/v1/health
# должен вернуть JSON от GoTrue (а не ошибку CF)
```

## Переключить фронт на прокси
Создай `.env.production` в корне проекта (или задай переменную в окружении сборки):

```
VITE_SUPABASE_URL=https://sb.ТВОЙДОМЕН.ru
VITE_SUPABASE_ANON_KEY=<тот же публичный ключ>
```

Пересобери и задеплой сайт. supabase-js сам построит и Realtime-URL
(`wss://sb.ТВОЙДОМЕН.ru/realtime/v1/...`) из этого домена.

## Откат
Вернуть `VITE_SUPABASE_URL` на `https://blygwkxjogmioebutiwn.supabase.co`,
пересобрать. Worker можно оставить — он не мешает.
