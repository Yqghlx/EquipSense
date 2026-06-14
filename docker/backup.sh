#!/bin/bash
# EquipSense 全量备份脚本 — PostgreSQL + Redis + Grafana 配置
#
# 用法：
#   手动执行：./backup.sh
#   定时备份：crontab -e → "0 2 * * * /path/to/backup.sh"（每天凌晨 2 点）
#
# 环境变量（从 .env 自动加载）：
#   PG_PASSWORD     数据库密码（必填）
#   PG_DB           数据库名（默认 equipai）
#   REDIS_PASSWORD  Redis 密码（可选，配置则备份 Redis）
#   BACKUP_DIR      备份目录（默认 ./backups）
#   RETAIN_DAYS     保留天数（默认 7）
#   BACKUP_REDIS    是否备份 Redis（默认 true）
#   S3_SYNC         是否同步到 S3/OSS（默认 false）
#   S3_BUCKET       S3/OSS 桶地址（如 s3://my-bucket/backups/）
#   BACKUP_WEBHOOK  备份完成通知 webhook（可选）

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 从 .env 加载
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
BACKUP_REDIS="${BACKUP_REDIS:-true}"

if [ -z "${PG_PASSWORD:-}" ]; then
  echo "[FATAL] PG_PASSWORD 未设置" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_SUCCESS=true
declare -a BACKUP_FILES

echo "=========================================="
echo "EquipSense 备份开始: $TIMESTAMP"
echo "=========================================="

# ============================================================
# 1. PostgreSQL 备份
# ============================================================
PG_FILE="$BACKUP_DIR/${PG_DB}_${TIMESTAMP}.sql.gz"
echo "[1/3] 备份 PostgreSQL ($PG_DB)..."
if PGPASSWORD="$PG_PASSWORD" pg_dump \
  -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d "$PG_DB" \
  --format=plain --no-owner --no-privileges \
  | gzip > "$PG_FILE"; then

  # 完整性校验（gzip -t 测试压缩文件是否损坏）
  if gzip -t "$PG_FILE" 2>/dev/null; then
    SIZE=$(du -h "$PG_FILE" | cut -f1)
    echo "  ✓ PostgreSQL 备份成功: $PG_FILE ($SIZE)"
    BACKUP_FILES+=("$PG_FILE")
  else
    echo "  ✗ PostgreSQL 备份损坏，gzip -t 校验失败"
    rm -f "$PG_FILE"
    BACKUP_SUCCESS=false
  fi
else
  echo "  ✗ PostgreSQL 备份失败"
  BACKUP_SUCCESS=false
fi

# ============================================================
# 2. Redis 备份（可选）
# ============================================================
if [ "$BACKUP_REDIS" = "true" ] && [ -n "${REDIS_PASSWORD:-}" ]; then
  REDIS_FILE="$BACKUP_DIR/redis_${TIMESTAMP}.rdb"
  echo "[2/3] 备份 Redis..."

  # 触发 BGSAVE 后复制 RDB 文件（需要 docker exec 访问 Redis 容器）
  if docker exec equipai-redis redis-cli -a "$REDIS_PASSWORD" BGSAVE >/dev/null 2>&1; then
    sleep 2  # 等待 BGSAVE 完成
    if docker cp equipai-redis:/data/dump.rdb "$REDIS_FILE" 2>/dev/null; then
      SIZE=$(du -h "$REDIS_FILE" | cut -f1)
      echo "  ✓ Redis 备份成功: $REDIS_FILE ($SIZE)"
      BACKUP_FILES+=("$REDIS_FILE")
    else
      echo "  ✗ Redis RDB 复制失败（容器未运行？）"
    fi
  else
    echo "  ⚠ Redis BGSAVE 失败，跳过（非关键数据）"
  fi
else
  echo "[2/3] Redis 备份已跳过（未配置 REDIS_PASSWORD 或 BACKUP_REDIS=false）"
fi

# ============================================================
# 3. Grafana 仪表盘配置（已版本化在 git，可选导出用户自定义部分）
# ============================================================
echo "[3/3] Grafana 配置已在 git 版本管理（docker/grafana/provisioning/），无需单独备份"

# ============================================================
# 清理过期备份
# ============================================================
echo ""
echo "清理 $RETAIN_DAYS 天前的旧备份..."
find "$BACKUP_DIR" -name "${PG_DB}_*.sql.gz" -mtime +$RETAIN_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "redis_*.rdb" -mtime +$RETAIN_DAYS -delete 2>/dev/null || true

# ============================================================
# 异地同步（S3/OSS，可选）
# ============================================================
if [ "${S3_SYNC:-false}" = "true" ] && [ -n "${S3_BUCKET:-}" ]; then
  echo ""
  echo "同步到 S3/OSS: $S3_BUCKET"
  if command -v aws >/dev/null 2>&1; then
    aws s3 sync "$BACKUP_DIR" "$S3_BUCKET" --exclude "*" --include "*.sql.gz" --include "*.rdb"
    echo "  ✓ S3 同步完成"
  else
    echo "  ⚠ aws-cli 未安装，跳过 S3 同步"
  fi
fi

# ============================================================
# 通知（webhook，可选）
# ============================================================
if [ -n "${BACKUP_WEBHOOK:-}" ]; then
  if [ "$BACKUP_SUCCESS" = "true" ]; then
    MSG="✅ EquipSense 备份成功（${#BACKUP_FILES[@]} 个文件）"
  else
    MSG="❌ EquipSense 备份失败，请检查日志"
  fi
  curl -s -X POST "$BACKUP_WEBHOOK" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"$MSG\"}" >/dev/null 2>&1 || true
fi

echo ""
echo "=========================================="
if [ "$BACKUP_SUCCESS" = "true" ]; then
  echo "备份全部完成: ${BACKUP_FILES[*]}"
  echo "=========================================="
  exit 0
else
  echo "备份部分失败，请检查上方日志"
  echo "=========================================="
  exit 1
fi

