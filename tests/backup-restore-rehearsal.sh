#!/usr/bin/env bash
# EquipSense 备份恢复实演：在隔离的临时 Compose 项目中验证数据库和工单附件可恢复。
#
# 该脚本只创建随机命名的临时容器、网络和数据卷，退出时统一销毁；不会读取或修改
# docker/.env，也不会复用生产 Compose 的固定容器名。它验证的是 backup.sh 和
# restore.sh 的真实 Docker 闭环，而不是仅靠 mock 判断命令是否被调用。

set -Eeuo pipefail
umask 077

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REHEARSAL_ROOT=""
ENV_FILE=""
COMPOSE_FILE=""
BACKUP_SCRIPT=""
RESTORE_SCRIPT=""
COMPOSE_PROJECT_NAME=""
REHEARSAL_PORT=""
PG_CONTAINER=""
BACKEND_CONTAINER=""
BACKUP_DIR=""

fatal() {
  printf '备份恢复演练失败：%s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fatal "未找到必需命令：$1"
}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

wait_for_service() {
  local service="$1"
  local timeout_seconds="${2:-180}"
  local deadline=$((SECONDS + timeout_seconds))

  while (( SECONDS < deadline )); do
    if compose ps --status running --services | grep -qx "$service"; then
      if [[ "$service" != postgres ]] || compose exec -T postgres pg_isready -U postgres -d rehearsal >/dev/null 2>&1; then
        return 0
      fi
    fi
    sleep 2
  done

  compose ps >&2 || true
  fatal "服务未在 ${timeout_seconds} 秒内就绪：$service"
}

cleanup() {
  local exit_code="$?"
  trap - EXIT

  if [[ -n "$COMPOSE_FILE" && -f "$COMPOSE_FILE" && -n "$ENV_FILE" && -f "$ENV_FILE" ]]; then
    printf '清理隔离演练项目……\n'
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down -v --remove-orphans >/dev/null 2>&1 || true
  fi
  if [[ -n "$REHEARSAL_ROOT" && -d "$REHEARSAL_ROOT" ]]; then
    rm -rf -- "$REHEARSAL_ROOT"
  fi

  exit "$exit_code"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

require_command docker
require_command curl
require_command find

docker info >/dev/null 2>&1 || fatal "Docker 引擎不可用，请先启动 Docker"
docker compose version >/dev/null 2>&1 || fatal "Docker Compose 插件不可用"

REHEARSAL_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/equipsense-backup-restore.XXXXXX")"
ENV_FILE="$REHEARSAL_ROOT/.env"
COMPOSE_FILE="$REHEARSAL_ROOT/docker-compose.yml"
BACKUP_SCRIPT="$REHEARSAL_ROOT/backup.sh"
RESTORE_SCRIPT="$REHEARSAL_ROOT/restore.sh"
BACKUP_DIR="$REHEARSAL_ROOT/backups"

# Compose 的项目名不能包含 mktemp 目录名中的点号，因此单独生成安全的随机后缀。
COMPOSE_PROJECT_NAME="equipsense-rehearsal-$RANDOM$RANDOM"
REHEARSAL_PORT="$((18080 + RANDOM % 1000))"
PG_CONTAINER="${COMPOSE_PROJECT_NAME}-postgres"
BACKEND_CONTAINER="${COMPOSE_PROJECT_NAME}-backend"

cp "$PROJECT_ROOT/docker/backup.sh" "$BACKUP_SCRIPT"
cp "$PROJECT_ROOT/docker/restore.sh" "$RESTORE_SCRIPT"
chmod 700 "$BACKUP_SCRIPT" "$RESTORE_SCRIPT"
mkdir -p "$BACKUP_DIR"

cat > "$ENV_FILE" <<EOF
PG_PASSWORD=rehearsal-db-password
PG_USER=postgres
PG_DB=rehearsal
PG_CONTAINER=$PG_CONTAINER
POSTGRES_PASSWORD=rehearsal-db-password
POSTGRES_USER=postgres
POSTGRES_DB=rehearsal
BACKEND_CONTAINER=$BACKEND_CONTAINER
BACKUP_DIR=$BACKUP_DIR
BACKUP_REDIS=false
BACKUP_ATTACHMENTS=true
ATTACHMENTS_CONTAINER=$BACKEND_CONTAINER
ATTACHMENTS_PATH=/app/uploads
FILE_STORAGE_PROVIDER=Local
RETAIN_DAYS=7
REHEARSAL_PORT=$REHEARSAL_PORT
COMPOSE_PROJECT_NAME=$COMPOSE_PROJECT_NAME
EOF
chmod 600 "$ENV_FILE"

cat > "$REHEARSAL_ROOT/nginx.conf" <<'EOF'
server {
    listen 80;
    server_name _;

    location = /health {
        default_type text/plain;
        return 200 "healthy\n";
    }
}
EOF
chmod 600 "$REHEARSAL_ROOT/nginx.conf"

cat > "$COMPOSE_FILE" <<'EOF'
services:
  postgres:
    image: timescale/timescaledb:latest-pg16@sha256:87f39af0a38cb42e4add367d9dfad2087a53fe5c9b24b5bc0dc66bd204b0665f
    container_name: ${PG_CONTAINER}
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    command: ["postgres", "-c", "max_connections=50"]
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 2s
      timeout: 5s
      retries: 30

  backend:
    image: nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10
    container_name: ${BACKEND_CONTAINER}
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "127.0.0.1:${REHEARSAL_PORT}:80"
    volumes:
      - attachments_data:/app/uploads
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O /dev/null http://127.0.0.1/health"]
      interval: 2s
      timeout: 5s
      retries: 30

volumes:
  pgdata:
  attachments_data:
EOF
chmod 600 "$COMPOSE_FILE"

export COMPOSE_PROJECT_NAME

printf '启动隔离 PostgreSQL 和附件卷……\n'
compose config --quiet
compose up -d
wait_for_service postgres
wait_for_service backend

printf '写入演练基线数据……\n'
compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d rehearsal \
  -c 'CREATE TABLE rehearsal_marker (id integer PRIMARY KEY, marker text NOT NULL);' \
  -c "INSERT INTO rehearsal_marker (id, marker) VALUES (1, 'backup-baseline');" >/dev/null
compose exec -T backend sh -c \
  "mkdir -p /app/uploads && printf '%s' 'attachment-baseline' > /app/uploads/rehearsal.txt"

printf '执行真实备份并校验归档……\n'
"$BACKUP_SCRIPT"
DB_BACKUP="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name '*.dump' -print -quit)"
ATTACHMENTS_BACKUP="$(find "$BACKUP_DIR" -maxdepth 1 -type f -name 'attachments_*.tar.gz' -print -quit)"
[[ -n "$DB_BACKUP" ]] || fatal "未生成 PostgreSQL custom 备份"
[[ -n "$ATTACHMENTS_BACKUP" ]] || fatal "未生成工单附件备份"

printf '破坏基线数据，验证恢复确实覆盖目标……\n'
compose exec -T postgres psql -v ON_ERROR_STOP=1 -U postgres -d rehearsal \
  -c "UPDATE rehearsal_marker SET marker = 'mutated';" >/dev/null
compose exec -T backend sh -c \
  "printf '%s' 'attachment-mutated' > /app/uploads/rehearsal.txt"

restore_started_at="$SECONDS"
"$RESTORE_SCRIPT" \
  --env-file "$ENV_FILE" \
  --compose-file "$COMPOSE_FILE" \
  --db-backup "$DB_BACKUP" \
  --attachments-backup "$ATTACHMENTS_BACKUP" \
  --attachments-path /app/uploads \
  --health-url "http://127.0.0.1:${REHEARSAL_PORT}/health" \
  --confirm
restore_elapsed_seconds=$((SECONDS - restore_started_at))

restored_marker="$(compose exec -T postgres psql -U postgres -d rehearsal -tAc \
  'SELECT marker FROM rehearsal_marker WHERE id = 1' | tr -d '\r' | xargs)"
[[ "$restored_marker" = backup-baseline ]] \
  || fatal "数据库恢复校验失败，实际 marker：$restored_marker"

restored_attachment="$(compose exec -T backend sh -c 'cat /app/uploads/rehearsal.txt')"
[[ "$restored_attachment" = attachment-baseline ]] \
  || fatal "附件恢复校验失败，实际内容：$restored_attachment"

printf '备份恢复实演通过：数据库、附件和恢复后健康检查均成功；恢复耗时 %ss。\n' \
  "$restore_elapsed_seconds"
