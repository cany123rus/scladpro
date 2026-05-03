#!/bin/zsh
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

TASK_TEXT="${1:-}"
if [[ -z "$TASK_TEXT" ]]; then
  echo "Usage: $0 \"<task text>\""
  exit 1
fi

TS="$(date +%Y-%m-%d_%H-%M-%S)"
BACKUP_NAME="source_code_2_${TS}"
BASE_DIR="$HOME/Downloads/project_versions"
DEST_DIR="$BASE_DIR/$BACKUP_NAME"
SRC_DIR="/Users/alex/projects/source_code"

mkdir -p "$BASE_DIR"

rsync -a \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '.openclaw' \
  --exclude '*.log' \
  "$SRC_DIR/" "$DEST_DIR/"

cat > "$DEST_DIR/TASK.txt" <<TXT
Timestamp: $(date '+%Y-%m-%d %H:%M:%S %Z')
Task:
$TASK_TEXT
TXT

echo "$BACKUP_NAME"
