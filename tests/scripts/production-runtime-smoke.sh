#!/usr/bin/env bash
# Production 容器运行时 smoke gate。
#
# 该脚本只使用临时目录、临时凭据和临时 Compose volume，验证实际生产镜像
# 能否在 Production 环境启动并通过核心健康探针；设置 SMOKE_RUN_E2E=true 时，
# 会在同一套隔离容器内继续执行完整业务 E2E。

set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SMOKE_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/equipsense-production-smoke.XXXXXX")"
RUNTIME_DOCKER="$SMOKE_ROOT/docker"
COMPOSE=()
COMPOSE_READY=false

BACKEND_IMAGE="${SMOKE_BACKEND_IMAGE:-equipsense/backend:ci-smoke}"
FRONTEND_IMAGE="${SMOKE_FRONTEND_IMAGE:-equipsense/frontend:ci-smoke}"
EDGEGATEWAY_IMAGE="${SMOKE_EDGEGATEWAY_IMAGE:-equipsense/edgegateway:ci-smoke}"
PROJECT_NAME="${SMOKE_PROJECT_NAME:-equipsense-smoke-$(printf '%s' "$$" | tr -cd '0-9')}"

fatal() {
  printf 'Production smoke 失败：%s\n' "$*" >&2
  exit 1
}

SMOKE_RUN_E2E="${SMOKE_RUN_E2E:-false}"
case "$SMOKE_RUN_E2E" in
  true|TRUE|1)
    SMOKE_RUN_E2E=true
    ;;
  false|FALSE|0)
    SMOKE_RUN_E2E=false
    ;;
  *)
    fatal "SMOKE_RUN_E2E 仅支持 true/false"
    ;;
esac

# 端口参数也属于外部输入；在校验阶段失败时同样清理已创建的临时目录。
trap 'rm -rf -- "$SMOKE_ROOT"' EXIT

smoke_port_is_listening() {
  local smoke_port="$1"
  command -v lsof >/dev/null 2>&1 \
    && lsof -nP -iTCP:"$smoke_port" -sTCP:LISTEN -t >/dev/null 2>&1
}

smoke_port_range_is_free() {
  local smoke_port
  # 精简 CI runner 可能没有 lsof；此时保留随机候选，交给 Docker 的最终绑定检查。
  command -v lsof >/dev/null 2>&1 || return 0
  for smoke_port in "$@"; do
    if smoke_port_is_listening "$smoke_port"; then
      return 1
    fi
  done
  return 0
}

if [[ -n "${SMOKE_PORT_BASE:-}" ]]; then
  SMOKE_PORT_BASE="$SMOKE_PORT_BASE"
else
  # 每次 smoke 使用独立端口；候选端口已被占用时换候选，避免并发任务抢占固定端口。
  for _ in $(seq 1 20); do
    smoke_port_candidate=$((40000 + RANDOM % 20000))
    if smoke_port_range_is_free \
      "$smoke_port_candidate" "$((smoke_port_candidate + 1))" "$((smoke_port_candidate + 2))"; then
      SMOKE_PORT_BASE="$smoke_port_candidate"
      break
    fi
  done
  [[ -n "${SMOKE_PORT_BASE:-}" ]] || fatal "无法找到可用的 smoke 应用端口范围"
fi
[[ "$SMOKE_PORT_BASE" =~ ^[0-9]+$ ]] \
  || fatal "SMOKE_PORT_BASE 必须是数字"
[[ "$SMOKE_PORT_BASE" -ge 1024 && "$SMOKE_PORT_BASE" -le 65530 ]] \
  || fatal "SMOKE_PORT_BASE 必须位于 1024-65530"

BACKEND_PORT="${SMOKE_BACKEND_PORT:-$SMOKE_PORT_BASE}"
FRONTEND_PORT="${SMOKE_FRONTEND_PORT:-$((SMOKE_PORT_BASE + 1))}"
EDGE_PORT="${SMOKE_EDGE_PORT:-$((SMOKE_PORT_BASE + 2))}"
PG_PORT="${SMOKE_PG_PORT:-$((SMOKE_PORT_BASE + 10))}"
REDIS_PORT="${SMOKE_REDIS_PORT:-$((SMOKE_PORT_BASE + 11))}"
MQTT_PORT="${SMOKE_MQTT_PORT:-$((SMOKE_PORT_BASE + 12))}"
RABBITMQ_PORT="${SMOKE_RABBITMQ_PORT:-$((SMOKE_PORT_BASE + 13))}"
RABBITMQ_MGMT_PORT="${SMOKE_RABBITMQ_MGMT_PORT:-$((SMOKE_PORT_BASE + 14))}"

for smoke_port in \
  "$BACKEND_PORT" "$FRONTEND_PORT" "$EDGE_PORT" "$PG_PORT" "$REDIS_PORT" \
  "$MQTT_PORT" "$RABBITMQ_PORT" "$RABBITMQ_MGMT_PORT"; do
  [[ "$smoke_port" =~ ^[0-9]+$ && "$smoke_port" -ge 1024 && "$smoke_port" -le 65535 ]] \
    || fatal "smoke 端口必须位于 1024-65535"
done

for smoke_port in "$BACKEND_PORT" "$FRONTEND_PORT" "$EDGE_PORT"; do
  if smoke_port_is_listening "$smoke_port"; then
    fatal "smoke 应用端口已被占用：$smoke_port"
  fi
done

cleanup() {
  local exit_code="$?"
  trap - EXIT

  if [[ "$COMPOSE_READY" = true ]]; then
    "${COMPOSE[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
  fi
  rm -rf -- "$SMOKE_ROOT"
  exit "$exit_code"
}
trap cleanup EXIT

for required_command in docker openssl awk curl jq; do
  if ! command -v "$required_command" >/dev/null 2>&1; then
    fatal "缺少命令：$required_command"
  fi
done

if [[ "$SMOKE_RUN_E2E" = true ]]; then
  command -v npx >/dev/null 2>&1 || fatal "SMOKE_RUN_E2E=true 需要 npx"
  command -v node >/dev/null 2>&1 || fatal "SMOKE_RUN_E2E=true 需要 node"
  [[ -x "$PROJECT_ROOT/frontend/node_modules/.bin/playwright" ]] \
    || fatal "SMOKE_RUN_E2E=true 需要先在 frontend 执行 npm ci"
fi

if ! docker image inspect "$BACKEND_IMAGE" "$FRONTEND_IMAGE" "$EDGEGATEWAY_IMAGE" >/dev/null 2>&1; then
  fatal "找不到本地 smoke 镜像，请先构建 $BACKEND_IMAGE、$FRONTEND_IMAGE 和 $EDGEGATEWAY_IMAGE"
fi

mkdir -p "$RUNTIME_DOCKER/ssl" "$RUNTIME_DOCKER/mqtt-certs" "$RUNTIME_DOCKER/mqtt-ca" "$RUNTIME_DOCKER/mosquitto_passwd" "$RUNTIME_DOCKER/rabbitmq" "$RUNTIME_DOCKER/prometheus" "$RUNTIME_DOCKER/grafana/provisioning/datasources" "$RUNTIME_DOCKER/grafana/provisioning/dashboards"

# 只复制不含运行时凭据的配置；绝不复制仓库中的 .env、证书、私钥、密码文件和备份。
runtime_files=(
  docker-compose.yml
  docker-compose.smoke.yml
  mosquitto.prod.conf
  nginx.conf
  validate-env.sh
  generate-cert.sh
  generate-mqtt-cert.sh
  Dockerfile.backend
  Dockerfile.frontend
  Dockerfile.edgegateway
  entrypoint.sh
  nginx-entrypoint.sh
  prometheus.yml
  alertmanager.yml
  alertmanager-entrypoint.sh
)
for runtime_file in "${runtime_files[@]}"; do
  cp "$PROJECT_ROOT/docker/$runtime_file" "$RUNTIME_DOCKER/$runtime_file"
done
cp "$PROJECT_ROOT/docker/prometheus/rules.yml" "$RUNTIME_DOCKER/prometheus/rules.yml"
cp "$PROJECT_ROOT/docker/rabbitmq/rabbitmq.conf" "$RUNTIME_DOCKER/rabbitmq/rabbitmq.conf"
cp "$PROJECT_ROOT/docker/rabbitmq/definitions.json" "$RUNTIME_DOCKER/rabbitmq/definitions.json"
cp "$PROJECT_ROOT/docker/rabbitmq/start.sh" "$RUNTIME_DOCKER/rabbitmq/start.sh"
cp "$PROJECT_ROOT/docker/grafana/provisioning/datasources/prometheus.yml" "$RUNTIME_DOCKER/grafana/provisioning/datasources/prometheus.yml"
cp "$PROJECT_ROOT/docker/grafana/provisioning/dashboards/dashboard.yml" "$RUNTIME_DOCKER/grafana/provisioning/dashboards/dashboard.yml"

random_secret() {
  openssl rand -hex 32
}

PG_PASSWORD="$(random_secret)"
REDIS_PASSWORD="$(random_secret)"
RABBITMQ_PASSWORD="$(random_secret)"
JWT_SECRET="$(random_secret)$(random_secret)"
TOTP_ENCRYPTION_KEY="$(openssl rand -base64 32 | tr -d '\n')"
PII_ENCRYPTION_KEY="$(openssl rand -base64 32 | tr -d '\n')"
AUTOMAPPER_LICENSE_KEY="${SMOKE_AUTOMAPPER_LICENSE_KEY:-ci-smoke-license-$(random_secret)}"
GATEWAY_AUTH_KEY="$(random_secret)"
MQTT_USERNAME="smoke_mqtt"
MQTT_PASSWORD="$(random_secret)"
RABBITMQ_USER="smoke_rabbit"
SEED_ADMIN_PASSWORD="$(random_secret)"
SEED_LEAD_PASSWORD="$(random_secret)"
SEED_TECH_PASSWORD="$(random_secret)"
SEED_OPERATOR_PASSWORD="$(random_secret)"
SEED_VIEWER_PASSWORD="$(random_secret)"
SEED_TENANT2_PASSWORD="$(random_secret)"
SEQ_ADMIN_PASSWORD="$(random_secret)"
GRAFANA_PASSWORD="$(random_secret)"

SEED_TENANT2_ACCOUNT=false
if [[ "$SMOKE_RUN_E2E" = true ]]; then
  SEED_TENANT2_ACCOUNT=true
fi

RABBITMQ_IMAGE="$(awk -F= '$1 == "RABBITMQ_IMAGE" {print substr($0, index($0, "=") + 1); exit}' "$PROJECT_ROOT/docker/.env.example")"
MOSQUITTO_IMAGE="$(awk '$1 == "image:" && $2 ~ /^eclipse-mosquitto:/ {gsub(/"/, "", $2); print $2; exit}' "$PROJECT_ROOT/docker/docker-compose.yml")"
[[ -n "$RABBITMQ_IMAGE" ]] || fatal "无法从 .env.example 读取固定 RabbitMQ 镜像"
[[ -n "$MOSQUITTO_IMAGE" ]] || fatal "无法从生产 Compose 读取固定 Mosquitto 镜像"

runtime_env=(
  "ASPNETCORE_ENVIRONMENT=Production"
  "PG_DB=equipai_smoke"
  "PG_USER=postgres"
  "PG_PASSWORD=$PG_PASSWORD"
  "REDIS_PASSWORD=$REDIS_PASSWORD"
  "RABBITMQ_IMAGE=$RABBITMQ_IMAGE"
  "RABBITMQ_USER=$RABBITMQ_USER"
  "RABBITMQ_PASSWORD=$RABBITMQ_PASSWORD"
  "JWT_SECRET=$JWT_SECRET"
  "TOTP_ENCRYPTION_KEY=$TOTP_ENCRYPTION_KEY"
  "PII_ENCRYPTION_KEY=$PII_ENCRYPTION_KEY"
  "AUTOMAPPER_LICENSE_KEY=$AUTOMAPPER_LICENSE_KEY"
  "GATEWAY_AUTH_KEY=$GATEWAY_AUTH_KEY"
  "MQTT_USERNAME=$MQTT_USERNAME"
  "MQTT_PASSWORD=$MQTT_PASSWORD"
  "SEED_ADMIN_PASSWORD=$SEED_ADMIN_PASSWORD"
  "SEED_LEAD_PASSWORD=$SEED_LEAD_PASSWORD"
  "SEED_TECH_PASSWORD=$SEED_TECH_PASSWORD"
  "SEED_OPERATOR_PASSWORD=$SEED_OPERATOR_PASSWORD"
  "SEED_VIEWER_PASSWORD=$SEED_VIEWER_PASSWORD"
  "SEED_TENANT2_ACCOUNT=$SEED_TENANT2_ACCOUNT"
  "SEED_TENANT2_PASSWORD=$SEED_TENANT2_PASSWORD"
  "SEQ_ADMIN_PASSWORD=$SEQ_ADMIN_PASSWORD"
  "GRAFANA_PASSWORD=$GRAFANA_PASSWORD"
  "FRONTEND_URL=https://localhost:$FRONTEND_PORT"
  "INTERNAL_BIND_ADDRESS=127.0.0.1"
  "PUBLIC_BIND_ADDRESS=127.0.0.1"
  "PG_PORT=$PG_PORT"
  "REDIS_PORT=$REDIS_PORT"
  "MQTT_PORT=$MQTT_PORT"
  "RABBITMQ_PORT=$RABBITMQ_PORT"
  "RABBITMQ_MGMT_PORT=$RABBITMQ_MGMT_PORT"
  "BACKEND_PORT=$BACKEND_PORT"
  "FRONTEND_PORT=$FRONTEND_PORT"
  "SMOKE_BACKEND_IMAGE=$BACKEND_IMAGE"
  "SMOKE_FRONTEND_IMAGE=$FRONTEND_IMAGE"
  "SMOKE_EDGEGATEWAY_IMAGE=$EDGEGATEWAY_IMAGE"
  "GATEWAY_ID=smoke-gateway"
  "GATEWAY_TENANT_ID=11111111-1111-1111-1111-111111111111"
  "GATEWAY_BUFFER_PATH=/data/buffer.db"
  "EDGE_PORT=$EDGE_PORT"
  "GATEWAY_ALLOWED_HOSTS=edgegateway"
  "LLM_API_KEY="
  "OTEL_EXPORTER_OTLP_ENDPOINT="
)

if [[ "$SMOKE_RUN_E2E" = true ]]; then
  # 完整 E2E 验证业务链路，不验证限流阈值本身；仍保持限流中间件开启，
  # 仅把隔离验收环境的窗口额度调高，避免并发测试请求被当成暴力破解。
  runtime_env+=(
    "RATE_LIMITING_PERMIT_LIMIT=10000"
    "RATE_LIMITING_AUTH_PERMIT_LIMIT=10000"
    "RATE_LIMITING_TENANT_PERMIT_LIMIT=10000"
  )
fi

printf '%s\n' "${runtime_env[@]}" > "$RUNTIME_DOCKER/.env"
chmod 600 "$RUNTIME_DOCKER/.env"

# 证书只用于测试 TLS 握手，正式环境仍必须替换为正式域名证书。
bash "$RUNTIME_DOCKER/generate-cert.sh" localhost 365 >/dev/null
bash "$RUNTIME_DOCKER/generate-mqtt-cert.sh" mosquitto 365 >/dev/null
docker run --rm -v "$RUNTIME_DOCKER/mosquitto_passwd:/work" "$MOSQUITTO_IMAGE" mosquitto_passwd -c -b /work/passwd "$MQTT_USERNAME" "$MQTT_PASSWORD" >/dev/null
chmod 600 "$RUNTIME_DOCKER/mosquitto_passwd/passwd"

bash "$RUNTIME_DOCKER/validate-env.sh" "$RUNTIME_DOCKER/.env" --check-runtime-files >/dev/null

COMPOSE=(
  docker compose
  --project-name "$PROJECT_NAME"
  --env-file "$RUNTIME_DOCKER/.env"
  -f "$RUNTIME_DOCKER/docker-compose.yml"
  -f "$RUNTIME_DOCKER/docker-compose.smoke.yml"
)
"${COMPOSE[@]}" config --quiet
COMPOSE_READY=true
if ! "${COMPOSE[@]}" up -d postgres redis mosquitto rabbitmq backend edgegateway frontend >/dev/null; then
  # Compose 在依赖健康检查失败时通常只返回一句摘要；在清理临时资源前保留后端启动日志，
  # 否则迁移、配置或依赖连接类故障无法从 CI 输出定位。
  "${COMPOSE[@]}" logs --no-color --tail=200 backend >&2 || true
  exit 1
fi

wait_for_health() {
  local service="$1"
  for _ in $(seq 1 90); do
    local container_id
    local health
    container_id="$("${COMPOSE[@]}" ps -q "$service" 2>/dev/null || true)"
    if [[ -n "$container_id" ]]; then
      health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id" 2>/dev/null || true)"
      if [[ "$health" = healthy ]]; then
        return 0
      fi
      if [[ "$health" = unhealthy || "$health" = exited || "$health" = dead ]]; then
        printf '服务 %s 状态异常：%s\n' "$service" "$health" >&2
        "${COMPOSE[@]}" ps >&2 || true
        return 1
      fi
    fi
    sleep 2
  done

  printf '等待服务 %s 健康超时。\n' "$service" >&2
  "${COMPOSE[@]}" ps >&2 || true
  return 1
}

wait_for_http() {
  local url="$1"
  local curl_options="$2"
  for _ in $(seq 1 30); do
    if curl $curl_options --fail --silent --show-error --max-time 10 "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  fatal "HTTP 探针失败：$url"
}

wait_for_health backend
wait_for_health edgegateway
wait_for_health frontend

environment_name="$("${COMPOSE[@]}" exec -T backend printenv ASPNETCORE_ENVIRONMENT)"
[[ "$environment_name" = Production ]] || fatal "backend 未运行在 Production 环境"

wait_for_http "http://127.0.0.1:$BACKEND_PORT/health/startup" ""
wait_for_http "http://127.0.0.1:$BACKEND_PORT/health" ""
wait_for_http "http://127.0.0.1:$BACKEND_PORT/health/ready" ""
edge_health_response="$(curl --fail --silent --show-error --max-time 10 "http://127.0.0.1:$EDGE_PORT/health")" \
  || fatal "边缘网关健康端点失败"
jq -e --arg gateway_id "smoke-gateway" --arg tenant_id "11111111-1111-1111-1111-111111111111" \
  '(.gatewayId == $gateway_id) and (.tenantId == $tenant_id) and (.status == "healthy")' \
  <<<"$edge_health_response" >/dev/null \
  || fatal "边缘网关健康响应未包含预期的网关和租户"

# 断网缓冲必须真实写入 Compose 持久化卷；检查 SQLite 文件路径，防止仅挂载 /data
# 却继续写入镜像层 /app/data 的回归。
edge_container_id="$("${COMPOSE[@]}" ps -q edgegateway)"
[[ -n "$edge_container_id" ]] || fatal "无法获取 edgegateway 容器 ID"
docker exec "$edge_container_id" test -f /data/buffer.db \
  || fatal "边缘网关 SQLite 缓冲未写入 /data/buffer.db 持久化卷"

# 使用本次临时环境创建的观察者账户完成一次真实认证闭环；观察者不要求 MFA，
# 可以验证种子数据、密码哈希、JWT 签发和受保护 API 均在 Production 镜像中可用。
login_response="$(curl --fail --silent --show-error --max-time 10 \
  -H 'Content-Type: application/json' \
  --data-binary @- \
  "http://127.0.0.1:$BACKEND_PORT/api/v1/auth/login" <<JSON
{"username":"viewer","password":"$SEED_VIEWER_PASSWORD"}
JSON
)" || fatal "Production 种子观察者账户登录失败"
viewer_access_token="$(jq -r '.accessToken // empty' <<<"$login_response")"
[[ -n "$viewer_access_token" ]] || fatal "登录响应缺少访问令牌"
curl --fail --silent --show-error --max-time 10 \
  -H "Authorization: Bearer $viewer_access_token" \
  "http://127.0.0.1:$BACKEND_PORT/api/v1/auth/me" >/dev/null \
  || fatal "Production 访问令牌无法访问受保护的 /auth/me"

gateways_response="$(curl --fail --silent --show-error --max-time 10 \
  -H "Authorization: Bearer $viewer_access_token" \
  "http://127.0.0.1:$BACKEND_PORT/api/v1/gateways")" \
  || fatal "边缘网关心跳未能通过后端网关列表 API 读取"
jq -e --arg gateway_id "smoke-gateway" \
  'any(.[]; .gatewayId == $gateway_id and .status == "online")' \
  <<<"$gateways_response" >/dev/null \
  || fatal "边缘网关未在后端注册为 online"

wait_for_http "https://127.0.0.1:$FRONTEND_PORT/health" "-k"
wait_for_http "https://127.0.0.1:$FRONTEND_PORT/login" "-k"

proxy_status="$(curl -k --silent --show-error --max-time 10 -o /dev/null -w '%{http_code}' "https://127.0.0.1:$FRONTEND_PORT/api/v1/auth/me")"
case "$proxy_status" in
  401|403)
    ;;
  *)
    fatal "Nginx API 反向代理未返回预期未授权响应：HTTP $proxy_status"
    ;;
esac

if [[ "$SMOKE_RUN_E2E" = true ]]; then
  mfa_bootstrap_result="$(
    MFA_BOOTSTRAP_BASE_URL="http://127.0.0.1:$BACKEND_PORT" \
    MFA_BOOTSTRAP_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" \
    MFA_BOOTSTRAP_LEAD_PASSWORD="$SEED_LEAD_PASSWORD" \
    MFA_BOOTSTRAP_TENANT2_PASSWORD="$SEED_TENANT2_PASSWORD" \
    node "$PROJECT_ROOT/tests/scripts/production-e2e-mfa-bootstrap.mjs"
  )" || fatal "Production E2E 高权限账户 MFA 初始化失败"
  e2e_admin_totp_secret="$(jq -r '.adminTotpSecret // empty' <<<"$mfa_bootstrap_result")"
  e2e_lead_totp_secret="$(jq -r '.leadTotpSecret // empty' <<<"$mfa_bootstrap_result")"
  e2e_tenant2_totp_secret="$(jq -r '.tenant2TotpSecret // empty' <<<"$mfa_bootstrap_result")"
  [[ -n "$e2e_admin_totp_secret" && -n "$e2e_lead_totp_secret" && -n "$e2e_tenant2_totp_secret" ]] \
    || fatal "Production E2E MFA 初始化未返回完整临时密钥"

  printf '运行 Production 镜像完整业务 E2E……\n'
  (
    cd "$PROJECT_ROOT/frontend"
    PLAYWRIGHT_BASE_URL="https://127.0.0.1:$FRONTEND_PORT" \
    PLAYWRIGHT_API_BASE_URL="http://127.0.0.1:$BACKEND_PORT" \
    E2E_PRODUCTION=1 \
    E2E_FAST_LOGIN=1 \
    E2E_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" \
    E2E_LEAD_PASSWORD="$SEED_LEAD_PASSWORD" \
    E2E_ADMIN_TOTP_SECRET="$e2e_admin_totp_secret" \
    E2E_LEAD_TOTP_SECRET="$e2e_lead_totp_secret" \
    E2E_TENANT2_TOTP_SECRET="$e2e_tenant2_totp_secret" \
    E2E_TECH_PASSWORD="$SEED_TECH_PASSWORD" \
    E2E_OPERATOR_PASSWORD="$SEED_OPERATOR_PASSWORD" \
    E2E_VIEWER_PASSWORD="$SEED_VIEWER_PASSWORD" \
    E2E_TENANT2_PASSWORD="$SEED_TENANT2_PASSWORD" \
    npx --no-install playwright test e2e-comprehensive --reporter=list
  ) || fatal "Production 镜像完整业务 E2E 失败"
  printf 'Production 镜像完整业务 E2E 通过。\n'
fi

printf 'Production runtime smoke 通过：镜像、迁移、边缘网关缓存、健康探针、HTTPS 和 API 反向代理均正常。\n'
