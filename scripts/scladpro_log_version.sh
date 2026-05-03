#!/bin/zsh
set -euo pipefail

BACKUP_NAME="${1:-}"
CHANGES="${2:-}"
LOCAL_CHECK="${3:-}"
DEPLOY_STATUS="${4:-}"

if [[ -z "$BACKUP_NAME" || -z "$CHANGES" || -z "$LOCAL_CHECK" || -z "$DEPLOY_STATUS" ]]; then
  echo "Usage: $0 \"<backup>\" \"<changes>\" \"<local check>\" \"<deploy status>\""
  exit 1
fi

LOG_FILE="/Users/alex/projects/source_code/backups/VERSIONS_LOG.md"
NOW="$(TZ=Europe/Moscow date '+%Y-%m-%d %H:%M')"

TASK_FILE="$HOME/Downloads/project_versions/$BACKUP_NAME/TASK.txt"
TASK_TEXT="(TASK.txt not found)"
if [[ -f "$TASK_FILE" ]]; then
  TASK_TEXT="$(tail -n +3 "$TASK_FILE" | tr '\n' ' ' | sed 's/|/-/g')"
fi

printf "| %s | %s | %s | %s | %s | %s |\n" \
  "$NOW" "$BACKUP_NAME" "$TASK_TEXT" "$CHANGES" "$LOCAL_CHECK" "$DEPLOY_STATUS" \
  >> "$LOG_FILE"

echo "Logged to $LOG_FILE"
