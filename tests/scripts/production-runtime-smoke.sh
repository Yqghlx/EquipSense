#!/usr/bin/env bash
# Production 容器运行时 smoke gate。
#
# 该脚本只使用临时目录、临时凭据和临时 Compose volume，验证实际生产镜像
# 能否在 Production 环境启动并通过核心健康探针。它不执行完整业务 E2E。

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
PROJECT_NAME="${SMOKE_PROJECT_NAME:-equipsense-smoke-$(printf '%s' "$$" | tr -cd '0-9')}"
BACKEND_PORT="${SMOKE_BACKEND_PORT:-58080}"
FRONTEND_PORT="${SMOKE_FRONTEND_PORT:-58443}"

fatal() {
  printf 'Production smoke 失败：%s\n' "$*" >&2
  exit 1
}

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

if ! docker image inspect "$BACKEND_IMAGE" "$FRONTEND_IMAGE" >/dev/null 2>&1; then
  fatal "找不到本地 smoke 镜像，请先构建 $BACKEND_IMAGE 和 $FRONTEND_IMAGE"
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
SEQ_ADMIN_PASSWORD="$(random_secret)"
GRAFANA_PASSWORD="$(random_secret)"

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
  "AUTOMAPPER_LICENSE_KEY=$AUTOMAPPER_LICENSE_KEY"
  "GATEWAY_AUTH_KEY=$GATEWAY_AUTH_KEY"
  "MQTT_USERNAME=$MQTT_USERNAME"
  "MQTT_PASSWORD=$MQTT_PASSWORD"
  "SEED_ADMIN_PASSWORD=$SEED_ADMIN_PASSWORD"
  "SEED_LEAD_PASSWORD=$SEED_LEAD_PASSWORD"
  "SEED_TECH_PASSWORD=$SEED_TECH_PASSWORD"
  "SEED_OPERATOR_PASSWORD=$SEED_OPERATOR_PASSWORD"
  "SEED_VIEWER_PASSWORD=$SEED_VIEWER_PASSWORD"
  "SEED_TENANT2_ACCOUNT=false"
  "SEQ_ADMIN_PASSWORD=$SEQ_ADMIN_PASSWORD"
  "GRAFANA_PASSWORD=$GRAFANA_PASSWORD"
  "FRONTEND_URL=https://localhost:$FRONTEND_PORT"
  "INTERNAL_BIND_ADDRESS=127.0.0.1"
  "PUBLIC_BIND_ADDRESS=127.0.0.1"
  "PG_PORT=55432"
  "REDIS_PORT=56379"
  "MQTT_PORT=58883"
  "RABBITMQ_PORT=55672"
  "RABBITMQ_MGMT_PORT=55673"
  "BACKEND_PORT=$BACKEND_PORT"
  "FRONTEND_PORT=$FRONTEND_PORT"
  "SMOKE_BACKEND_IMAGE=$BACKEND_IMAGE"
  "SMOKE_FRONTEND_IMAGE=$FRONTEND_IMAGE"
  "LLM_API_KEY="
  "OTEL_EXPORTER_OTLP_ENDPOINT="
)
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
"${COMPOSE[@]}" up -d postgres redis mosquitto rabbitmq backend frontend >/dev/null

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
wait_for_health frontend

environment_name="$("${COMPOSE[@]}" exec -T backend printenv ASPNETCORE_ENVIRONMENT)"
[[ "$environment_name" = Production ]] || fatal "backend 未运行在 Production 环境"

wait_for_http "http://127.0.0.1:$BACKEND_PORT/health/startup" ""
wait_for_http "http://127.0.0.1:$BACKEND_PORT/health" ""
wait_for_http "http://127.0.0.1:$BACKEND_PORT/health/ready" ""

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

printf 'Production runtime smoke 通过：镜像、迁移、健康探针、HTTPS 和 API 反向代理均正常。\n'
