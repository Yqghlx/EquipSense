#!/usr/bin/env bash
# EquipSense 默认生产滚动部署脚本。
#
# 该脚本只编排 backend/frontend/edgegateway；有状态服务和数据卷不属于部署变更范围。

set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_DIR="${COMPOSE_DIR:-$SCRIPT_DIR}"
DEPLOY_HEALTH_URL="${DEPLOY_HEALTH_URL:-http://localhost:8080/health/ready}"
DEPLOY_EDGE_HEALTH_URL="${DEPLOY_EDGE_HEALTH_URL:-}"
DEPLOY_MAX_ATTEMPTS="${DEPLOY_MAX_ATTEMPTS:-12}"
DEPLOY_POLL_INTERVAL_SECONDS="${DEPLOY_POLL_INTERVAL_SECONDS:-10}"
DEPLOY_INITIAL_DELAY_SECONDS="${DEPLOY_INITIAL_DELAY_SECONDS:-30}"
DEPLOY_ROLLBACK_INITIAL_DELAY_SECONDS="${DEPLOY_ROLLBACK_INITIAL_DELAY_SECONDS:-10}"
DEPLOY_HEALTH_TIMEOUT_SECONDS="${DEPLOY_HEALTH_TIMEOUT_SECONDS:-5}"

TARGET_TAG=""
CURRENT_TAG=""
MUTATION_STARTED=false
VERSION_TEMP_FILE=""
COMPOSE=()
DEPLOY_LOCK_DIR=""
DEPLOY_LOCK_OWNED=false

fatal() {
  printf '部署失败：%s\n' "$*" >&2
  exit 1
}

release_deploy_lock() {
  if [ "$DEPLOY_LOCK_OWNED" = true ]; then
    rm -f "$DEPLOY_LOCK_DIR/pid" 2>/dev/null || true
    rmdir "$DEPLOY_LOCK_DIR" 2>/dev/null || true
    DEPLOY_LOCK_OWNED=false
  fi
}

is_valid_tag() {
  local tag="$1"
  [[ -n "$tag" ]] \
    && [[ "${#tag}" -le 128 ]] \
    && [[ "$tag" =~ ^[A-Za-z0-9_][A-Za-z0-9_.-]*$ ]]
}

require_nonnegative_integer() {
  local name="$1"
  local value="$2"
  [[ "$value" =~ ^[0-9]+$ ]] || fatal "$name 必须是非负整数"
}

wait_for_health() {
  local label="$1"
  local initial_delay="$2"
  local attempt
  local http_code
  local edge_http_code
  local frontend_container
  local frontend_status

  if [[ "$initial_delay" -gt 0 ]]; then
    printf '等待 %s 启动（%s 秒）……\n' "$label" "$initial_delay"
    sleep "$initial_delay"
  fi

  for ((attempt = 1; attempt <= DEPLOY_MAX_ATTEMPTS; attempt++)); do
    if ! http_code="$(curl --silent --output /dev/null --write-out '%{http_code}' \
      --connect-timeout "$DEPLOY_HEALTH_TIMEOUT_SECONDS" \
      --max-time "$DEPLOY_HEALTH_TIMEOUT_SECONDS" \
      "$DEPLOY_HEALTH_URL" 2>/dev/null)"; then
      http_code="000"
    fi
    if ! edge_http_code="$(curl --silent --output /dev/null --write-out '%{http_code}' \
      --connect-timeout "$DEPLOY_HEALTH_TIMEOUT_SECONDS" \
      --max-time "$DEPLOY_HEALTH_TIMEOUT_SECONDS" \
      "$DEPLOY_EDGE_HEALTH_URL" 2>/dev/null)"; then
      edge_http_code="000"
    fi
    frontend_container="$("${COMPOSE[@]}" ps -q frontend 2>/dev/null || true)"
    frontend_status=""
    if [[ -n "$frontend_container" ]]; then
      frontend_status="$(docker inspect \
        --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' \
        "$frontend_container" 2>/dev/null || true)"
    fi

    if [[ "$http_code" = "200" && "$edge_http_code" = "200" && "$frontend_status" = "healthy" ]]; then
      printf '✅ %s健康检查通过（第 %s 次探测）\n' "$label" "$attempt"
      return 0
    fi

    printf '等待 %s健康检查……（%s/%s，backend=%s，edgegateway=%s，frontend=%s）\n' \
      "$label" "$attempt" "$DEPLOY_MAX_ATTEMPTS" "$http_code" "$edge_http_code" "${frontend_status:-missing}"
    if [[ "$attempt" -lt "$DEPLOY_MAX_ATTEMPTS" ]]; then
      sleep "$DEPLOY_POLL_INTERVAL_SECONDS"
    fi
  done

  return 1
}

rollback() {
  if ! is_valid_tag "$CURRENT_TAG" || [[ "$CURRENT_TAG" = "$TARGET_TAG" ]]; then
    printf '🚨 严重：没有可用的历史版本，无法自动回滚；请保留现场并人工恢复。\n' >&2
    return 1
  fi

  printf '开始回滚到 %s（仅使用本机已有镜像）……\n' "$CURRENT_TAG" >&2
  export TAG="$CURRENT_TAG"
  if ! "${COMPOSE[@]}" up -d --no-deps --force-recreate --pull never backend frontend edgegateway; then
    printf '🚨 严重：旧版本容器重建失败，自动回滚未完成。\n' >&2
    return 1
  fi

  if wait_for_health "回滚版本 $CURRENT_TAG " "$DEPLOY_ROLLBACK_INITIAL_DELAY_SECONDS"; then
    if ! run_readiness_gate --runtime; then
      printf '🚨 严重：回滚后的全量运行态 readiness 失败；请立即按运维剧本人工处置。\n' >&2
      return 1
    fi
    printf '✅ 回滚验证通过：应用探针和全量运行态 readiness 均通过，当前版本仍为 %s。\n' \
      "$CURRENT_TAG" >&2
    return 0
  fi

  printf '🚨 严重：回滚健康检查失败；请立即按运维剧本人工处置。\n' >&2
  return 1
}

handle_failure() {
  local original_status="$1"
  trap - ERR
  set +e

  if [[ -n "$VERSION_TEMP_FILE" && -f "$VERSION_TEMP_FILE" ]]; then
    rm -f -- "$VERSION_TEMP_FILE"
  fi

  if [[ "$MUTATION_STARTED" = true ]]; then
    rollback
  else
    printf '部署在运行态变更前失败，无需回滚。\n' >&2
  fi

  exit "$original_status"
}

trap 'handle_failure "$?"' ERR

[[ $# -eq 1 ]] || fatal "用法：deploy-production.sh <目标镜像标签>"
TARGET_TAG="$1"
is_valid_tag "$TARGET_TAG" || fatal "目标镜像标签不合法：$TARGET_TAG"

require_nonnegative_integer "DEPLOY_MAX_ATTEMPTS" "$DEPLOY_MAX_ATTEMPTS"
require_nonnegative_integer "DEPLOY_POLL_INTERVAL_SECONDS" "$DEPLOY_POLL_INTERVAL_SECONDS"
require_nonnegative_integer "DEPLOY_INITIAL_DELAY_SECONDS" "$DEPLOY_INITIAL_DELAY_SECONDS"
require_nonnegative_integer "DEPLOY_ROLLBACK_INITIAL_DELAY_SECONDS" "$DEPLOY_ROLLBACK_INITIAL_DELAY_SECONDS"
require_nonnegative_integer "DEPLOY_HEALTH_TIMEOUT_SECONDS" "$DEPLOY_HEALTH_TIMEOUT_SECONDS"
[[ "$DEPLOY_MAX_ATTEMPTS" -gt 0 ]] || fatal "DEPLOY_MAX_ATTEMPTS 必须大于 0"
[[ "$DEPLOY_HEALTH_TIMEOUT_SECONDS" -gt 0 ]] || fatal "DEPLOY_HEALTH_TIMEOUT_SECONDS 必须大于 0"
[[ "$DEPLOY_HEALTH_URL" =~ ^https?://[^[:space:]]+$ ]] \
  || fatal "DEPLOY_HEALTH_URL 必须是 http:// 或 https:// URL"

[[ -d "$COMPOSE_DIR" ]] || fatal "部署目录不存在：$COMPOSE_DIR"
COMPOSE_DIR="$(cd "$COMPOSE_DIR" && pwd)"

for required_file in \
  "$COMPOSE_DIR/.env" \
  "$COMPOSE_DIR/validate-env.sh" \
  "$COMPOSE_DIR/production-readiness.sh" \
  "$COMPOSE_DIR/docker-compose.yml" \
  "$COMPOSE_DIR/docker-compose.prod.yml"; do
  [[ -f "$required_file" ]] || fatal "缺少必需文件 $required_file"
done

# 发布会拉取镜像、重建三个应用容器并原子更新版本记录；同一 Compose 目录
# 只能允许一个发布流程，避免两个版本互相覆盖健康探测和回滚状态。
DEPLOY_LOCK_DIR="$COMPOSE_DIR/.deploy.lock"
if ! mkdir "$DEPLOY_LOCK_DIR" 2>/dev/null; then
  lock_pid="$(cat "$DEPLOY_LOCK_DIR/pid" 2>/dev/null || true)"
  if [ -n "$lock_pid" ]; then
    fatal "已有部署任务正在运行或遗留锁（PID ${lock_pid}），请确认后再处理 $DEPLOY_LOCK_DIR"
  fi
  fatal "已有部署任务正在运行或遗留锁，请确认后再处理 $DEPLOY_LOCK_DIR"
fi
DEPLOY_LOCK_OWNED=true
trap release_deploy_lock EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
printf '%s\n' "$$" > "$DEPLOY_LOCK_DIR/pid"
chmod 600 "$DEPLOY_LOCK_DIR/pid"

# 部署脚本不会 source .env，避免把生产凭据带入当前 shell；仅读取并校验 EDGE_PORT，
# 让自定义边缘网关端口仍能被健康门禁覆盖。显式设置 DEPLOY_EDGE_HEALTH_URL 时优先使用它。
if [[ -z "$DEPLOY_EDGE_HEALTH_URL" ]]; then
  edge_port="${EDGE_PORT:-}"
  if [[ -z "$edge_port" ]]; then
    edge_port="$(awk -F= '$1 == "EDGE_PORT" { print $2 }' "$COMPOSE_DIR/.env" | tail -n 1)"
  fi
  edge_port="${edge_port:-8081}"
  [[ "$edge_port" =~ ^[0-9]{1,5}$ && "$edge_port" -ge 1 && "$edge_port" -le 65535 ]] \
    || fatal "EDGE_PORT 必须是 1-65535 的端口"
  DEPLOY_EDGE_HEALTH_URL="http://localhost:${edge_port}/health"
fi
[[ "$DEPLOY_EDGE_HEALTH_URL" =~ ^https?://[^[:space:]]+$ ]] \
  || fatal "DEPLOY_EDGE_HEALTH_URL 必须是 http:// 或 https:// URL"

command -v docker >/dev/null 2>&1 || fatal "未找到 docker 命令"
command -v curl >/dev/null 2>&1 || fatal "未找到 curl 命令"

COMPOSE=(
  docker compose
  --env-file "$COMPOSE_DIR/.env"
  -f "$COMPOSE_DIR/docker-compose.yml"
  -f "$COMPOSE_DIR/docker-compose.prod.yml"
)

run_readiness_gate() {
  local runtime_flag="${1:-}"
  local readiness_args=(
    --env-file "$COMPOSE_DIR/.env"
    --compose-file "$COMPOSE_DIR/docker-compose.yml"
    --compose-file "$COMPOSE_DIR/docker-compose.prod.yml"
  )
  if [ "$runtime_flag" = "--runtime" ]; then
    readiness_args+=(--runtime)
  fi
  bash "$COMPOSE_DIR/production-readiness.sh" "${readiness_args[@]}"
}

export TAG="$TARGET_TAG"

# 在登录仓库、拉取镜像或重建容器之前执行统一的生产配置与 Compose 门禁。
run_readiness_gate

VERSION_FILE="$COMPOSE_DIR/.last-deployed-tag"
if [[ -f "$VERSION_FILE" ]]; then
  IFS= read -r CURRENT_TAG < "$VERSION_FILE" || true
  CURRENT_TAG="${CURRENT_TAG%$'\r'}"
  is_valid_tag "$CURRENT_TAG" || fatal "历史版本记录不合法：$VERSION_FILE"
fi

printf '=== 部署版本 %s（当前：%s）===\n' "$TARGET_TAG" "${CURRENT_TAG:-无历史版本}"

if [[ "$CURRENT_TAG" = "$TARGET_TAG" ]]; then
  if wait_for_health "当前版本 $TARGET_TAG " 0; then
    if ! run_readiness_gate --runtime; then
      fatal "当前记录版本应用探针通过，但全量运行态 readiness 失败"
    fi
    trap - ERR
    printf '=== 当前版本已健康，无需重复部署：%s ===\n' "$TARGET_TAG"
    exit 0
  fi
  fatal "当前记录版本与目标一致，但服务健康检查失败"
fi

[[ -n "${GHCR_PULL_USER:-}" ]] || fatal "服务器未配置 GHCR_PULL_USER"
[[ -n "${GHCR_PULL_TOKEN:-}" ]] || fatal "服务器未配置 GHCR_PULL_TOKEN"

printf '%s' "$GHCR_PULL_TOKEN" \
  | docker login ghcr.io -u "$GHCR_PULL_USER" --password-stdin

# 拉取失败不会改变运行态，因此尚不需要回滚。
"${COMPOSE[@]}" pull backend frontend edgegateway

MUTATION_STARTED=true
"${COMPOSE[@]}" up -d --no-deps --force-recreate --pull never backend frontend edgegateway

if ! wait_for_health "目标版本 $TARGET_TAG " "$DEPLOY_INITIAL_DELAY_SECONDS"; then
  printf '目标版本健康检查失败。\n' >&2
  false
fi

if ! run_readiness_gate --runtime; then
  printf '目标版本全量运行态 readiness 失败。\n' >&2
  false
fi

VERSION_TEMP_FILE="$(mktemp "$COMPOSE_DIR/.last-deployed-tag.XXXXXX")"
printf '%s\n' "$TARGET_TAG" > "$VERSION_TEMP_FILE"
mv -f -- "$VERSION_TEMP_FILE" "$VERSION_FILE"
VERSION_TEMP_FILE=""
MUTATION_STARTED=false
trap - ERR

printf '=== 部署成功：%s ===\n' "$TARGET_TAG"
if ! "${COMPOSE[@]}" ps backend frontend edgegateway; then
  # 此处仅用于展示状态；目标版本已经通过健康检查并完成原子记账，
  # 短暂的 Docker 查询失败不应把一次成功部署误报为失败。
  printf '警告：部署已成功，但暂时无法展示容器状态，请稍后手工检查。\n' >&2
fi
