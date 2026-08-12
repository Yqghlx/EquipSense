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
#   REDIS_CONTAINER  Redis 容器名（默认 equipai-redis）
#   FILE_STORAGE_PROVIDER  附件存储实现（默认 Local）
#   FILE_STORAGE_S3_BUCKET / FILE_STORAGE_S3_REGION / FILE_STORAGE_S3_ENDPOINT
#   FILE_STORAGE_S3_ACCESS_KEY / FILE_STORAGE_S3_SECRET_KEY / FILE_STORAGE_S3_KEY_PREFIX
#   S3_SYNC         是否同步到 S3/OSS（默认 false）
#   S3_BUCKET       S3/OSS 桶地址（如 s3://my-bucket/backups/）
#   BACKUP_WEBHOOK  备份完成通知 webhook（可选）

set -euo pipefail
# 数据库和附件备份包含敏感业务数据；不要依赖调用方的 umask，默认只允许当前用户读取。
umask 077

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

read_env_value() {
  local key="$1"
  local line
  if [ -f "$ENV_FILE" ]; then
    line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 || true)"
  else
    line=""
  fi
  printf '%s' "${line#*=}"
}

env_value() {
  local key="$1"
  local value
  value="$(read_env_value "$key")"
  if [ -n "$value" ]; then
    printf '%s' "$value"
  else
    printf '%s' "${!key:-}"
  fi
}

PG_PASSWORD="$(env_value PG_PASSWORD)"
REDIS_PASSWORD="$(env_value REDIS_PASSWORD)"
PG_HOST="$(env_value PG_HOST)"; PG_HOST="${PG_HOST:-localhost}"
PG_PORT="$(env_value PG_PORT)"; PG_PORT="${PG_PORT:-5432}"
PG_USER="$(env_value PG_USER)"; PG_USER="${PG_USER:-postgres}"
PG_DB="$(env_value PG_DB)"; PG_DB="${PG_DB:-equipai}"
BACKUP_DIR="$(env_value BACKUP_DIR)"; BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/backups}"
RETAIN_DAYS="$(env_value RETAIN_DAYS)"; RETAIN_DAYS="${RETAIN_DAYS:-7}"
BACKUP_REDIS="$(env_value BACKUP_REDIS)"; BACKUP_REDIS="${BACKUP_REDIS:-true}"
BACKUP_ATTACHMENTS="$(env_value BACKUP_ATTACHMENTS)"; BACKUP_ATTACHMENTS="${BACKUP_ATTACHMENTS:-true}"
ATTACHMENTS_CONTAINER="$(env_value ATTACHMENTS_CONTAINER)"; ATTACHMENTS_CONTAINER="${ATTACHMENTS_CONTAINER:-equipai-backend}"
ATTACHMENTS_PATH="$(env_value ATTACHMENTS_PATH)"; ATTACHMENTS_PATH="${ATTACHMENTS_PATH:-/app/uploads}"
FILE_STORAGE_PROVIDER="$(env_value FILE_STORAGE_PROVIDER)"; FILE_STORAGE_PROVIDER="${FILE_STORAGE_PROVIDER:-Local}"
FILE_STORAGE_S3_BUCKET="$(env_value FILE_STORAGE_S3_BUCKET)"
FILE_STORAGE_S3_REGION="$(env_value FILE_STORAGE_S3_REGION)"; FILE_STORAGE_S3_REGION="${FILE_STORAGE_S3_REGION:-us-east-1}"
FILE_STORAGE_S3_ENDPOINT="$(env_value FILE_STORAGE_S3_ENDPOINT)"
FILE_STORAGE_S3_ACCESS_KEY="$(env_value FILE_STORAGE_S3_ACCESS_KEY)"
FILE_STORAGE_S3_SECRET_KEY="$(env_value FILE_STORAGE_S3_SECRET_KEY)"
FILE_STORAGE_S3_KEY_PREFIX="$(env_value FILE_STORAGE_S3_KEY_PREFIX)"; FILE_STORAGE_S3_KEY_PREFIX="${FILE_STORAGE_S3_KEY_PREFIX:-attachments}"
PG_CONTAINER="$(env_value PG_CONTAINER)"; PG_CONTAINER="${PG_CONTAINER:-equipai-postgres}"
REDIS_CONTAINER="$(env_value REDIS_CONTAINER)"; REDIS_CONTAINER="${REDIS_CONTAINER:-equipai-redis}"
S3_SYNC="$(env_value S3_SYNC)"; S3_SYNC="${S3_SYNC:-false}"
S3_BUCKET="$(env_value S3_BUCKET)"
BACKUP_WEBHOOK="$(env_value BACKUP_WEBHOOK)"

PG_FILE=""
ATTACHMENTS_FILE=""
REDIS_FILE=""
MANIFEST_FILE=""

if command -v sha256sum >/dev/null 2>&1; then
  SHA256_TOOL="sha256sum"
elif command -v shasum >/dev/null 2>&1; then
  SHA256_TOOL="shasum"
else
  echo "[FATAL] 生成备份批次清单需要 sha256sum 或 shasum" >&2
  exit 1
fi

sha256_file() {
  if [ "$SHA256_TOOL" = "sha256sum" ]; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

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

if [ -n "${BACKUP_WEBHOOK:-}" ]; then
  case "$BACKUP_WEBHOOK" in
    http://*|https://*)
      ;;
    *)
      echo "[FATAL] BACKUP_WEBHOOK 必须使用 http:// 或 https://" >&2
      exit 1
      ;;
  esac
  if [[ "$BACKUP_WEBHOOK" == *$'\n'* || "$BACKUP_WEBHOOK" == *$'\r'* ]]; then
    echo "[FATAL] BACKUP_WEBHOOK 含有不安全换行字符" >&2
    exit 1
  fi
fi

# 保留策略属于备份正确性的一部分；配置错误时必须在创建备份前失败，
# 不能让 find 的清理错误被后面的 `|| true` 吞掉后仍报告成功。
if ! [[ "$RETAIN_DAYS" =~ ^[1-9][0-9]*$ ]]; then
  echo "[FATAL] RETAIN_DAYS 必须是大于 0 的整数" >&2
  exit 1
fi

# 默认启用 Redis 备份时，缺少密码意味着无法证明 RDB 是完整快照，必须拒绝继续。
if [ "$BACKUP_REDIS" = "true" ] && [ -z "${REDIS_PASSWORD:-}" ]; then
  echo "[FATAL] BACKUP_REDIS=true 但 REDIS_PASSWORD 未设置；如需跳过 Redis 备份请显式设置 BACKUP_REDIS=false" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# 定时任务可能因上一次备份变慢而重叠；并发执行会同时导出、清理和同步同一目录，
# 造成远端副本不可预测。使用原子 mkdir 获取跨平台锁，遗留锁必须由运维确认后清理，
# 不能自动删除并假定持锁进程已经死亡。
BACKUP_LOCK_DIR="$BACKUP_DIR/.backup.lock"
if ! mkdir "$BACKUP_LOCK_DIR" 2>/dev/null; then
  lock_pid="$(cat "$BACKUP_LOCK_DIR/pid" 2>/dev/null || true)"
  if [ -n "$lock_pid" ]; then
    echo "[FATAL] 已有备份任务正在运行或遗留锁（PID ${lock_pid}），请确认后再处理 $BACKUP_LOCK_DIR" >&2
  else
    echo "[FATAL] 已有备份任务正在运行或遗留锁，请确认后再处理 $BACKUP_LOCK_DIR" >&2
  fi
  exit 1
fi

release_backup_lock() {
  rm -f "$BACKUP_LOCK_DIR/pid" 2>/dev/null || true
  rmdir "$BACKUP_LOCK_DIR" 2>/dev/null || true
}
trap release_backup_lock EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
printf '%s\n' "$$" > "$BACKUP_LOCK_DIR/pid"
chmod 600 "$BACKUP_LOCK_DIR/pid"

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
PG_FILE="$BACKUP_DIR/${PG_DB}_${TIMESTAMP}.dump"
echo "[1/4] 备份 PostgreSQL ($PG_DB) via docker exec..."

# 检查容器是否运行（避免容器停了还在尝试备份）
if ! docker ps --format '{{.Names}}' | grep -q "^${PG_CONTAINER}$"; then
  echo "  ✗ PostgreSQL 容器 $PG_CONTAINER 未运行，跳过备份"
  BACKUP_SUCCESS=false
else
  # 使用 PostgreSQL custom format。它自带压缩，并保留 pg_restore 的对象依赖信息，
  # 这样 TimescaleDB 的 catalog、hypertable 和 chunk 可以按正确顺序恢复。
  # 密码通过标准输入交给容器内的临时 shell，再导出给 pg_dump；不能使用 docker exec -e，
  # 因为 -e 的完整参数可能出现在宿主机进程列表或审计日志中。
  if printf '%s\n' "$PG_PASSWORD" | docker exec -i "$PG_CONTAINER" sh -c '
    IFS= read -r PGPASSWORD
    export PGPASSWORD
    exec pg_dump -U "$1" -d "$2" \
      --format=custom \
      --no-owner --no-privileges
  ' sh "$PG_USER" "$PG_DB" > "$PG_FILE"; then

    # 完整性校验必须在数据库容器内执行，避免生产主机还需要安装 pg_restore。
    # pg_restore 在未提供归档文件名时从标准输入读取；显式传入 `-` 会被当作真实文件名，
    # 在官方 PostgreSQL 镜像中会直接报“could not open input file -”，导致有效备份被误判为损坏。
    if docker exec -i "$PG_CONTAINER" pg_restore --list < "$PG_FILE" >/dev/null 2>&1; then
      chmod 600 "$PG_FILE"
      SIZE=$(du -h "$PG_FILE" | cut -f1)
      echo "  ✓ PostgreSQL 备份成功: $PG_FILE ($SIZE)"
      BACKUP_FILES+=("$PG_FILE")
    else
      echo "  ✗ PostgreSQL custom 备份校验失败，pg_restore --list 无法读取"
      rm -f "$PG_FILE"
      BACKUP_SUCCESS=false
    fi
  else
    echo "  ✗ PostgreSQL 备份失败"
    rm -f "$PG_FILE"
    BACKUP_SUCCESS=false
  fi
fi

# ============================================================
# 2. 工单附件备份（默认启用）
# ============================================================
if [ "$BACKUP_ATTACHMENTS" = "true" ]; then
  ATTACHMENTS_FILE="$BACKUP_DIR/attachments_${TIMESTAMP}.tar.gz"
  ATTACHMENTS_TEMP_DIR=""
  if [[ "$FILE_STORAGE_PROVIDER" =~ ^([Ss][3]|[Ss]3)$ ]]; then
    echo "[2/4] 备份 S3 工单附件 (s3://${FILE_STORAGE_S3_BUCKET}/${FILE_STORAGE_S3_KEY_PREFIX}/)..."
    if [ -z "$FILE_STORAGE_S3_BUCKET" ]; then
      echo "  ✗ FILE_STORAGE_PROVIDER=S3 但 FILE_STORAGE_S3_BUCKET 未配置"
      BACKUP_SUCCESS=false
    elif ! command -v aws >/dev/null 2>&1; then
      echo "  ✗ S3 附件备份需要主机安装 aws-cli"
      BACKUP_SUCCESS=false
    else
      ATTACHMENTS_TEMP_DIR=$(mktemp -d "$BACKUP_DIR/.attachments.XXXXXX")
      if [ -n "$FILE_STORAGE_S3_ACCESS_KEY" ] && [ -n "$FILE_STORAGE_S3_SECRET_KEY" ]; then
        export AWS_ACCESS_KEY_ID="$FILE_STORAGE_S3_ACCESS_KEY"
        export AWS_SECRET_ACCESS_KEY="$FILE_STORAGE_S3_SECRET_KEY"
      fi
      export AWS_DEFAULT_REGION="$FILE_STORAGE_S3_REGION"
      S3_STORAGE_ARGS=()
      if [ -n "$FILE_STORAGE_S3_ENDPOINT" ]; then
        S3_STORAGE_ARGS+=(--endpoint-url "$FILE_STORAGE_S3_ENDPOINT")
      fi
      storage_source="s3://${FILE_STORAGE_S3_BUCKET}/${FILE_STORAGE_S3_KEY_PREFIX#/}"
      if aws s3 sync "$storage_source" "$ATTACHMENTS_TEMP_DIR/" --no-progress "${S3_STORAGE_ARGS[@]}"; then
        if tar -C "$ATTACHMENTS_TEMP_DIR" -czf "$ATTACHMENTS_FILE" . \
          && tar -tzf "$ATTACHMENTS_FILE" >/dev/null 2>&1; then
          chmod 600 "$ATTACHMENTS_FILE"
          SIZE=$(du -h "$ATTACHMENTS_FILE" | cut -f1)
          echo "  ✓ S3 工单附件备份成功: $ATTACHMENTS_FILE ($SIZE)"
          BACKUP_FILES+=("$ATTACHMENTS_FILE")
        else
          echo "  ✗ S3 工单附件归档损坏，tar -tzf 校验失败"
          rm -f "$ATTACHMENTS_FILE"
          BACKUP_SUCCESS=false
        fi
      else
        echo "  ✗ S3 工单附件同步失败"
        BACKUP_SUCCESS=false
      fi
      rm -rf "$ATTACHMENTS_TEMP_DIR"
    fi
  elif [[ "$FILE_STORAGE_PROVIDER" =~ ^([Ll][Oo][Cc][Aa][Ll])$ ]]; then
    echo "[2/4] 备份工单附件 ($ATTACHMENTS_PATH) via docker cp..."

    if ! docker ps --format '{{.Names}}' | grep -q "^${ATTACHMENTS_CONTAINER}$"; then
      echo "  ✗ 附件容器 $ATTACHMENTS_CONTAINER 未运行，无法完成全量备份"
      BACKUP_SUCCESS=false
    else
      ATTACHMENTS_TEMP_DIR=$(mktemp -d "$BACKUP_DIR/.attachments.XXXXXX")
      if docker cp "$ATTACHMENTS_CONTAINER:$ATTACHMENTS_PATH/." "$ATTACHMENTS_TEMP_DIR/"; then
        if tar -C "$ATTACHMENTS_TEMP_DIR" -czf "$ATTACHMENTS_FILE" . \
          && tar -tzf "$ATTACHMENTS_FILE" >/dev/null 2>&1; then
          chmod 600 "$ATTACHMENTS_FILE"
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
    echo "  ✗ FILE_STORAGE_PROVIDER 仅支持 Local 或 S3"
    BACKUP_SUCCESS=false
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

  if ! docker ps --format '{{.Names}}' | grep -q "^${REDIS_CONTAINER}$"; then
    echo "  ✗ Redis 容器 $REDIS_CONTAINER 未运行，无法完成已启用的 Redis 备份" >&2
    BACKUP_SUCCESS=false
  else
    # 使用标准输入在容器内设置 REDISCLI_AUTH，避免 redis-cli 的 -a 参数以及
    # docker exec -e 参数把凭据暴露在宿主机进程列表中；INFO persistence 会等待
    # 后台快照真正完成，不能用固定 sleep 猜测完成时间。
    redis_cli() {
      printf '%s\n' "$REDIS_PASSWORD" | docker exec -i "$REDIS_CONTAINER" sh -c '
        IFS= read -r REDISCLI_AUTH
        export REDISCLI_AUTH
        exec redis-cli --no-auth-warning "$@"
      ' redis "$@"
    }

    if redis_cli BGSAVE >/dev/null 2>&1; then
      snapshot_ready=false
      # 给 Redis 一个最短的调度时间，避免极小数据集在 BGSAVE 返回后立即读取到旧状态。
      sleep 1
      for _ in $(seq 1 60); do
        persistence_info="$(redis_cli INFO persistence 2>/dev/null || true)"
        bgsave_in_progress="$(printf '%s\n' "$persistence_info" \
          | awk -F: '$1 == "rdb_bgsave_in_progress" { gsub(/\r/, "", $2); print $2; exit }')"
        last_bgsave_status="$(printf '%s\n' "$persistence_info" \
          | awk -F: '$1 == "rdb_last_bgsave_status" { gsub(/\r/, "", $2); print $2; exit }')"
        if [ "$bgsave_in_progress" = "0" ] && [ "$last_bgsave_status" = "ok" ]; then
          snapshot_ready=true
          break
        fi
        sleep 1
      done

      if [ "$snapshot_ready" != "true" ]; then
        echo "  ✗ Redis BGSAVE 在 60 秒内未完成，拒绝复制可能不完整的 RDB" >&2
        BACKUP_SUCCESS=false
      elif docker cp "$REDIS_CONTAINER:/data/dump.rdb" "$REDIS_FILE.$$" 2>/dev/null; then
        if [ "$(head -c 5 "$REDIS_FILE.$$" 2>/dev/null)" = "REDIS" ]; then
          mv "$REDIS_FILE.$$" "$REDIS_FILE"
          chmod 600 "$REDIS_FILE"
          SIZE=$(du -h "$REDIS_FILE" | cut -f1)
          echo "  ✓ Redis 备份成功: $REDIS_FILE ($SIZE)"
          BACKUP_FILES+=("$REDIS_FILE")
        else
          echo "  ✗ Redis RDB 文件头校验失败，拒绝保存损坏备份" >&2
          rm -f "$REDIS_FILE.$$"
          BACKUP_SUCCESS=false
        fi
      else
        echo "  ✗ Redis RDB 复制失败（容器未运行？）" >&2
        rm -f "$REDIS_FILE.$$"
        BACKUP_SUCCESS=false
      fi
    else
      echo "  ✗ Redis BGSAVE 失败，无法完成已启用的 Redis 备份" >&2
      BACKUP_SUCCESS=false
    fi
  fi
else
  echo "[3/4] Redis 备份已跳过（BACKUP_REDIS=false）"
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
cleanup_old_backups() {
  local cleanup_failed=false
  local pattern
  local -a patterns=(
    "${PG_DB}_*.dump"
    "${PG_DB}_*.sql.gz"
    "redis_*.rdb"
    "attachments_*.tar.gz"
    "backup-manifest_*.tsv"
  )

  # 清理失败会让磁盘持续增长，必须纳入备份结果，而不能再用 `|| true` 静默吞掉。
  for pattern in "${patterns[@]}"; do
    if ! find "$BACKUP_DIR" -name "$pattern" -mtime +"$RETAIN_DAYS" -delete 2>/dev/null; then
      echo "  ✗ 旧备份清理失败: $pattern" >&2
      cleanup_failed=true
    fi
  done

  if [ "$cleanup_failed" = "true" ]; then
    BACKUP_SUCCESS=false
  fi
}

cleanup_old_backups

# ============================================================
# 批次完整性清单
# ============================================================
write_backup_manifest() {
  local manifest_temp="$BACKUP_DIR/backup-manifest_${TIMESTAMP}.tsv.tmp.$$"
  local manifest_path="$BACKUP_DIR/backup-manifest_${TIMESTAMP}.tsv"
  local file
  local filename
  local artifact_type
  local file_size
  local digest

  rm -f -- "$manifest_temp" "$manifest_path"

  # 清单只记录当前批次的单层文件名和摘要，不执行清单内容；临时文件完成后再原子改名，
  # 避免异地同步或恢复流程读到半份清单。任何一个启用组件缺失都使整批备份失败。
  if ! {
    printf 'format\tequipsense-backup-manifest-v1\n'
    printf 'batch_id\t%s\n' "$TIMESTAMP"
    for file in "${BACKUP_FILES[@]}"; do
      [ -f "$file" ] || {
        echo "  ✗ 批次清单引用的备份文件不存在: $file" >&2
        return 1
      }
      filename="$(basename -- "$file")"
      case "$file" in
        "$BACKUP_DIR"/*)
          ;;
        *)
          echo "  ✗ 备份文件不在 BACKUP_DIR 内，无法写入批次清单: $filename" >&2
          return 1
          ;;
      esac
      if ! [[ "$filename" =~ ^[A-Za-z0-9_.-]+$ ]]; then
        echo "  ✗ 备份文件名包含不安全字符，无法写入批次清单: $filename" >&2
        return 1
      fi

      if [[ -n "$PG_FILE" && "$file" = "$PG_FILE" ]]; then
        artifact_type="database"
      elif [[ -n "$ATTACHMENTS_FILE" && "$file" = "$ATTACHMENTS_FILE" ]]; then
        artifact_type="attachments"
      elif [[ -n "$REDIS_FILE" && "$file" = "$REDIS_FILE" ]]; then
        artifact_type="redis"
      else
        echo "  ✗ 无法识别批次清单中的备份文件类型: $filename" >&2
        return 1
      fi

      [ -s "$file" ] || {
        echo "  ✗ 备份文件为空，无法写入批次清单: $filename" >&2
        return 1
      }
      file_size="$(wc -c < "$file" | tr -d '[:space:]')"
      [[ "$file_size" =~ ^[1-9][0-9]*$ ]] || {
        echo "  ✗ 无法读取备份文件大小: $filename" >&2
        return 1
      }
      digest="$(sha256_file "$file")"
      [[ "$digest" =~ ^[0-9a-f]{64}$ ]] || {
        echo "  ✗ 无法生成备份文件 SHA-256: $filename" >&2
        return 1
      }
      printf 'artifact\t%s\t%s\t%s\t%s\n' \
        "$artifact_type" "$filename" "$file_size" "$digest"
    done
  } > "$manifest_temp"; then
    rm -f -- "$manifest_temp" "$manifest_path"
    return 1
  fi

  chmod 600 "$manifest_temp"
  if ! mv -f -- "$manifest_temp" "$manifest_path"; then
    rm -f -- "$manifest_temp" "$manifest_path"
    return 1
  fi
  MANIFEST_FILE="$manifest_path"
  BACKUP_FILES+=("$MANIFEST_FILE")
  echo "  ✓ 批次完整性清单已生成: $MANIFEST_FILE"
}

if [ "$BACKUP_SUCCESS" = "true" ]; then
  if ! write_backup_manifest; then
    echo "  ✗ 批次完整性清单生成失败，拒绝报告备份成功" >&2
    BACKUP_SUCCESS=false
  fi
fi

# ============================================================
# 异地同步（S3/OSS，可选）
# ============================================================
if [[ "${S3_SYNC:-false}" =~ ^([Tt][Rr][Uu][Ee]|1)$ ]]; then
  echo ""
  echo "同步到 S3/OSS: ${S3_BUCKET:-<未配置>}"
  if [ "$BACKUP_SUCCESS" != "true" ]; then
    # 只允许同步已经通过本地逐项校验的批次，避免把半成品扩散到异地副本。
    echo "  ✗ 本地备份不完整，跳过 S3 同步" >&2
  elif [ -z "${S3_BUCKET:-}" ]; then
    echo "  ✗ S3_SYNC 已开启，但 S3_BUCKET 未配置" >&2
    BACKUP_SUCCESS=false
  elif ! command -v aws >/dev/null 2>&1; then
    echo "  ✗ S3_SYNC 已开启，但主机未安装 aws-cli" >&2
    BACKUP_SUCCESS=false
  elif aws s3 sync "$BACKUP_DIR" "$S3_BUCKET" \
    --exclude "*" --include "*.dump" --include "*.sql.gz" --include "*.rdb" \
    --include "attachments_*.tar.gz" --include "backup-manifest_*.tsv"; then
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
  curl --fail --silent --show-error --connect-timeout 5 --max-time 15 -X POST "$BACKUP_WEBHOOK" \
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
