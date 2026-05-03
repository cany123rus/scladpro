# ScladSTATS

MVP аналитики Wildberries (API-only).

## Структура
- `backend/` — API + агрегации
- `worker/` — фоновые синки WB
- `frontend/` — интерфейс дашборда
- `infra/` — SQL миграции и инфраструктурные файлы

## Быстрый старт (локально)
1. Подними PostgreSQL
2. Прогони `infra/001_init.sql`
3. Настрой `.env` для backend и worker
4. Запусти backend и worker

## Этапы (текущий)
- [x] Скелет проекта
- [x] Базовый SQL каркас
- [x] Заглушки API endpoints
- [ ] Реальный WB client + sync
- [ ] Dashboard UI
