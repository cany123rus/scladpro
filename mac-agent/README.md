# mac-agent — всегда-включённый агент ScladPro на Mac Mini

Mac постоянно опрашивает очередь `dev_tasks` (её наполняет Telegram-бот `dev-tasks-bot`)
и выполняет новые задачи через **Claude Code в headless-режиме** прямо в клоне репозитория:
правки → сборка → деплой → `git commit/push`. Результат пишется в задачу и шлётся в Telegram.

```
Telegram → dev-tasks-bot → dev_tasks(new)
                               ↓ (опрос каждые N сек)
                     Mac: run-agent.sh → claude -p → правки+build+deploy+push
                               ↓
                     dev_tasks(done/result) → уведомление в Telegram, /list
```

## Установка на Mac (один раз)

1. **Инструменты** (Terminal):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"  # если нет Homebrew
   brew install git jq node
   npm i -g @anthropic-ai/claude-code firebase-tools
   ```
2. **Клон репозитория и зависимости**:
   ```bash
   cd ~ && git clone https://github.com/cany123rus/scladpro.git
   cd scladpro && npm install
   ```
3. **Авторизация**:
   - Claude Code: запусти `claude` один раз и войди (подписка) ИЛИ задай `ANTHROPIC_API_KEY` в `.env`.
   - Firebase: `firebase login` (или CI-токен) — чтобы агент мог деплоить.
   - Git push: настрой доступ к GitHub (`gh auth login` или ssh/PAT), чтобы пуш проходил без запроса пароля.
4. **Конфиг**:
   ```bash
   cd ~/scladpro/mac-agent
   cp .env.example .env
   nano .env   # впиши SUPABASE_SERVICE_KEY, REPO_DIR=/Users/ИМЯ/scladpro, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
   chmod +x run-agent.sh
   ```
   `SUPABASE_SERVICE_KEY` — Supabase → Project Settings → API → **service_role** (секрет, только на Mac).

5. **Тест вручную** (прежде чем ставить в автозапуск):
   ```bash
   ./run-agent.sh
   ```
   Пришли боту тестовую задачу — в консоли увидишь, как агент её берёт. Ctrl+C для остановки.

6. **Автозапуск (launchd)** — чтобы крутился всегда и сам перезапускался:
   ```bash
   sed -i '' "s#/Users/ИМЯ#$HOME#g" com.scladpro.agent.plist   # подставит твой путь
   cp com.scladpro.agent.plist ~/Library/LaunchAgents/
   launchctl load ~/Library/LaunchAgents/com.scladpro.agent.plist
   ```
   Логи: `mac-agent/agent.log` и `agent.err.log`.
   Остановить: `launchctl unload ~/Library/LaunchAgents/com.scladpro.agent.plist`.

## Дисциплина двух машин
Источник истины — GitHub (`master`). Агент на Mac коммитит+пушит каждую правку.
На Windows-ПК перед любыми ручными изменениями делай `git pull`, иначе правки разъедутся.

## Безопасность
- `.env` с `service_role`-ключом и токенами — только локально, в git НЕ попадает.
- Агент работает автономно (`--permission-mode bypassPermissions`) и сам деплоит прод.
  Контроль — через `/list` в боте и историю коммитов на GitHub.
