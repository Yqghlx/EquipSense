#!/usr/bin/env bash
# =============================================================================
# compose-production.sh — 生产 Compose 的 fail-closed 操作入口
# =============================================================================
#
# 用途：为直接操作生产 Compose 的场景提供统一前置门禁，避免凭据、证书或
#       运行时文件无效时只启动部分容器，留下难以诊断的半成品环境。
#
# 使用方式：
#   cd docker
#   ./compose-production.sh up -d
#   ./compose-production.sh ps
#   ./compose-production.sh logs --tail=200 backend
#   ./compose-production.sh down
#
# 生产发布（拉取已构建镜像）仍应使用 deploy-production.sh；本脚本针对
#       docker-compose.yml 的直接运维操作，不读取或打印任何凭据内容。
# =============================================================================

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
ENV_FILE="${PRODUCTION_ENV_FILE:-${SCRIPT_DIR}/.env}"
COMPOSE_FILE="${PRODUCTION_COMPOSE_FILE:-${SCRIPT_DIR}/docker-compose.yml}"
DOCKER_BIN="${PRODUCTION_DOCKER_BIN:-docker}"
COMPOSE_ENV_FILE="$ENV_FILE"
RECOVERY_ENV_FILE=""

usage() {
  cat <<'EOF'
用法：
  compose-production.sh up -d
  compose-production.sh ps
  compose-production.sh logs --tail=200 backend
  compose-production.sh down
  compose-production.sh --check

说明：
  up/start/restart/build/pull/create/run/scale 会先执行完整生产门禁，
  包括 .env、TLS/MQTT 证书和 Compose 运行时文件校验。
  down/stop/kill/rm/ps/logs 等故障处置和观察命令不会被门禁阻断。
EOF
}

fatal() {
  printf '生产 Compose 操作失败：%s\n' "$*" >&2
  exit 1
}

resolve_path() {
  local path="$1"
  local directory
  if [[ "$path" = /* ]]; then
    printf '%s' "$path"
    return 0
  fi
  directory="$(cd "$(dirname "$path")" 2>/dev/null && pwd -P)" \
    || fatal "无法解析路径：$path"
  printf '%s/%s' "$directory" "$(basename "$path")"
}

ENV_FILE="$(resolve_path "$ENV_FILE")"
COMPOSE_FILE="$(resolve_path "$COMPOSE_FILE")"

[[ -f "$ENV_FILE" ]] || fatal "环境变量文件不存在：$ENV_FILE"
[[ -f "$COMPOSE_FILE" ]] || fatal "Compose 文件不存在：$COMPOSE_FILE"
[[ -f "${SCRIPT_DIR}/validate-env.sh" ]] \
  || fatal "缺少生产环境校验器：${SCRIPT_DIR}/validate-env.sh"
command -v "$DOCKER_BIN" >/dev/null 2>&1 \
  || fatal "未找到 Docker 命令：$DOCKER_BIN"

run_preflight() {
  # 校验器只输出变量名和错误类别，不会把 .env 内容带入日志。
  bash "${SCRIPT_DIR}/validate-env.sh" "$ENV_FILE" --check-runtime-files
}

cleanup_recovery_env() {
  if [ -n "$RECOVERY_ENV_FILE" ]; then
    rm -f -- "$RECOVERY_ENV_FILE"
  fi
}

trap cleanup_recovery_env EXIT

prepare_recovery_env() {
  # Compose 即使执行 ps/logs/down，也会先解析完整配置；生产 .env 有缺失项时，
  # 原始文件会让故障处置命令也无法运行。恢复模式只保留非敏感配置，再补入
  # 无法启动服务的安全占位值，因此不会复制生产秘密，也不会绕过启动门禁。
  RECOVERY_ENV_FILE="$(mktemp "${TMPDIR:-/tmp}/equipsense-compose-recovery.XXXXXX")"
  chmod 600 "$RECOVERY_ENV_FILE"

  # 只复制显式列出的非敏感运行参数，而不是维护一个容易漏项的“秘密黑名单”。
  # 新增环境变量默认不会进入恢复文件；需要加入时必须先判断它不包含凭据、令牌或
  # 可嵌入认证信息的 URL，避免故障处置命令把未来新增秘密写入临时文件。
  awk -F= '
    BEGIN {
      safe["PG_DB"] = 1
      safe["PG_USER"] = 1
      safe["PG_PORT"] = 1
      safe["REDIS_PORT"] = 1
      safe["MQTT_PORT"] = 1
      safe["RABBITMQ_USER"] = 1
      safe["RABBITMQ_PORT"] = 1
      safe["RABBITMQ_MGMT_PORT"] = 1
      safe["GATEWAY_ID"] = 1
      safe["GATEWAY_BUFFER_PATH"] = 1
      safe["GATEWAY_USE_LOCAL_DEVICE_CONFIG_FALLBACK"] = 1
      safe["GATEWAY_BACKEND_URL"] = 1
      safe["GATEWAY_ALLOWED_HOSTS"] = 1
      safe["GATEWAY_UPLOAD_INTERVAL"] = 1
      safe["EDGE_PORT"] = 1
      safe["EDGE_BLUEGREEN_PORT"] = 1
      safe["INTERNAL_BIND_ADDRESS"] = 1
      safe["PUBLIC_BIND_ADDRESS"] = 1
      safe["BACKEND_PORT"] = 1
      safe["FRONTEND_PORT"] = 1
      safe["ASPNETCORE_ENVIRONMENT"] = 1
      safe["DISABLE_RATE_LIMITING"] = 1
      safe["FILE_STORAGE_PROVIDER"] = 1
      safe["FILE_STORAGE_BASE_PATH"] = 1
      safe["LLM_MODEL"] = 1
      safe["VAPID__SUBJECT"] = 1
      safe["SMTP_PORT"] = 1
      safe["SMTP_ENABLE_SSL"] = 1
      safe["BEHIND_PROXY"] = 1
      safe["TRUSTED_PROXY_NETWORKS"] = 1
      safe["RATE_LIMITING_PERMIT_LIMIT"] = 1
      safe["RATE_LIMITING_AUTH_PERMIT_LIMIT"] = 1
      safe["RATE_LIMITING_TENANT_PERMIT_LIMIT"] = 1
      safe["RATE_LIMITING_WINDOW"] = 1
      safe["SEED_DEMO_DATA"] = 1
      safe["SEED_TENANT2_ACCOUNT"] = 1
      safe["DOMAIN"] = 1
      safe["FRONTEND_URL"] = 1
      safe["EVALUATION_ALLOW_GROUND_TRUTH_INGESTION"] = 1
      safe["EVALUATION_TENANT_ID"] = 1
      safe["OUTBOUND_HTTP_ALLOW_PRIVATE_NETWORKS"] = 1
      safe["EVENTBUS_PROVIDER"] = 1
      safe["ALLOW_INMEMORY_EVENTBUS_IN_PRODUCTION"] = 1
      safe["EVENTBUS_OUTBOX_ENABLED"] = 1
      safe["EVENTBUS_OUTBOX_POLL_INTERVAL_SECONDS"] = 1
      safe["EVENTBUS_OUTBOX_BATCH_SIZE"] = 1
      safe["EVENTBUS_OUTBOX_LEASE_SECONDS"] = 1
      safe["EVENTBUS_OUTBOX_MAX_BACKOFF_SECONDS"] = 1
      safe["EVENTBUS_OUTBOX_RETENTION_DAYS"] = 1
      safe["SEQ_PORT"] = 1
      safe["SEQ_RETENTION_TIME"] = 1
      safe["PROMETHEUS_PORT"] = 1
      safe["GRAFANA_PORT"] = 1
      safe["GRAFANA_USER"] = 1
      safe["ALERTMANAGER_PORT"] = 1
      safe["JAEGER_SPAN_STORAGE_TYPE"] = 1
      safe["JAEGER_BADGER_EPHEMERAL"] = 1
      safe["SSL_CERT_PATH"] = 1
      safe["SSL_KEY_PATH"] = 1
      safe["READONLY_DB_HOST"] = 1
      safe["READONLY_DB_PORT"] = 1
    }
    /^[A-Za-z_][A-Za-z0-9_]*=/ {
      if ($1 in safe) print
    }
  ' "$ENV_FILE" > "$RECOVERY_ENV_FILE"

  local recovery_entry
  local recovery_key
  local recovery_value
  local recovery_defaults=(
    "PG_PASSWORD=recovery-placeholder"
    "REDIS_PASSWORD=recovery-placeholder"
    "RABBITMQ_IMAGE=rabbitmq:recovery-placeholder"
    "RABBITMQ_PASSWORD=recovery-placeholder"
    "JWT_SECRET=recovery-placeholder"
    "TOTP_ENCRYPTION_KEY=recovery-placeholder"
    "PII_ENCRYPTION_KEY=recovery-placeholder"
    "AUTOMAPPER_LICENSE_KEY=recovery-placeholder"
    "GATEWAY_AUTH_KEY=recovery-placeholder"
    "GATEWAY_TENANT_ID=00000000-0000-0000-0000-000000000000"
    "MQTT_USERNAME=recovery-placeholder"
    "MQTT_PASSWORD=recovery-placeholder"
    "SEED_ADMIN_PASSWORD=recovery-placeholder"
    "SEED_LEAD_PASSWORD=recovery-placeholder"
    "SEED_TECH_PASSWORD=recovery-placeholder"
    "SEED_OPERATOR_PASSWORD=recovery-placeholder"
    "SEED_VIEWER_PASSWORD=recovery-placeholder"
    "FRONTEND_URL=https://localhost"
    "SEQ_ADMIN_PASSWORD=recovery-placeholder"
    "GRAFANA_PASSWORD=recovery-placeholder"
  )
  for recovery_entry in "${recovery_defaults[@]}"; do
    recovery_key="${recovery_entry%%=*}"
    recovery_value="${recovery_entry#*=}"
    printf '%s=%s\n' "$recovery_key" "$recovery_value" >> "$RECOVERY_ENV_FILE"
  done

  COMPOSE_ENV_FILE="$RECOVERY_ENV_FILE"
}

action="${1:-}"
if [[ -z "$action" ]]; then
  usage >&2
  exit 2
fi

if [[ "$action" = "--help" || "$action" = "-h" ]]; then
  usage
  exit 0
fi

if [[ "$action" = "--check" ]]; then
  [[ "$#" -eq 1 ]] || fatal "--check 不接受额外参数"
  run_preflight
  exit 0
fi

case "$action" in
  up|start|restart|build|pull|create|run|scale)
    run_preflight
    ;;
  down|stop|kill|rm|pause|unpause|ps|logs|top|stats|events|images|port|version|config|exec)
    prepare_recovery_env
    ;;
  *)
    usage >&2
    fatal "不支持的 Compose 操作：$action"
    ;;
esac

set +e
"$DOCKER_BIN" compose \
  --env-file "$COMPOSE_ENV_FILE" \
  -f "$COMPOSE_FILE" \
  "$@"
compose_status=$?
set -e
exit "$compose_status"
