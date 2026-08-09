#!/bin/bash
# EquipSense 全量备份脚本 — PostgreSQL + 工单附件 + Redis + Grafana 配置
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
#   BACKUP_ATTACHMENTS  是否备份工单附件（默认 true）
#   ATTACHMENTS_CONTAINER  附件所在容器（默认 equipai-backend）
#   ATTACHMENTS_PATH  容器内附件目录（默认 /app/uploads）
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
BACKUP_ATTACHMENTS="${BACKUP_ATTACHMENTS:-true}"
ATTACHMENTS_CONTAINER="${ATTACHMENTS_CONTAINER:-equipai-backend}"
ATTACHMENTS_PATH="${ATTACHMENTS_PATH:-/app/uploads}"

# 相对路径始终相对于 docker/ 目录，避免从仓库根目录和定时任务执行时产生两套备份目录。
case "$BACKUP_DIR" in
  /*)
    ;;
  *)
    BACKUP_DIR="$SCRIPT_DIR/$BACKUP_DIR"
    ;;
esac

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
# 关键设计：用 docker exec 在 postgres 容器内执行 pg_dump
# 原因：生产部署只装 Docker，主机没装 pg_dump 客户端工具
# （v1.4 修复：之前用主机 pg_dump 导致备份无声失败）
PG_CONTAINER="${PG_CONTAINER:-equipai-postgres}"
PG_FILE="$BACKUP_DIR/${PG_DB}_${TIMESTAMP}.sql.gz"
echo "[1/4] 备份 PostgreSQL ($PG_DB) via docker exec..."

# 检查容器是否运行（避免容器停了还在尝试备份）
if ! docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
  echo "  ✗ PostgreSQL 容器 $PG_CONTAINER 未运行，跳过备份"
  BACKUP_SUCCESS=false
else
  # 在容器内执行 pg_dump，输出通过管道 gzip 压缩
  # PGPASSWORD 通过 -e 传入容器环境，避免进程列表泄露
  if docker exec -e PGPASSWORD="$PG_PASSWORD" "$PG_CONTAINER" \
    pg_dump -U "$PG_USER" -d "$PG_DB" \
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
fi

# ============================================================
# 2. 工单附件备份（默认启用）
# ============================================================
if [ "$BACKUP_ATTACHMENTS" = "true" ]; then
  ATTACHMENTS_FILE="$BACKUP_DIR/attachments_${TIMESTAMP}.tar.gz"
  ATTACHMENTS_TEMP_DIR=""
  echo "[2/4] 备份工单附件 ($ATTACHMENTS_PATH) via docker cp..."

  if ! docker ps --format '{{.Names}}' | grep -q "^${ATTACHMENTS_CONTAINER}$"; then
    echo "  ✗ 附件容器 $ATTACHMENTS_CONTAINER 未运行，无法完成全量备份"
    BACKUP_SUCCESS=false
  else
    ATTACHMENTS_TEMP_DIR=$(mktemp -d "$BACKUP_DIR/.attachments.XXXXXX")
    if docker cp "$ATTACHMENTS_CONTAINER:$ATTACHMENTS_PATH/." "$ATTACHMENTS_TEMP_DIR/"; then
      if tar -C "$ATTACHMENTS_TEMP_DIR" -czf "$ATTACHMENTS_FILE" . \
        && tar -tzf "$ATTACHMENTS_FILE" >/dev/null 2>&1; then
        SIZE=$(du -h "$ATTACHMENTS_FILE" | cut -f1)
        echo "  ✓ 工单附件备份成功: $ATTACHMENTS_FILE ($SIZE)"
        BACKUP_FILES+=("$ATTACHMENTS_FILE")
      else
        echo "  ✗ 工单附件归档损坏，tar -tzf 校验失败"
        rm -f "$ATTACHMENTS_FILE"
        BACKUP_SUCCESS=false
      fi
    else
      echo "  ✗ 工单附件复制失败（容器路径或权限可能不正确）"
      BACKUP_SUCCESS=false
    fi
    rm -rf "$ATTACHMENTS_TEMP_DIR"
  fi
else
  echo "[2/4] 工单附件备份已跳过（BACKUP_ATTACHMENTS=false）"
fi

# ============================================================
# 3. Redis 备份（可选）
# ============================================================
if [ "$BACKUP_REDIS" = "true" ] && [ -n "${REDIS_PASSWORD:-}" ]; then
  REDIS_FILE="$BACKUP_DIR/redis_${TIMESTAMP}.rdb"
  echo "[3/4] 备份 Redis..."

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
  echo "[3/4] Redis 备份已跳过（未配置 REDIS_PASSWORD 或 BACKUP_REDIS=false）"
fi

# ============================================================
# 4. Grafana 仪表盘配置（已版本化在 git，可选导出用户自定义部分）
# ============================================================
echo "[4/4] Grafana 配置已在 git 版本管理（docker/grafana/provisioning/），无需单独备份"

# ============================================================
# 清理过期备份
# ============================================================
echo ""
echo "清理 $RETAIN_DAYS 天前的旧备份..."
find "$BACKUP_DIR" -name "${PG_DB}_*.sql.gz" -mtime +$RETAIN_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "redis_*.rdb" -mtime +$RETAIN_DAYS -delete 2>/dev/null || true
find "$BACKUP_DIR" -name "attachments_*.tar.gz" -mtime +$RETAIN_DAYS -delete 2>/dev/null || true

# ============================================================
# 异地同步（S3/OSS，可选）
# ============================================================
if [[ "${S3_SYNC:-false}" =~ ^([Tt][Rr][Uu][Ee]|1)$ ]]; then
  echo ""
  echo "同步到 S3/OSS: ${S3_BUCKET:-<未配置>}"
  if [ -z "${S3_BUCKET:-}" ]; then
    echo "  ✗ S3_SYNC 已开启，但 S3_BUCKET 未配置" >&2
    BACKUP_SUCCESS=false
  elif ! command -v aws >/dev/null 2>&1; then
    echo "  ✗ S3_SYNC 已开启，但主机未安装 aws-cli" >&2
    BACKUP_SUCCESS=false
  elif aws s3 sync "$BACKUP_DIR" "$S3_BUCKET" \
    --exclude "*" --include "*.sql.gz" --include "*.rdb" --include "attachments_*.tar.gz"; then
    echo "  ✓ S3 同步完成"
  else
    echo "  ✗ S3 同步失败" >&2
    BACKUP_SUCCESS=false
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
