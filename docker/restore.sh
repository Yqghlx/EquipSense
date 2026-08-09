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
ATTACHMENTS_BACKUP=""
REDIS_BACKUP=""
ATTACHMENTS_PATH="/app/uploads"
HEALTH_URL="http://localhost:8080/health"
SKIP_ATTACHMENTS=false
CONFIRM=false
TEMP_DIR=""

usage() {
  cat <<'EOF'
用法：restore.sh [选项]

必填：
  --env-file PATH             生产环境变量文件
  --db-backup PATH            PostgreSQL .sql.gz 备份
  --attachments-backup PATH   工单附件 .tar.gz 备份

可选：
  --skip-attachments          明确跳过附件恢复（不再要求 --attachments-backup）
  --redis-backup PATH         Redis RDB 备份（缓存恢复失败会使整体失败）
  --compose-file PATH         Compose 文件，可重复指定；默认 docker/docker-compose.yml
  --attachments-path PATH     容器内附件目录，默认 /app/uploads
  --health-url URL            恢复后的健康检查地址，默认 http://localhost:8080/health
  --confirm                   确认执行停止服务、数据库覆盖和附件恢复
  -h, --help                  显示帮助

不传 --confirm 时只做校验和 dry-run，不调用 Docker，不修改任何服务或数据。
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
  gzip -t "$DB_BACKUP" 2>/dev/null || fatal "PostgreSQL 备份不是可读的 gzip 文件：$DB_BACKUP"

  if [[ "$SKIP_ATTACHMENTS" = false ]]; then
    [[ -n "$ATTACHMENTS_BACKUP" ]] || fatal "必须指定 --attachments-backup，或显式使用 --skip-attachments"
    require_private_file "$ATTACHMENTS_BACKUP" "附件备份"
    validate_attachment_archive
  fi

  if [[ -n "$REDIS_BACKUP" ]]; then
    require_private_file "$REDIS_BACKUP" "Redis 备份"
    [[ -s "$REDIS_BACKUP" ]] || fatal "Redis 备份为空：$REDIS_BACKUP"
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

print_plan() {
  printf '恢复计划（%s）：\n' "$([[ "$CONFIRM" = true ]] && printf 'confirm' || printf 'dry-run')"
  printf '  环境变量：%s\n' "$ENV_FILE"
  local compose_file
  for compose_file in "${COMPOSE_FILES[@]}"; do
    printf '  Compose：%s\n' "$compose_file"
  done
  printf '  PostgreSQL：%s\n' "$DB_BACKUP"
  if [[ "$SKIP_ATTACHMENTS" = true ]]; then
    printf '  工单附件：跳过（已显式指定 --skip-attachments）\n'
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

[[ -n "$DB_BACKUP" ]] || fatal "必须指定 --db-backup"
validate_inputs
print_plan

if [[ "$CONFIRM" = false ]]; then
  printf 'dry-run：未执行任何 Docker 或数据修改操作。需要真正恢复时请追加 --confirm。\n'
  exit 0
fi

command -v docker >/dev/null 2>&1 || fatal "未找到 docker 命令"
command -v curl >/dev/null 2>&1 || fatal "未找到 curl 命令"

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
trap 'rm -rf -- "$TEMP_DIR"' EXIT

printf '停止后端，避免恢复期间产生新写入……\n'
"${COMPOSE[@]}" stop backend

if [[ -n "$REDIS_BACKUP" ]]; then
  printf '停止 Redis，准备恢复 RDB……\n'
  "${COMPOSE[@]}" stop redis
fi

printf '恢复 PostgreSQL（重建目标数据库，单事务导入）……\n'
gzip -dc "$DB_BACKUP" | "${COMPOSE[@]}" exec -T postgres sh -c '
  set -eu

  # 仅清空 public schema 无法覆盖 TimescaleDB 的内部 schema；先重建数据库，
  # 才能避免旧的 hypertable/chunk 元数据与备份内容发生冲突。
  if [ "$POSTGRES_DB" = "postgres" ]; then
    echo "恢复失败：POSTGRES_DB 不能是维护数据库 postgres" >&2
    exit 1
  fi
  psql -v ON_ERROR_STOP=1 -qAt -U "$POSTGRES_USER" -d postgres \
    -v target_db="$POSTGRES_DB" \
    -v target_user="$POSTGRES_USER" <<'"'"'SQL'"'"' >/dev/null
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = :'target_db' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS :"target_db";
CREATE DATABASE :"target_db" OWNER :"target_user";
SQL
  psql -v ON_ERROR_STOP=1 --single-transaction -U "$POSTGRES_USER" -d "$POSTGRES_DB"
'

if [[ "$SKIP_ATTACHMENTS" = false ]]; then
  printf '恢复工单附件……\n'
  tar -xzf "$ATTACHMENTS_BACKUP" -C "$TEMP_DIR"
  # 后端容器此时已停止，不能使用 exec；一次性任务容器复用同一附件卷完成清理。
  # 覆盖固定 entrypoint，避免误启动应用并绕过实际清理命令。
  "${COMPOSE[@]}" run --rm --no-deps --entrypoint /bin/sh backend -c \
    "mkdir -p -- '$ATTACHMENTS_PATH' && find '$ATTACHMENTS_PATH' -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +"
  "${COMPOSE[@]}" cp "$TEMP_DIR/." "backend:$ATTACHMENTS_PATH/"
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
"${COMPOSE[@]}" exec -T backend sh -c "test -d '$ATTACHMENTS_PATH'" \
  || fatal "恢复后附件目录检查失败：$ATTACHMENTS_PATH"
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
