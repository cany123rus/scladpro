#!/usr/bin/env bash
# Always-on агент ScladPro для Mac Mini.
# Опрашивает очередь dev_tasks в Supabase и выполняет новые задачи через Claude Code
# (headless, claude -p) прямо в этом клоне репозитория: правки → сборка → деплой →
# git commit/push. Результат пишет обратно в задачу и шлёт в Telegram.
#
# Зависимости: bash, curl, jq, git, node/npm, claude (Claude Code CLI), firebase-tools.
# Конфиг — в файле .env рядом со скриптом (см. .env.example).

set -uo pipefail
cd "$(dirname "$0")"
[ -f .env ] && { set -a; . ./.env; set +a; }

: "${SUPABASE_URL:?нужен SUPABASE_URL в .env}"
: "${SUPABASE_SERVICE_KEY:?нужен SUPABASE_SERVICE_KEY в .env}"
: "${REPO_DIR:?нужен REPO_DIR в .env}"
POLL_SECONDS="${POLL_SECONDS:-20}"
BRANCH="${GIT_BRANCH:-master}"

api() { curl -s -H "apikey: $SUPABASE_SERVICE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" "$@"; }

notify() {
  [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ] || return 0
  curl -s -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
    -H 'Content-Type: application/json' \
    --data "$(jq -n --arg c "$TELEGRAM_CHAT_ID" --arg t "$1" '{chat_id:$c,text:$t}')" >/dev/null 2>&1 || true
}

set_task() { # id status result
  api -X PATCH "$SUPABASE_URL/rest/v1/dev_tasks?id=eq.$1" \
    -H 'Content-Type: application/json' -H 'Prefer: return=minimal' \
    --data "$(jq -n --arg s "$2" --arg r "$3" --arg u "$(date -u +%FT%TZ)" '{status:$s,result:$r,updated_at:$u}')" >/dev/null 2>&1
}

echo "[agent] start; repo=$REPO_DIR branch=$BRANCH poll=${POLL_SECONDS}s"
while true; do
  row="$(api "$SUPABASE_URL/rest/v1/dev_tasks?status=eq.new&order=created_at.asc&limit=1")"
  id="$(printf '%s' "$row" | jq -r '.[0].id // empty' 2>/dev/null)"
  if [ -z "$id" ]; then sleep "$POLL_SECONDS"; continue; fi
  text="$(printf '%s' "$row" | jq -r '.[0].text // ""' 2>/dev/null)"

  echo "[agent] task #$id: $text"
  set_task "$id" "in_progress" ""
  notify "⏳ Беру задачу #$id: $text"

  cd "$REPO_DIR" || { set_task "$id" "rejected" "REPO_DIR не найден: $REPO_DIR"; continue; }
  git pull --rebase --autostash origin "$BRANCH" >/dev/null 2>&1

  prompt="Задача из Telegram (#$id) для проекта ScladPro (этот репозиторий):

$text

Выполни задачу. Следуй CLAUDE.md. Если менялся фронт — обязательно: бамп public/sw.js (CACHE), npm run build, деплой (npx firebase-tools deploy --only hosting --non-interactive). После выполнения: git add -A && git commit && git push origin $BRANCH. В конце 1–3 строками отчитайся, что сделал и какая sw-версия."

  out="$(claude -p "$prompt" --permission-mode bypassPermissions --output-format text 2>&1)"
  code=$?
  result="$(printf '%s' "$out" | tail -c 1500)"
  [ -z "$result" ] && result="(пустой вывод, exit $code)"

  if [ $code -eq 0 ]; then
    set_task "$id" "done" "$result"
    notify "✅ #$id готово:
$result"
  else
    set_task "$id" "rejected" "Ошибка (exit $code):
$result"
    notify "🚫 #$id ошибка (exit $code):
$result"
  fi
  cd "$(dirname "$0")" 2>/dev/null || true
done
