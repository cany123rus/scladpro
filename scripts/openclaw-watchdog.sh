#!/bin/zsh
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

LOG_FILE="$HOME/.openclaw/logs/watchdog.log"
mkdir -p "$(dirname "$LOG_FILE")"

TS="$(date '+%Y-%m-%d %H:%M:%S')"

if /opt/homebrew/bin/openclaw gateway status >/tmp/openclaw-watchdog-status.txt 2>&1; then
  if grep -q "Runtime: running" /tmp/openclaw-watchdog-status.txt; then
    echo "$TS OK: gateway running" >> "$LOG_FILE"
    exit 0
  fi
fi

echo "$TS WARN: gateway not running; attempting start" >> "$LOG_FILE"
/opt/homebrew/bin/openclaw gateway start >> "$LOG_FILE" 2>&1 || true
sleep 2

if /opt/homebrew/bin/openclaw gateway status >/tmp/openclaw-watchdog-status2.txt 2>&1 && grep -q "Runtime: running" /tmp/openclaw-watchdog-status2.txt; then
  echo "$TS RECOVERED: gateway started" >> "$LOG_FILE"
else
  echo "$TS ERROR: failed to recover gateway" >> "$LOG_FILE"
fi
