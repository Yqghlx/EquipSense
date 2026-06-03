#!/bin/bash
# PostgreSQL 自动备份脚本
# 用法：
#   手动执行：./backup.sh
#   定时备份：crontab -e → 添加 "0 2 * * * /path/to/backup.sh"（每天凌晨 2 点）
#
# 环境变量（可从 .env 文件自动加载）：
#   PG_PASSWORD — 数据库密码（必填）
#   PG_USER     — 数据库用户（默认 postgres）
#   PG_DB       — 数据库名（默认 equipai）
#   PG_HOST     — 数据库主机（默认 localhost）
#   PG_PORT     — 数据库端口（默认 5432）
#   BACKUP_DIR  — 备份存储目录（默认 ./backups）
#   RETAIN_DAYS — 备份保留天数（默认 7）

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 从 .env 文件加载环境变量
if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  source "$SCRIPT_DIR/.env"
  set +a
fi

PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
PG_USER="${PG_USER:-postgres}"
PG_DB="${PG_DB:-equipai}"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
RETAIN_DAYS="${RETAIN_DAYS:-7}"

if [ -z "${PG_PASSWORD:-}" ]; then
  echo "错误：PG_PASSWORD 未设置，请在 .env 文件中配置" >&2
  exit 1
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 备份文件名（含时间戳）
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${PG_DB}_${TIMESTAMP}.sql.gz"

echo "开始备份数据库 $PG_DB ..."

# 执行 pg_dump 并压缩
PGPASSWORD="$PG_PASSWORD" pg_dump \
  -h "$PG_HOST" \
  -p "$PG_PORT" \
  -U "$PG_USER" \
  -d "$PG_DB" \
  --format=plain \
  --no-owner \
  --no-privileges \
  | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "备份完成：$BACKUP_FILE ($BACKUP_SIZE)"

# 清理过期备份
echo "清理 $RETAIN_DAYS 天前的旧备份..."
find "$BACKUP_DIR" -name "${PG_DB}_*.sql.gz" -mtime +$RETAIN_DAYS -delete
echo "备份脚本执行完毕"
