#!/usr/bin/env bash
# EquipSense 安全恢复脚本 — PostgreSQL + 工单附件 + 可选 Redis。
#
# 默认只执行恢复前校验和 dry-run。任何会停止服务、清空数据库或覆盖附件的动作，
# 都必须显式传入 --confirm，避免把查看恢复计划误变成破坏性操作。

set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
COMPOSE_FILES=()
DB_BACKUP=""
DB_BACKUP_FORMAT=""
MANIFEST=""
ALLOW_LEGACY=false
MANIFEST_BATCH_ID=""
MANIFEST_DATABASE_NAME=""
MANIFEST_DATABASE_SIZE=""
MANIFEST_DATABASE_DIGEST=""
MANIFEST_ATTACHMENTS_NAME=""
MANIFEST_ATTACHMENTS_SIZE=""
MANIFEST_ATTACHMENTS_DIGEST=""
MANIFEST_REDIS_NAME=""
MANIFEST_REDIS_SIZE=""
MANIFEST_REDIS_DIGEST=""
ATTACHMENTS_BACKUP=""
REDIS_BACKUP=""
ATTACHMENTS_PATH="/app/uploads"
HEALTH_URL="http://localhost:8080/health"
SKIP_ATTACHMENTS=false
CONFIRM=false
TEMP_DIR=""
TIMESCALE_RESTORE_PREPARED=false
FILE_STORAGE_PROVIDER="Local"
FILE_STORAGE_S3_BUCKET=""
FILE_STORAGE_S3_REGION="us-east-1"
FILE_STORAGE_S3_ENDPOINT=""
FILE_STORAGE_S3_ACCESS_KEY=""
FILE_STORAGE_S3_SECRET_KEY=""
FILE_STORAGE_S3_KEY_PREFIX="attachments"
S3_STORAGE_ARGS=()

usage() {
  cat <<'EOF'
用法：restore.sh [选项]

必填：
  --env-file PATH             生产环境变量文件
  --db-backup PATH            PostgreSQL .dump 备份（兼容历史 .sql.gz）
  --attachments-backup PATH   工单附件 .tar.gz 备份
  --manifest PATH             同一批次的备份完整性清单（生产确认恢复必填）

可选：
  --skip-attachments          明确跳过附件恢复（不再要求 --attachments-backup）
  --redis-backup PATH         Redis RDB 备份（缓存恢复失败会使整体失败）
  --compose-file PATH         Compose 文件，可重复指定；默认 docker/docker-compose.yml
  --attachments-path PATH     容器内附件目录，默认 /app/uploads
  --health-url URL            恢复后的健康检查地址，默认 http://localhost:8080/health
  --legacy                    显式允许无批次清单的历史备份确认恢复
  --confirm                   确认执行停止服务、数据库覆盖和附件恢复
  -h, --help                  显示帮助

不传 --confirm 时只做校验和 dry-run，不调用 Docker，不修改任何服务或数据；没有批次清单的
历史备份确认恢复还必须显式传入 --legacy。
EOF
}

fatal() {
  printf '恢复失败：%s\n' "$*" >&2
  exit 1
}

make_absolute() {
  local path="$1"
  if [[ "$path" = /* ]]; then
    printf '%s\n' "$path"
  else
    printf '%s/%s\n' "$PWD" "$path"
  fi
}

get_file_mode() {
  local path="$1"
  if stat -c '%a' "$path" >/dev/null 2>&1; then
    stat -c '%a' "$path"
  else
    stat -f '%Lp' "$path"
  fi
}

require_private_file() {
  local path="$1"
  local label="$2"
  [[ ! -L "$path" ]] || fatal "$label不得为符号链接：$path"
  [[ -f "$path" ]] || fatal "$label不存在：$path"

  local mode
  mode="$(get_file_mode "$path")"
  case "$mode" in
    400|600)
      ;;
    *)
      fatal "$label权限不安全（当前 $mode），应为 400 或 600：$path"
      ;;
  esac
}

detect_database_backup_format() {
  local magic
  magic="$(head -c 5 "$DB_BACKUP" 2>/dev/null || true)"
  if [[ "$magic" = "PGDMP" ]]; then
    DB_BACKUP_FORMAT="custom"
    return
  fi

  if gzip -t "$DB_BACKUP" 2>/dev/null; then
    # 旧版本使用纯文本 SQL + gzip；保留该路径，避免历史备份无法恢复。
    DB_BACKUP_FORMAT="legacy-plain"
    return
  fi

  fatal "PostgreSQL 备份格式无法识别：需要 PGDMP custom 文件或纯文本 gzip 文件：$DB_BACKUP"
}

init_sha256_tool() {
  if command -v sha256sum >/dev/null 2>&1; then
    SHA256_TOOL="sha256sum"
  elif command -v shasum >/dev/null 2>&1; then
    SHA256_TOOL="shasum"
  else
    fatal "恢复前清单校验需要 sha256sum 或 shasum"
  fi
}

sha256_file() {
  if [ "$SHA256_TOOL" = "sha256sum" ]; then
    sha256sum "$1" | awk '{print $1}'
  else
    shasum -a 256 "$1" | awk '{print $1}'
  fi
}

validate_backup_manifest() {
  require_private_file "$MANIFEST" "备份批次清单"
  init_sha256_tool

  local line_number=0
  local format_count=0
  local batch_count=0
  local field_one
  local field_two
  local field_three
  local field_four
  local field_five
  local extra_field

  while IFS=$'\t' read -r field_one field_two field_three field_four field_five extra_field; do
    line_number=$((line_number + 1))
    [[ -n "$field_one" ]] || fatal "批次清单第 ${line_number} 行为空"
    [[ -z "$extra_field" ]] || fatal "批次清单第 ${line_number} 行字段数量不正确"

    case "$field_one" in
      format)
        [[ "$field_two" = "equipsense-backup-manifest-v1" && -z "$field_three" && -z "$field_four" && -z "$field_five" ]] \
          || fatal "批次清单格式版本无效"
        format_count=$((format_count + 1))
        ;;
      batch_id)
        [[ "$field_two" =~ ^[0-9]{8}_[0-9]{6}$ && -z "$field_three" && -z "$field_four" && -z "$field_five" ]] \
          || fatal "批次清单 batch_id 无效"
        MANIFEST_BATCH_ID="$field_two"
        batch_count=$((batch_count + 1))
        ;;
      artifact)
        [[ "$field_two" = database || "$field_two" = attachments || "$field_two" = redis ]] \
          || fatal "批次清单包含未知备份类型：$field_two"
        [[ "$field_three" =~ ^[A-Za-z0-9_.-]+$ ]] \
          || fatal "批次清单包含不安全文件名：$field_three"
        [[ "$field_four" =~ ^[1-9][0-9]*$ ]] \
          || fatal "批次清单文件大小无效：$field_three"
        [[ "$field_five" =~ ^[0-9a-f]{64}$ ]] \
          || fatal "批次清单 SHA-256 无效：$field_three"
        case "$field_two" in
          database)
            [[ -z "$MANIFEST_DATABASE_NAME" ]] || fatal "批次清单重复记录 database"
            MANIFEST_DATABASE_NAME="$field_three"
            MANIFEST_DATABASE_SIZE="$field_four"
            MANIFEST_DATABASE_DIGEST="$field_five"
            ;;
          attachments)
            [[ -z "$MANIFEST_ATTACHMENTS_NAME" ]] || fatal "批次清单重复记录 attachments"
            MANIFEST_ATTACHMENTS_NAME="$field_three"
            MANIFEST_ATTACHMENTS_SIZE="$field_four"
            MANIFEST_ATTACHMENTS_DIGEST="$field_five"
            ;;
          redis)
            [[ -z "$MANIFEST_REDIS_NAME" ]] || fatal "批次清单重复记录 redis"
            MANIFEST_REDIS_NAME="$field_three"
            MANIFEST_REDIS_SIZE="$field_four"
            MANIFEST_REDIS_DIGEST="$field_five"
            ;;
        esac
        ;;
      *)
        fatal "批次清单第 ${line_number} 行包含未知字段：$field_one"
        ;;
    esac
  done < "$MANIFEST"

  [[ "$format_count" = 1 ]] || fatal "批次清单必须且只能包含一条 format 记录"
  [[ "$batch_count" = 1 ]] || fatal "批次清单必须且只能包含一条 batch_id 记录"
  [[ -n "$MANIFEST_DATABASE_NAME" ]] || fatal "批次清单缺少 database 备份"
}

verify_manifest_artifact() {
  local artifact_type="$1"
  local artifact_path="$2"
  local expected_name=""
  local expected_size=""
  local expected_digest=""
  local actual_size
  local actual_digest

  case "$artifact_type" in
    database)
      expected_name="$MANIFEST_DATABASE_NAME"
      expected_size="$MANIFEST_DATABASE_SIZE"
      expected_digest="$MANIFEST_DATABASE_DIGEST"
      ;;
    attachments)
      expected_name="$MANIFEST_ATTACHMENTS_NAME"
      expected_size="$MANIFEST_ATTACHMENTS_SIZE"
      expected_digest="$MANIFEST_ATTACHMENTS_DIGEST"
      ;;
    redis)
      expected_name="$MANIFEST_REDIS_NAME"
      expected_size="$MANIFEST_REDIS_SIZE"
      expected_digest="$MANIFEST_REDIS_DIGEST"
      ;;
    *)
      fatal "未知的恢复备份类型：$artifact_type"
      ;;
  esac

  [[ -n "$expected_name" ]] || fatal "批次清单缺少 $artifact_type 备份"
  [[ "$(basename -- "$artifact_path")" = "$expected_name" ]] \
    || fatal "传入的 $artifact_type 文件与批次清单不匹配"
  require_private_file "$artifact_path" "$artifact_type 备份"
  actual_size="$(wc -c < "$artifact_path" | tr -d '[:space:]')"
  [[ "$actual_size" = "$expected_size" ]] \
    || fatal "$artifact_type 备份大小与批次清单不匹配"
  actual_digest="$(sha256_file "$artifact_path")"
  [[ "$actual_digest" = "$expected_digest" ]] \
    || fatal "$artifact_type 备份 SHA-256 与批次清单不匹配"
}

validate_attachment_archive() {
  local listing
  listing="$(tar -tzf "$ATTACHMENTS_BACKUP" 2>/dev/null)" \
    || fatal "附件归档无法通过 tar 校验：$ATTACHMENTS_BACKUP"

  local member
  local segment
  local -a segments
  while IFS= read -r member; do
    [[ -n "$member" ]] || continue
    [[ "$member" != /* ]] || fatal "附件归档包含绝对路径：$member"
    IFS='/' read -r -a segments <<< "$member"
    for segment in "${segments[@]}"; do
      [[ "$segment" != ".." ]] || fatal "附件归档包含不安全路径：$member"
    done
  done <<< "$listing"

  local metadata
  metadata="$(tar -tvzf "$ATTACHMENTS_BACKUP" 2>/dev/null)" \
    || fatal "附件归档元数据无法读取：$ATTACHMENTS_BACKUP"
  while IFS= read -r member; do
    [[ -n "$member" ]] || continue
    case "${member:0:1}" in
      -|d)
        ;;
      *)
        fatal "附件归档包含不允许的文件类型（仅允许普通文件和目录）：$member"
        ;;
    esac
  done <<< "$metadata"
}

load_file_storage_config() {
  # .env 是数据而不是脚本；只读取恢复所需的固定键，避免 source 执行任意 Shell 代码。
  require_private_file "$ENV_FILE" "环境变量文件"
  local value
  value="$(read_env_value FILE_STORAGE_PROVIDER)"
  FILE_STORAGE_PROVIDER="${value:-${FILE_STORAGE_PROVIDER:-Local}}"
  value="$(read_env_value FILE_STORAGE_S3_BUCKET)"
  FILE_STORAGE_S3_BUCKET="${value:-${FILE_STORAGE_S3_BUCKET:-}}"
  value="$(read_env_value FILE_STORAGE_S3_REGION)"
  FILE_STORAGE_S3_REGION="${value:-${FILE_STORAGE_S3_REGION:-us-east-1}}"
  value="$(read_env_value FILE_STORAGE_S3_ENDPOINT)"
  FILE_STORAGE_S3_ENDPOINT="${value:-${FILE_STORAGE_S3_ENDPOINT:-}}"
  value="$(read_env_value FILE_STORAGE_S3_ACCESS_KEY)"
  FILE_STORAGE_S3_ACCESS_KEY="${value:-${FILE_STORAGE_S3_ACCESS_KEY:-}}"
  value="$(read_env_value FILE_STORAGE_S3_SECRET_KEY)"
  FILE_STORAGE_S3_SECRET_KEY="${value:-${FILE_STORAGE_S3_SECRET_KEY:-}}"
  value="$(read_env_value FILE_STORAGE_S3_KEY_PREFIX)"
  FILE_STORAGE_S3_KEY_PREFIX="${value:-${FILE_STORAGE_S3_KEY_PREFIX:-attachments}}"

  case "$FILE_STORAGE_PROVIDER" in
    Local|local|LOCAL)
      FILE_STORAGE_PROVIDER="Local"
      ;;
    S3|s3)
      FILE_STORAGE_PROVIDER="S3"
      [[ -n "$FILE_STORAGE_S3_BUCKET" ]] || fatal "S3 附件恢复需要 FILE_STORAGE_S3_BUCKET"
      [[ -n "$FILE_STORAGE_S3_REGION" ]] || fatal "S3 附件恢复需要 FILE_STORAGE_S3_REGION"
      [[ "$FILE_STORAGE_S3_BUCKET" != */* && "$FILE_STORAGE_S3_BUCKET" != *\\* && "$FILE_STORAGE_S3_BUCKET" != *[[:space:]]* ]] \
        || fatal "FILE_STORAGE_S3_BUCKET 不能包含路径分隔符或空白字符"
      if [[ -n "$FILE_STORAGE_S3_ENDPOINT" ]]; then
        [[ "$FILE_STORAGE_S3_ENDPOINT" = https://* ]] \
          || fatal "生产 FILE_STORAGE_S3_ENDPOINT 必须使用 HTTPS"
        [[ -n "$FILE_STORAGE_S3_ACCESS_KEY" && -n "$FILE_STORAGE_S3_SECRET_KEY" ]] \
          || fatal "配置 S3 自定义端点时必须同时提供访问凭据"
      elif [[ -n "$FILE_STORAGE_S3_ACCESS_KEY" || -n "$FILE_STORAGE_S3_SECRET_KEY" ]]; then
        [[ -n "$FILE_STORAGE_S3_ACCESS_KEY" && -n "$FILE_STORAGE_S3_SECRET_KEY" ]] \
          || fatal "FILE_STORAGE_S3_ACCESS_KEY 和 FILE_STORAGE_S3_SECRET_KEY 必须同时配置"
      fi
      [[ "$FILE_STORAGE_S3_KEY_PREFIX" != /* && "$FILE_STORAGE_S3_KEY_PREFIX" != */ && "$FILE_STORAGE_S3_KEY_PREFIX" != *\\* && "$FILE_STORAGE_S3_KEY_PREFIX" != *//* && "$FILE_STORAGE_S3_KEY_PREFIX" != *..* ]] \
        || fatal "FILE_STORAGE_S3_KEY_PREFIX 必须是安全的相对对象键前缀"
      ;;
    *)
      fatal "FILE_STORAGE_PROVIDER 仅支持 Local 或 S3"
      ;;
  esac
}

validate_inputs() {
  [[ -f "$ENV_FILE" ]] || fatal "环境变量文件不存在：$ENV_FILE"
  local compose_file
  if [[ "${#COMPOSE_FILES[@]}" -eq 0 ]]; then
    COMPOSE_FILES=("$COMPOSE_FILE")
  fi
  for compose_file in "${COMPOSE_FILES[@]}"; do
    [[ -f "$compose_file" ]] || fatal "Compose 文件不存在：$compose_file"
  done
  require_private_file "$DB_BACKUP" "PostgreSQL 备份"

  if [[ "$SKIP_ATTACHMENTS" = false ]]; then
    [[ -n "$ATTACHMENTS_BACKUP" ]] || fatal "必须指定 --attachments-backup，或显式使用 --skip-attachments"
    require_private_file "$ATTACHMENTS_BACKUP" "附件备份"
  fi

  if [[ -n "$REDIS_BACKUP" ]]; then
    require_private_file "$REDIS_BACKUP" "Redis 备份"
    [[ -s "$REDIS_BACKUP" ]] || fatal "Redis 备份为空：$REDIS_BACKUP"
  fi

  if [[ -n "$MANIFEST" ]]; then
    validate_backup_manifest
    verify_manifest_artifact database "$DB_BACKUP"
    if [[ "$SKIP_ATTACHMENTS" = false ]]; then
      verify_manifest_artifact attachments "$ATTACHMENTS_BACKUP"
    fi
    if [[ -n "$REDIS_BACKUP" ]]; then
      verify_manifest_artifact redis "$REDIS_BACKUP"
    fi
  elif [[ "$CONFIRM" = true && "$ALLOW_LEGACY" = false ]]; then
    fatal "确认恢复必须提供 --manifest；仅历史无清单备份可显式使用 --legacy"
  fi

  # 先验证批次摘要，再解析 gzip/tar/RDB 内容；这样清单发现的篡改不会被后续格式错误遮蔽，
  # 并且所有失败都发生在任何 Docker、AWS 或服务状态变更之前。
  detect_database_backup_format
  if [[ "$SKIP_ATTACHMENTS" = false ]]; then
    validate_attachment_archive
  fi
  if [[ -n "$REDIS_BACKUP" ]]; then
    [[ "$(LC_ALL=C head -c 5 "$REDIS_BACKUP")" = "REDIS" ]] \
      || fatal "Redis 备份不是可识别的 RDB 文件：$REDIS_BACKUP"
  fi

  [[ "$ATTACHMENTS_PATH" = /* ]] \
    || fatal "--attachments-path 必须是容器内绝对路径"
  [[ "$ATTACHMENTS_PATH" != *..* ]] \
    || fatal "--attachments-path 不允许包含 .."
  [[ "$ATTACHMENTS_PATH" =~ ^/[A-Za-z0-9._/-]+$ ]] \
    || fatal "--attachments-path 只允许字母、数字、点、下划线、短横线和斜杠"
  [[ "$HEALTH_URL" =~ ^https?://[^[:space:]]+$ ]] \
    || fatal "--health-url 必须是 http:// 或 https:// URL"
}

read_env_value() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 || true)"
  printf '%s' "${line#*=}"
}

print_plan() {
  printf '恢复计划（%s）：\n' "$([[ "$CONFIRM" = true ]] && printf 'confirm' || printf 'dry-run')"
  printf '  环境变量：%s\n' "$ENV_FILE"
  local compose_file
  for compose_file in "${COMPOSE_FILES[@]}"; do
    printf '  Compose：%s\n' "$compose_file"
  done
  printf '  PostgreSQL：%s\n' "$DB_BACKUP"
  printf '  PostgreSQL 格式：%s\n' "$DB_BACKUP_FORMAT"
  if [[ -n "$MANIFEST" ]]; then
    printf '  批次清单：%s（batch_id=%s）\n' "$MANIFEST" "$MANIFEST_BATCH_ID"
  elif [[ "$ALLOW_LEGACY" = true ]]; then
    printf '  批次完整性：历史兼容模式（未提供 --manifest）\n'
  fi
  if [[ "$SKIP_ATTACHMENTS" = true ]]; then
    printf '  工单附件：跳过（已显式指定 --skip-attachments）\n'
  elif [[ "$FILE_STORAGE_PROVIDER" = S3 ]]; then
    printf '  工单附件：%s → s3://%s/%s\n' "$ATTACHMENTS_BACKUP" "$FILE_STORAGE_S3_BUCKET" "$FILE_STORAGE_S3_KEY_PREFIX"
  else
    printf '  工单附件：%s → %s\n' "$ATTACHMENTS_BACKUP" "$ATTACHMENTS_PATH"
  fi
  if [[ -n "$REDIS_BACKUP" ]]; then
    printf '  Redis：%s\n' "$REDIS_BACKUP"
  else
    printf '  Redis：跳过（未提供备份）\n'
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      [[ $# -ge 2 ]] || fatal "--env-file 缺少参数"
      ENV_FILE="$(make_absolute "$2")"
      shift 2
      ;;
    --db-backup)
      [[ $# -ge 2 ]] || fatal "--db-backup 缺少参数"
      DB_BACKUP="$(make_absolute "$2")"
      shift 2
      ;;
    --manifest)
      [[ $# -ge 2 ]] || fatal "--manifest 缺少参数"
      MANIFEST="$(make_absolute "$2")"
      shift 2
      ;;
    --attachments-backup)
      [[ $# -ge 2 ]] || fatal "--attachments-backup 缺少参数"
      ATTACHMENTS_BACKUP="$(make_absolute "$2")"
      shift 2
      ;;
    --redis-backup)
      [[ $# -ge 2 ]] || fatal "--redis-backup 缺少参数"
      REDIS_BACKUP="$(make_absolute "$2")"
      shift 2
      ;;
    --compose-file)
      [[ $# -ge 2 ]] || fatal "--compose-file 缺少参数"
      if [[ "${#COMPOSE_FILES[@]}" -eq 0 ]]; then
        COMPOSE_FILES=()
      fi
      COMPOSE_FILES+=("$(make_absolute "$2")")
      shift 2
      ;;
    --attachments-path)
      [[ $# -ge 2 ]] || fatal "--attachments-path 缺少参数"
      ATTACHMENTS_PATH="$2"
      shift 2
      ;;
    --health-url)
      [[ $# -ge 2 ]] || fatal "--health-url 缺少参数"
      HEALTH_URL="$2"
      shift 2
      ;;
    --skip-attachments)
      SKIP_ATTACHMENTS=true
      shift
      ;;
    --legacy)
      ALLOW_LEGACY=true
      shift
      ;;
    --confirm)
      CONFIRM=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fatal "未知参数：$1（使用 --help 查看用法）"
      ;;
  esac
done

if [[ "$ALLOW_LEGACY" = true && -n "$MANIFEST" ]]; then
  fatal "--legacy 只能用于未提供 --manifest 的历史备份"
fi

[[ -n "$DB_BACKUP" ]] || fatal "必须指定 --db-backup"
load_file_storage_config
validate_inputs
print_plan

if [[ "$CONFIRM" = false ]]; then
  printf 'dry-run：未执行任何 Docker 或数据修改操作。需要真正恢复时请追加 --confirm。\n'
  exit 0
fi

# 恢复会停止服务、重建数据库并覆盖附件；同一环境的确认恢复必须串行执行。
# 使用环境文件旁的原子目录锁，遗留锁必须由运维确认后处理，不能自动猜测持锁进程已退出。
RESTORE_LOCK_DIR="${ENV_FILE}.restore.lock"
RESTORE_LOCK_OWNED=false
release_restore_lock() {
  if [ "$RESTORE_LOCK_OWNED" = true ]; then
    rm -f "$RESTORE_LOCK_DIR/pid" 2>/dev/null || true
    rmdir "$RESTORE_LOCK_DIR" 2>/dev/null || true
    RESTORE_LOCK_OWNED=false
  fi
}

if ! mkdir "$RESTORE_LOCK_DIR" 2>/dev/null; then
  lock_pid="$(cat "$RESTORE_LOCK_DIR/pid" 2>/dev/null || true)"
  if [ -n "$lock_pid" ]; then
    fatal "已有恢复任务正在运行或遗留锁（PID ${lock_pid}），请确认后再处理 $RESTORE_LOCK_DIR"
  fi
  fatal "已有恢复任务正在运行或遗留锁，请确认后再处理 $RESTORE_LOCK_DIR"
fi
RESTORE_LOCK_OWNED=true
trap release_restore_lock EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
printf '%s\n' "$$" > "$RESTORE_LOCK_DIR/pid"
chmod 600 "$RESTORE_LOCK_DIR/pid"

command -v docker >/dev/null 2>&1 || fatal "未找到 docker 命令"
command -v curl >/dev/null 2>&1 || fatal "未找到 curl 命令"

if [[ "$FILE_STORAGE_PROVIDER" = S3 && "$SKIP_ATTACHMENTS" = false ]]; then
  command -v aws >/dev/null 2>&1 || fatal "S3 附件恢复需要主机安装 aws-cli"
  if [[ -n "$FILE_STORAGE_S3_ACCESS_KEY" && -n "$FILE_STORAGE_S3_SECRET_KEY" ]]; then
    export AWS_ACCESS_KEY_ID="$FILE_STORAGE_S3_ACCESS_KEY"
    export AWS_SECRET_ACCESS_KEY="$FILE_STORAGE_S3_SECRET_KEY"
  fi
  export AWS_DEFAULT_REGION="$FILE_STORAGE_S3_REGION"
  if [[ -n "$FILE_STORAGE_S3_ENDPOINT" ]]; then
    S3_STORAGE_ARGS+=(--endpoint-url "$FILE_STORAGE_S3_ENDPOINT")
  fi
fi

COMPOSE=(docker compose --env-file "$ENV_FILE")
for compose_file in "${COMPOSE_FILES[@]}"; do
  COMPOSE+=(-f "$compose_file")
done
"${COMPOSE[@]}" config --quiet

POSTGRES_CONTAINER="$("${COMPOSE[@]}" ps -q postgres)"
[[ -n "$POSTGRES_CONTAINER" ]] || fatal "PostgreSQL 容器不存在，请先启动目标 Compose 环境"
POSTGRES_RUNNING="$(docker inspect --format '{{.State.Running}}' "$POSTGRES_CONTAINER")"
[[ "$POSTGRES_RUNNING" = true ]] || fatal "PostgreSQL 容器未运行"

TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/equipsense-restore.XXXXXX")"

cleanup_restore() {
  local exit_code="$?"
  trap - EXIT

  # pg_restore/psql 失败时，数据库可能仍处于 TimescaleDB restoring 状态；
  # 必须先退出恢复模式，再保留原始失败码，避免故障被掩盖或服务无法正常启动。
  if [[ "$TIMESCALE_RESTORE_PREPARED" = true ]]; then
    printf '恢复异常，尝试退出 TimescaleDB restoring 模式……\n' >&2
    if ! "${COMPOSE[@]}" exec -T postgres sh -c \
      'psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT timescaledb_post_restore()"' \
      >/dev/null; then
      printf '恢复失败：TimescaleDB post_restore 也执行失败，需人工检查数据库状态。\n' >&2
      [[ "$exit_code" -ne 0 ]] || exit_code=1
    fi
    TIMESCALE_RESTORE_PREPARED=false
  fi

  rm -rf -- "$TEMP_DIR" 2>/dev/null || true
  release_restore_lock
  exit "$exit_code"
}
trap cleanup_restore EXIT

printf '停止后端，避免恢复期间产生新写入……\n'
"${COMPOSE[@]}" stop backend

if [[ -n "$REDIS_BACKUP" ]]; then
  printf '停止 Redis，准备恢复 RDB……\n'
  "${COMPOSE[@]}" stop redis
fi

printf '恢复 PostgreSQL（重建目标数据库，清理 TimescaleDB 内部元数据）……\n'
"${COMPOSE[@]}" exec -T postgres sh -c '
  set -eu

  # 仅清空 public schema 无法覆盖 TimescaleDB 的内部 schema；先重建数据库，
  # 才能避免旧的 hypertable/chunk 元数据与备份内容发生冲突。
  if [ "$POSTGRES_DB" = "postgres" ]; then
    echo "恢复失败：POSTGRES_DB 不能是维护数据库 postgres" >&2
    exit 1
  fi
  psql -v ON_ERROR_STOP=1 -qAt -U "$POSTGRES_USER" -d postgres \
    -v target_db="$POSTGRES_DB" \
    -v target_user="$POSTGRES_USER"
' <<'SQL' >/dev/null
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = :'target_db' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS :"target_db";
  CREATE DATABASE :"target_db" OWNER :"target_user";
SQL

printf '准备 TimescaleDB 恢复模式……\n'
"${COMPOSE[@]}" exec -T postgres sh -c '
  set -eu
  psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    -c "CREATE EXTENSION IF NOT EXISTS timescaledb" \
    -c "SELECT timescaledb_pre_restore()"
' >/dev/null
TIMESCALE_RESTORE_PREPARED=true

if [[ "$DB_BACKUP_FORMAT" = custom ]]; then
  printf '恢复 PostgreSQL custom 备份（pg_restore，禁止并行）……\n'
  "${COMPOSE[@]}" exec -T postgres sh -c \
    'pg_restore --exit-on-error --no-owner --no-privileges -U "$POSTGRES_USER" --dbname="$POSTGRES_DB"' \
    < "$DB_BACKUP"
else
  printf '恢复 PostgreSQL 历史纯文本 gzip 备份……\n'
  gzip -dc "$DB_BACKUP" | "${COMPOSE[@]}" exec -T postgres sh -c \
    'psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
fi

printf '完成 TimescaleDB 恢复并更新统计信息……\n'
"${COMPOSE[@]}" exec -T postgres sh -c \
  'psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT timescaledb_post_restore()"' \
  >/dev/null
TIMESCALE_RESTORE_PREPARED=false
"${COMPOSE[@]}" exec -T postgres sh -c \
  'psql -v ON_ERROR_STOP=1 -q -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "ANALYZE"' \
  >/dev/null

if [[ "$SKIP_ATTACHMENTS" = false ]]; then
  printf '恢复工单附件……\n'
  tar -xzf "$ATTACHMENTS_BACKUP" -C "$TEMP_DIR"
  if [[ "$FILE_STORAGE_PROVIDER" = S3 ]]; then
    storage_destination="s3://${FILE_STORAGE_S3_BUCKET}/${FILE_STORAGE_S3_KEY_PREFIX#/}"
    aws s3 sync "$TEMP_DIR/" "$storage_destination" --delete --no-progress "${S3_STORAGE_ARGS[@]}"
    printf 'S3 工单附件已恢复：s3://%s/%s\n' "$FILE_STORAGE_S3_BUCKET" "$FILE_STORAGE_S3_KEY_PREFIX"
  else
    # 后端容器此时已停止，不能使用 exec；一次性任务容器复用同一附件卷完成清理。
    # 覆盖固定 entrypoint，避免误启动应用并绕过实际清理命令。
    "${COMPOSE[@]}" run --rm --no-deps --entrypoint /bin/sh backend -c \
      "mkdir -p -- '$ATTACHMENTS_PATH' && find '$ATTACHMENTS_PATH' -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +"
    "${COMPOSE[@]}" cp "$TEMP_DIR/." "backend:$ATTACHMENTS_PATH/"
  fi
fi

if [[ -n "$REDIS_BACKUP" ]]; then
  printf '恢复 Redis RDB……\n'
  "${COMPOSE[@]}" cp "$REDIS_BACKUP" redis:/data/dump.rdb
  # 生产 Redis 开启 AOF 时会优先加载 AOF；同时 docker cp 默认可能留下 root 属主。
  # 用一次性 root 容器清理旧 AOF 并把 RDB 交还给 redis 用户，再启动原容器。
  "${COMPOSE[@]}" run --rm --no-deps --user root --entrypoint /bin/sh redis -c \
    "for aof_path in /data/appendonly.aof*; do [ -e \"\$aof_path\" ] || continue; rm -rf \"\$aof_path\"; done; rm -rf /data/appendonlydir; chown redis:redis /data/dump.rdb; chmod 600 /data/dump.rdb"
  "${COMPOSE[@]}" start redis
fi

printf '启动后端并执行恢复后检查……\n'
"${COMPOSE[@]}" up -d backend
"${COMPOSE[@]}" exec -T postgres sh -c \
  'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1"' \
  | grep -qx '1' || fatal "恢复后 PostgreSQL 连通性检查失败"
if [[ "$FILE_STORAGE_PROVIDER" = Local ]]; then
  "${COMPOSE[@]}" exec -T backend sh -c "test -d '$ATTACHMENTS_PATH'" \
    || fatal "恢复后附件目录检查失败：$ATTACHMENTS_PATH"
fi
curl --fail --silent --show-error --max-time 30 "$HEALTH_URL" >/dev/null \
  || fatal "恢复后健康检查失败：$HEALTH_URL"

RESTORED_ITEMS="数据库"
[[ "$SKIP_ATTACHMENTS" = true ]] || RESTORED_ITEMS+="、附件"
if [[ -n "$REDIS_BACKUP" ]]; then
  RESTORED_ITEMS+="、Redis"
  REDIS_STATUS="已恢复"
else
  REDIS_STATUS="未恢复（未提供备份）"
fi
printf '恢复完成：%s；Redis %s；健康检查通过。\n' "$RESTORED_ITEMS" "$REDIS_STATUS"
