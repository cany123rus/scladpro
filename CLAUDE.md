# ScladPro — контекст проекта для Claude

Краткое «несжимаемое ядро»: то, что нужно знать в любой новой сессии. Подробности — в
`SCLADPRO_WORKFLOW.md`, `SCLADSTATS_CONTEXT.md`, `WB_REPORT_ALGORITHM.md`, `YOUWARE.md`.

## Стек и деплой
- **Frontend:** React 18 + Vite 7 + TypeScript + Tailwind. БД/авторизация — **Supabase**.
- **Хостинг:** Firebase Hosting, проект `sclad-73d4a` → https://sclad-73d4a.web.app
- **Сборка/деплой:**
  ```
  npm run build
  npx firebase-tools deploy --only hosting --non-interactive
  ```
  На Windows перед билдом иногда нужно `Remove-Item -Recurse -Force dist` (блокировка папки).
- **Supabase project ref:** `blygwkxjogmioebutiwn`. MCP-сервер настроен в корневом `.mcp.json`
  (нужен `SUPABASE_ACCESS_TOKEN` в окружении).

## Архитектурные нюансы (важно!)
- **`src/pages/Dashboard.tsx` — монолит ~30 000 строк, ~458 useState.** Все вкладки —
  inline-блоки `{activeTab === 'X' && (...)}` с общим состоянием через замыкания. Выносить
  вкладки можно только по одной, с проверкой вживую (риск сломать). Уже вынесены лениво:
  WBProducts, WBSupplyManager, Tasks, WarehouseTab, AdvertisingInsights, **CamerasTab**.
- **FBO-паллеты:** иерархия Склад → Поставка → Паллета → Товары. Данные хранятся НЕ в
  отдельных таблицах, а как JSON-снапшот в `app_settings`, ключ `fbo_pallet_collection_v1`
  (типы `FboPallet*` в Dashboard.tsx). Удаление складов/поставок — физическое (вырезаются из JSON).
- **Ленивая загрузка / чанкинг** (`vite.config.ts`): `manualChunks` выносит только
  `vendor-react` и `vendor-supabase`. Тяжёлые либы (jspdf, exceljs) грузятся динамически
  через `ensurePdfLibs()` / `ensureExcel()` в Dashboard и через `loadExcel()` в utils —
  НЕ возвращать их в статические импорты. `bwip-js` отложить НЕЛЬЗЯ (синхронный рендер в ref).
- **sourcemap отключён** в проде (`vite.config.ts`).

## Дизайн-система
- Палитра: **slate** (не gray!) + акцент indigo/violet. Классы `oc-card`, `oc-input`,
  `oc-select`, `btn-primary/success/danger/ghost` в `src/index.css`.
- Модалки: единый стиль — фон `bg-slate-900/50 backdrop-blur-sm`, панель `rounded-3xl`,
  градиентная шапка с иконкой. Переиспользуемый `src/components/Modal.tsx`.
- Скелетоны загрузки: `src/components/Skeleton.tsx` (`PageSkeleton`, `SectionSkeleton`).
- Бэкап дизайна перед переделкой: папка `design-backup/*.bak` + git-коммит `716fac2`.

## ⚠️ Безопасность
**Этап 1 (СДЕЛАНО, 2026-06):**
- ✅ Демо-админ `admin@example.com`/`123456` удалён из `Login.tsx` (QR profiles-вход отключён, остался AUTH-токен).
- ✅ Пароль больше не пишется в localStorage — `src/utils/employeeStorage.ts` (`storeCurrentEmployee`/`sanitizeEmployeeForStorage`) применён во всех точках записи `current_employee` (Login.tsx ×3, Dashboard.tsx ×2). Старые сохранённые пароли затираются при следующей загрузке (Dashboard рефрешит из БД).

**Этап 2 (НЕ сделано, критично):**
1. **Пароли сотрудников в открытом виде** — `Login.tsx` сравнивает `.eq('password', ...)` (стр. ~236, ~336). Нужно хеширование (bcrypt/argon2) на сервере + Edge Function login на `service_role`.
2. **Таблицы `employees` и `app_settings` читаются анонимным ключом** (RLS открыт) — включая пароли. Закрыть RLS, перенести логин/чтение секретов в Edge Function.
3. Telegram-токены в `app_settings` / коде; токен старого бота утёк на GitHub (отозвать).
   ⚠️ Этап 2 рискованный: ломает прод-вход у всех при ошибке — делать поэтапно с тестом.

## Telegram-боты
- `supabase/functions/telegram-bot/` — приём файлов от поставщиков (токен → env `TELEGRAM_BOT_TOKEN`).
- `supabase/functions/claude-chat/` — бот-ассистент на Claude API (новый, см. его README).

## Прочее
- Бэкап БД при ручных правках через MCP: ключ-копия в `app_settings`
  (пример: `fbo_pallet_collection_v1__backup_20260605`).
- Backend `scladstats/backend` — Express API: CORS ограничен `ALLOWED_ORIGINS`, есть rate-limit.
