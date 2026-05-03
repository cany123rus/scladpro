# ScladSTATS — быстрый контекст для продолжения

Дата фиксации: 2026-02-16

## Что уже сделано
- Создан модуль `scladstats/` с подсистемами:
  - `backend/` (Express API)
  - `worker/` (сбор данных)
  - `frontend/` (базовый UI)
  - `infra/` (SQL миграции)
- Реализованы базовые API:
  - `/api/v1/dashboard/*`
  - `/api/v1/products/*`
  - `/api/v1/stocks/risk`
  - `/api/v1/alerts/*`
  - `/api/v1/sync/run`
- Реализован Market Intelligence каркас:
  - `/api/v1/market/products`
  - `/api/v1/market/products/:nmId/history`
  - `/api/v1/market/niches`
  - `/api/v1/market/opportunities`
  - `/api/v1/market/status`
- Созданы миграции:
  - `infra/001_init.sql`
  - `infra/002_market_intelligence.sql`
- Worker:
  - `syncSales` (аккаунтные данные WB)
  - `syncMarketQueries` (market-wide сбор по ключам)
- UI на `http://127.0.0.1:4010/` показывает базовые виджеты и поиск.

## Текущее ограничение
- Публичные WB endpoint'ы периодически дают `429 Too Many Requests`, из-за чего поиск по части артикулов может возвращать пусто.
- Официальный WB API покрывает в основном данные своего кабинета, не полный рынок.

## Что планировалось дальше
1. Подключить PostgreSQL и прогнать миграции `001 + 002`.
2. Добавить устойчивость market-сбора: retry/backoff, кэш, очередь.
3. Доработать скоринг ниш: trend/competition/entry barrier.
4. Довести UI до полноценного экрана opportunities.
5. При необходимости подключить внешний провайдер рыночных данных.

## Быстрый запуск (локально)
- Backend:
  - `cd scladstats/backend`
  - `npm install`
  - `npm run dev`
- Worker:
  - `cd scladstats/worker`
  - `npm install`
  - заполнить `.env` (`WB_API_TOKEN`, `WB_ACCOUNT_ID`, `DATABASE_URL`)
  - `npm run dev`

## Важные файлы
- `scladstats/backend/src/routes/market.js`
- `scladstats/worker/src/jobs/syncMarket.js`
- `scladstats/worker/src/wbClient.js`
- `scladstats/infra/001_init.sql`
- `scladstats/infra/002_market_intelligence.sql`
