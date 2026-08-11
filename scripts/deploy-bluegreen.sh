#!/usr/bin/env bash
# 蓝绿部署编排脚本（Blue-Green Deployment Orchestrator）
#
# 在生产服务器上执行，由 .github/workflows/ci.yml deploy job 调用（或手动）。
# 实现零停机部署：新版本起在非活跃颜色 → 后端健康门禁 → 网关切换并复验 →
# Nginx 原子切换 → 停旧颜色。
#
# 用法：
#   ./scripts/deploy-bluegreen.sh <TAG>
#
# 前置：
#   - docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.bluegreen.yml 已就位
#   - .active-color 文件记录当前活跃色（blue/green），首次部署不存在则默认 blue
#   - upstream-active.conf 文件记录 Nginx upstream 指向（由本脚本维护）
#   - GHCR_PULL_USER/GHCR_PULL_TOKEN 环境变量已配置（见 ci.yml deploy job 注释）
#
# 失败处理：
#   - 非活跃色或边缘网关健康检查失败 → 不切换，旧色继续服务，退出码 1
#   - 切换后新色异常 → 可手动回切（改 .active-color + upstream-active.conf + reload）

set -euo pipefail

[[ $# -eq 1 ]] || {
  echo "❌ 用法: deploy-bluegreen.sh <TAG>" >&2
  exit 1
}
TAG="$1"
COMPOSE_DIR="${COMPOSE_DIR:-$(cd "$(dirname "$0")/../docker" && pwd)}"
EDGE_BLUEGREEN_PORT="${EDGE_BLUEGREEN_PORT:-}"
BLUEGREEN_EDGE_HEALTH_URL="${BLUEGREEN_EDGE_HEALTH_URL:-}"
if ! COMPOSE_DIR="$(cd "$COMPOSE_DIR" 2>/dev/null && pwd)"; then
  echo "❌ 部署目录不存在：$COMPOSE_DIR" >&2
  exit 1
fi
if [ ! -f "$COMPOSE_DIR/.env" ]; then
  echo "❌ 未找到生产环境配置文件: $COMPOSE_DIR/.env" >&2
  exit 1
fi

COMPOSE=(
  docker compose
  --env-file "$COMPOSE_DIR/.env"
  -f "$COMPOSE_DIR/docker-compose.yml"
  -f "$COMPOSE_DIR/docker-compose.prod.yml"
  -f "$COMPOSE_DIR/docker-compose.bluegreen.yml"
)

cd "$COMPOSE_DIR"

# 蓝绿部署与默认滚动部署共享同一把 Compose 目录锁，避免两条发布路径同时
# 重建边缘网关、切换 upstream 或覆盖版本状态。
BLUEGREEN_LOCK_DIR="$COMPOSE_DIR/.deploy.lock"
BLUEGREEN_LOCK_OWNED=false
UPSTREAM_FILE="$COMPOSE_DIR/upstream-active.conf"
UPSTREAM_TEMP_FILE=""

release_bluegreen_lock() {
  if [ "$BLUEGREEN_LOCK_OWNED" = true ]; then
    rm -f "$BLUEGREEN_LOCK_DIR/pid" 2>/dev/null || true
    rmdir "$BLUEGREEN_LOCK_DIR" 2>/dev/null || true
    BLUEGREEN_LOCK_OWNED=false
  fi
}

cleanup_bluegreen() {
  if [ -n "$UPSTREAM_TEMP_FILE" ]; then
    rm -f "$UPSTREAM_TEMP_FILE" 2>/dev/null || true
    UPSTREAM_TEMP_FILE=""
  fi
  release_bluegreen_lock
}

if ! mkdir "$BLUEGREEN_LOCK_DIR" 2>/dev/null; then
  lock_pid="$(cat "$BLUEGREEN_LOCK_DIR/pid" 2>/dev/null || true)"
  if [ -n "$lock_pid" ]; then
    echo "❌ 已有部署任务正在运行或遗留锁（PID ${lock_pid}），请确认后再处理 $BLUEGREEN_LOCK_DIR" >&2
  else
    echo "❌ 已有部署任务正在运行或遗留锁，请确认后再处理 $BLUEGREEN_LOCK_DIR" >&2
  fi
  exit 1
fi
BLUEGREEN_LOCK_OWNED=true
trap cleanup_bluegreen EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
printf '%s\n' "$$" > "$BLUEGREEN_LOCK_DIR/pid"
chmod 600 "$BLUEGREEN_LOCK_DIR/pid"

write_upstream_atomic() {
  local color="$1"
  if ! UPSTREAM_TEMP_FILE="$(mktemp "$UPSTREAM_FILE.XXXXXX")"; then
    echo "❌ 无法创建 Nginx upstream 临时文件：$UPSTREAM_FILE" >&2
    return 1
  fi

  # 先在同一目录完整写入，再用同文件系统 mv 替换，避免 Nginx 读到半写配置。
  if ! cat > "$UPSTREAM_TEMP_FILE" <<EOF
# 由 deploy-bluegreen.sh 自动生成 — $(date -u +%FT%TZ)
upstream backend_active { server backend-$color:8080; }
upstream frontend_active { server frontend-$color:80; }
EOF
  then
    rm -f "$UPSTREAM_TEMP_FILE" 2>/dev/null || true
    UPSTREAM_TEMP_FILE=""
    return 1
  fi
  chmod 644 "$UPSTREAM_TEMP_FILE"
  if ! mv -f -- "$UPSTREAM_TEMP_FILE" "$UPSTREAM_FILE"; then
    echo "❌ 无法原子替换 Nginx upstream 文件：$UPSTREAM_FILE" >&2
    rm -f "$UPSTREAM_TEMP_FILE" 2>/dev/null || true
    UPSTREAM_TEMP_FILE=""
    return 1
  fi
  UPSTREAM_TEMP_FILE=""
}

write_state_atomic() {
  local file="$1"
  local value="$2"
  local temp_file
  if ! temp_file="$(mktemp "$file.XXXXXX")"; then
    echo "❌ 无法创建发布状态临时文件：$file" >&2
    return 1
  fi
  if ! printf '%s\n' "$value" > "$temp_file"; then
    rm -f "$temp_file" 2>/dev/null || true
    return 1
  fi
  chmod 600 "$temp_file"
  if ! mv -f -- "$temp_file" "$file"; then
    echo "❌ 无法原子更新发布状态文件：$file" >&2
    rm -f "$temp_file" 2>/dev/null || true
    return 1
  fi
}

if [[ -z "$EDGE_BLUEGREEN_PORT" ]]; then
  EDGE_BLUEGREEN_PORT="$(awk -F= '$1 == "EDGE_BLUEGREEN_PORT" { print $2 }' "$COMPOSE_DIR/.env" | tail -n 1)"
fi
EDGE_BLUEGREEN_PORT="${EDGE_BLUEGREEN_PORT:-18081}"
[[ "$EDGE_BLUEGREEN_PORT" =~ ^[0-9]{1,5}$ && "$EDGE_BLUEGREEN_PORT" -ge 1 && "$EDGE_BLUEGREEN_PORT" -le 65535 ]] || {
  echo "❌ EDGE_BLUEGREEN_PORT 必须是 1-65535 的端口。" >&2
  exit 1
}
export EDGE_BLUEGREEN_PORT
if [[ -z "$BLUEGREEN_EDGE_HEALTH_URL" ]]; then
  BLUEGREEN_EDGE_HEALTH_URL="http://localhost:${EDGE_BLUEGREEN_PORT}/health"
fi
[[ "$BLUEGREEN_EDGE_HEALTH_URL" =~ ^https?://[^[:space:]]+$ ]] || {
  echo "❌ BLUEGREEN_EDGE_HEALTH_URL 必须是 http:// 或 https:// URL。" >&2
  exit 1
}

is_valid_tag() {
  local tag="$1"
  [[ -n "$tag" ]] \
    && [[ "${#tag}" -le 128 ]] \
    && [[ "$tag" =~ ^[A-Za-z0-9_][A-Za-z0-9_.-]*$ ]]
}

is_valid_tag "$TAG" || {
  echo "❌ 目标镜像标签不合法：$TAG" >&2
  exit 1
}

CURRENT_TAG=$(cat .last-deployed-tag 2>/dev/null || true)
CURRENT_TAG="${CURRENT_TAG%$'\r'}"
if ! is_valid_tag "$CURRENT_TAG"; then
  echo "❌ 缺少可回切的历史版本记录 .last-deployed-tag，蓝绿部署拒绝继续。" >&2
  exit 1
fi

# ── 1. 确定当前活跃色 + 目标（非活跃）色 ──
ACTIVE_COLOR=$(cat .active-color 2>/dev/null || echo "blue")
case "$ACTIVE_COLOR" in
  blue)
    TARGET_COLOR="green"
    TARGET_BACKEND_PORT=8082
    ;;
  green)
    TARGET_COLOR="blue"
    TARGET_BACKEND_PORT=8081
    ;;
  *)
    echo "❌ .active-color 只能是 blue 或 green，实际为：$ACTIVE_COLOR" >&2
    exit 1
    ;;
esac

export TAG
export GATEWAY_BACKEND_URL="http://backend-$TARGET_COLOR:8080"

echo "=== 蓝绿部署: $TAG ==="
echo "当前活跃: $ACTIVE_COLOR → 部署目标: $TARGET_COLOR (backend :$TARGET_BACKEND_PORT)"

# ── 2. 部署前置门禁：先校验凭据和 Compose 渲染，再接触远程镜像 ──
if [ ! -f "$COMPOSE_DIR/validate-env.sh" ]; then
  echo "❌ 未找到生产环境校验器: $COMPOSE_DIR/validate-env.sh" >&2
  exit 1
fi
bash "$COMPOSE_DIR/validate-env.sh" "$COMPOSE_DIR/.env" --check-runtime-files
export TAG
"${COMPOSE[@]}" config --quiet

# ── 3. 登录 GHCR 拉取私有镜像（凭证从服务器环境变量，不通过 CI 传输） ──
if [ -z "${GHCR_PULL_TOKEN:-}" ] || [ -z "${GHCR_PULL_USER:-}" ]; then
  echo "❌ 服务器未配置 GHCR_PULL_USER/GHCR_PULL_TOKEN 环境变量" >&2
  exit 1
fi
echo "$GHCR_PULL_TOKEN" | docker login ghcr.io -u "$GHCR_PULL_USER" --password-stdin

# ── 4. 在目标色上拉取新镜像 + 启动（旧色仍服务流量，零停机） ──
echo "拉取 $TAG 镜像到 $TARGET_COLOR..."
"${COMPOSE[@]}" pull backend-$TARGET_COLOR frontend-$TARGET_COLOR edgegateway
"${COMPOSE[@]}" --profile "$TARGET_COLOR" up -d --no-deps backend-$TARGET_COLOR frontend-$TARGET_COLOR

# ── 5. 健康门禁：轮询目标色后端 /health（旧色仍在线，不影响用户） ──
echo "等待 $TARGET_COLOR 后端健康检查..."
sleep 10  # 给容器初始化时间
HEALTHY=false
for i in $(seq 1 12); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    --connect-timeout 5 --max-time 10 \
    "http://localhost:$TARGET_BACKEND_PORT/health" || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ $TARGET_COLOR 后端健康检查通过（第 $i 次探测）"
    HEALTHY=true
    break
  fi
  echo "等待 $TARGET_COLOR 健康检查... ($i/12, HTTP $HTTP_CODE)"
  sleep 10
done

if [ "$HEALTHY" != "true" ]; then
  echo "❌ $TARGET_COLOR 健康检查失败，不切换流量。旧色 $ACTIVE_COLOR 继续服务。"
  echo "清理失败的目标色容器..."
  "${COMPOSE[@]}" --profile "$TARGET_COLOR" stop backend-$TARGET_COLOR frontend-$TARGET_COLOR || true
  exit 1
fi

# ── 6. 更新单实例边缘网关：指向已通过健康门禁的目标后端 ─────────────
echo "更新边缘网关到 $TARGET_COLOR 后端并执行健康检查..."
if ! "${COMPOSE[@]}" up -d --no-deps --force-recreate --pull never edgegateway; then
  echo "❌ 边缘网关重建失败，不切换流量。" >&2
  "${COMPOSE[@]}" --profile "$TARGET_COLOR" stop backend-$TARGET_COLOR frontend-$TARGET_COLOR || true
  export TAG="$CURRENT_TAG"
  export GATEWAY_BACKEND_URL="http://backend-$ACTIVE_COLOR:8080"
  "${COMPOSE[@]}" up -d --no-deps --force-recreate --pull never edgegateway || true
  exit 1
fi

EDGE_HEALTHY=false
for i in $(seq 1 12); do
  EDGE_HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    --connect-timeout 5 --max-time 10 "$BLUEGREEN_EDGE_HEALTH_URL" || echo "000")
  if [ "$EDGE_HTTP_CODE" = "200" ]; then
    echo "✅ 边缘网关健康检查通过（第 $i 次探测）"
    EDGE_HEALTHY=true
    break
  fi
  echo "等待边缘网关健康检查... ($i/12, HTTP $EDGE_HTTP_CODE)"
  [ "$i" -lt 12 ] && sleep 10
done

if [ "$EDGE_HEALTHY" != "true" ]; then
  echo "❌ 边缘网关健康检查失败，不切换流量。" >&2
  "${COMPOSE[@]}" --profile "$TARGET_COLOR" stop backend-$TARGET_COLOR frontend-$TARGET_COLOR || true
  export TAG="$CURRENT_TAG"
  export GATEWAY_BACKEND_URL="http://backend-$ACTIVE_COLOR:8080"
  if ! "${COMPOSE[@]}" up -d --no-deps --force-recreate --pull never edgegateway; then
    echo "🚨 严重：边缘网关旧版本恢复失败，请立即人工处置。" >&2
  fi
  exit 1
fi

# ── 7. 原子切换：重写 Nginx upstream → reload（<1s 中断） ──
echo "切换 Nginx upstream 到 $TARGET_COLOR..."
if ! write_upstream_atomic "$TARGET_COLOR"; then
  echo "❌ Nginx upstream 写入失败，回滚目标色。" >&2
  "${COMPOSE[@]}" --profile "$TARGET_COLOR" stop backend-$TARGET_COLOR frontend-$TARGET_COLOR || true
  export TAG="$CURRENT_TAG"
  export GATEWAY_BACKEND_URL="http://backend-$ACTIVE_COLOR:8080"
  "${COMPOSE[@]}" up -d --no-deps --force-recreate --pull never edgegateway || true
  exit 1
fi

# router 容器挂载了 upstream-active.conf，reload 即生效
docker exec equipai-router nginx -t && \
docker exec equipai-router nginx -s reload || {
  echo "❌ Nginx reload 失败，回滚 upstream"
  if ! write_upstream_atomic "$ACTIVE_COLOR"; then
    echo "🚨 严重：Nginx upstream 回切文件写入失败，请立即人工处置。" >&2
  fi
  docker exec equipai-router nginx -s reload || true
  "${COMPOSE[@]}" --profile "$TARGET_COLOR" stop backend-$TARGET_COLOR frontend-$TARGET_COLOR || true
  export TAG="$CURRENT_TAG"
  export GATEWAY_BACKEND_URL="http://backend-$ACTIVE_COLOR:8080"
  if ! "${COMPOSE[@]}" up -d --no-deps --force-recreate --pull never edgegateway; then
    echo "🚨 严重：Nginx 回切后边缘网关恢复失败，请立即人工处置。" >&2
  fi
  exit 1
}

# ── 8. 优雅停止旧色（drain 30s 让现有连接完成） ──
echo "新色 $TARGET_COLOR 已接管流量。优雅停止旧色 $ACTIVE_COLOR（drain 30s）..."
sleep 30
"${COMPOSE[@]}" --profile "$ACTIVE_COLOR" stop backend-$ACTIVE_COLOR frontend-$ACTIVE_COLOR || true

# ── 9. 记录新活跃色 + 版本 ──
if ! write_state_atomic ".active-color" "$TARGET_COLOR" \
  || ! write_state_atomic ".last-deployed-tag" "$TAG"; then
  echo "🚨 严重：流量已切换但发布状态记录失败，请立即人工核对 active-color 和版本。" >&2
  exit 1
fi
echo "=== 蓝绿部署成功: $TAG (active=$TARGET_COLOR) ==="
"${COMPOSE[@]}" --profile "$TARGET_COLOR" ps backend-$TARGET_COLOR frontend-$TARGET_COLOR edgegateway
