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

# 生产 E2E 默认执行完整套件；调试时允许通过数组参数安全地缩小范围，
# 不使用 eval，避免测试筛选表达式被 shell 二次解释。
SMOKE_E2E_WORKERS="${SMOKE_E2E_WORKERS:-}"
SMOKE_E2E_GREP="${SMOKE_E2E_GREP:-}"
if [[ -n "$SMOKE_E2E_WORKERS" ]]; then
  [[ "$SMOKE_E2E_WORKERS" =~ ^[1-9][0-9]*$ ]] \
    || fatal "SMOKE_E2E_WORKERS 必须是正整数"
  (( SMOKE_E2E_WORKERS <= 128 )) \
    || fatal "SMOKE_E2E_WORKERS 不能超过 128"
fi
if [[ "$SMOKE_RUN_E2E" != true && ( -n "$SMOKE_E2E_WORKERS" || -n "$SMOKE_E2E_GREP" ) ]]; then
  fatal "SMOKE_E2E_WORKERS/SMOKE_E2E_GREP 仅能与 SMOKE_RUN_E2E=true 一起使用"
fi
SMOKE_E2E_ARGS=()
if [[ -n "$SMOKE_E2E_WORKERS" ]]; then
  SMOKE_E2E_ARGS+=(--workers "$SMOKE_E2E_WORKERS")
fi
if [[ -n "$SMOKE_E2E_GREP" ]]; then
  SMOKE_E2E_ARGS+=(--grep "$SMOKE_E2E_GREP")
fi

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
      "$smoke_port_candidate" "$((smoke_port_candidate + 1))" "$((smoke_port_candidate + 2))" \
      "$((smoke_port_candidate + 3))" "$((smoke_port_candidate + 4))" "$((smoke_port_candidate + 5))" \
      "$((smoke_port_candidate + 10))" "$((smoke_port_candidate + 11))" "$((smoke_port_candidate + 12))" \
      "$((smoke_port_candidate + 13))" "$((smoke_port_candidate + 14))"; then
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
JAEGER_UI_PORT="${SMOKE_JAEGER_UI_PORT:-$((SMOKE_PORT_BASE + 3))}"
JAEGER_OTLP_PORT="${SMOKE_JAEGER_OTLP_PORT:-$((SMOKE_PORT_BASE + 4))}"
JAEGER_OTLP_HTTP_PORT="${SMOKE_JAEGER_OTLP_HTTP_PORT:-$((SMOKE_PORT_BASE + 5))}"

for smoke_port in \
  "$BACKEND_PORT" "$FRONTEND_PORT" "$EDGE_PORT" "$PG_PORT" "$REDIS_PORT" \
  "$MQTT_PORT" "$RABBITMQ_PORT" "$RABBITMQ_MGMT_PORT" "$JAEGER_UI_PORT" \
  "$JAEGER_OTLP_PORT" "$JAEGER_OTLP_HTTP_PORT"; do
  [[ "$smoke_port" =~ ^[0-9]+$ && "$smoke_port" -ge 1024 && "$smoke_port" -le 65535 ]] \
    || fatal "smoke 端口必须位于 1024-65535"
done

for smoke_port in "$BACKEND_PORT" "$FRONTEND_PORT" "$EDGE_PORT" "$JAEGER_UI_PORT" "$JAEGER_OTLP_PORT" "$JAEGER_OTLP_HTTP_PORT"; do
  if smoke_port_is_listening "$smoke_port"; then
    fatal "smoke 应用端口已被占用：$smoke_port"
  fi
done

cleanup() {
  # 由 EXIT trap 在调用前显式传入退出码，避免清理函数内部命令覆盖失败状态。
  local exit_code="$1"
  trap - EXIT

  if [[ "$COMPOSE_READY" = true ]]; then
    "${COMPOSE[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
  fi
  rm -rf -- "$SMOKE_ROOT"
  exit "$exit_code"
}
trap 'cleanup "$?"' EXIT

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
  # 中文标点可能被 Bash 当作变量名的一部分；使用花括号避免 set -u 将错误提示本身变成二次故障。
  fatal "找不到本地 smoke 镜像，请先构建 ${BACKEND_IMAGE}、${FRONTEND_IMAGE} 和 ${EDGEGATEWAY_IMAGE}"
fi

mkdir -p "$RUNTIME_DOCKER/ssl" "$RUNTIME_DOCKER/mqtt-certs" "$RUNTIME_DOCKER/mqtt-ca" "$RUNTIME_DOCKER/mosquitto_passwd" "$RUNTIME_DOCKER/rabbitmq" "$RUNTIME_DOCKER/prometheus" "$RUNTIME_DOCKER/grafana/provisioning/datasources" "$RUNTIME_DOCKER/grafana/provisioning/dashboards" "$RUNTIME_DOCKER/waf-rules"
# runner umask 077 时 mktemp 与 mkdir 产物是 700，容器内服务账户无法穿越
# bind-mount 源路径（表现为"规则文件不存在"等误报）。统一放开目录穿越权限。
chmod 755 "$SMOKE_ROOT" "$RUNTIME_DOCKER" \
          "$RUNTIME_DOCKER"/ssl "$RUNTIME_DOCKER"/mqtt-certs "$RUNTIME_DOCKER"/mqtt-ca \
          "$RUNTIME_DOCKER"/mosquitto_passwd "$RUNTIME_DOCKER"/rabbitmq \
          "$RUNTIME_DOCKER"/prometheus "$RUNTIME_DOCKER"/grafana \
          "$RUNTIME_DOCKER"/grafana/provisioning "$RUNTIME_DOCKER"/grafana/provisioning/datasources \
          "$RUNTIME_DOCKER"/grafana/provisioning/dashboards "$RUNTIME_DOCKER"/waf-rules

# 只复制不含运行时凭据的配置；绝不复制仓库中的 .env、证书、私钥、密码文件和备份。
runtime_files=(
  docker-compose.yml
  docker-compose.smoke.yml
  mosquitto.prod.conf
  nginx.conf
  validate-env.sh
  production-readiness.sh
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
cp "$PROJECT_ROOT/docker/waf-rules/rules.json" "$RUNTIME_DOCKER/waf-rules/rules.json"

# runner 的 umask 可能是 077：cp 出来的配置与入口脚本会变成 600/700，
# 容器内以服务账户（非 runner uid）读取时直接 Permission denied。
# 必须放在所有 cp 之后统一归位：入口脚本 755、其余配置 644。
chmod 755 "$RUNTIME_DOCKER"/entrypoint.sh \
          "$RUNTIME_DOCKER"/nginx-entrypoint.sh \
          "$RUNTIME_DOCKER"/alertmanager-entrypoint.sh \
          "$RUNTIME_DOCKER"/rabbitmq/start.sh
chmod 644 "$RUNTIME_DOCKER"/docker-compose.yml \
          "$RUNTIME_DOCKER"/docker-compose.smoke.yml \
          "$RUNTIME_DOCKER"/mosquitto.prod.conf \
          "$RUNTIME_DOCKER"/nginx.conf \
          "$RUNTIME_DOCKER"/validate-env.sh \
          "$RUNTIME_DOCKER"/production-readiness.sh \
          "$RUNTIME_DOCKER"/generate-mqtt-cert.sh \
          "$RUNTIME_DOCKER"/prometheus.yml \
          "$RUNTIME_DOCKER"/alertmanager.yml \
          "$RUNTIME_DOCKER"/prometheus/rules.yml \
          "$RUNTIME_DOCKER"/rabbitmq/rabbitmq.conf \
          "$RUNTIME_DOCKER"/rabbitmq/definitions.json
# WAF 规则不包含凭据；保持组/其他用户不可写，同时允许镜像内的非 root 应用用户读取只读挂载。
chmod 644 "$RUNTIME_DOCKER/waf-rules/rules.json"

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
AUTH_MACHINE_API_KEY="$(random_secret)"
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
  "AUTH_MACHINE_API_KEY=$AUTH_MACHINE_API_KEY"
  "MQTT_USERNAME=$MQTT_USERNAME"
  "MQTT_PASSWORD=$MQTT_PASSWORD"
  "SEED_ADMIN_PASSWORD=$SEED_ADMIN_PASSWORD"
  "SEED_LEAD_PASSWORD=$SEED_LEAD_PASSWORD"
  "SEED_TECH_PASSWORD=$SEED_TECH_PASSWORD"
  "SEED_OPERATOR_PASSWORD=$SEED_OPERATOR_PASSWORD"
  "SEED_VIEWER_PASSWORD=$SEED_VIEWER_PASSWORD"
  "SEED_DEMO_DATA=full"
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
  "JAEGER_UI_PORT=$JAEGER_UI_PORT"
  "JAEGER_OTLP_PORT=$JAEGER_OTLP_PORT"
  "JAEGER_OTLP_HTTP_PORT=$JAEGER_OTLP_HTTP_PORT"
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
  # Smoke 必须走与生产 Compose 相同的 Jaeger OTLP 链路，避免只验证 Console exporter。
  "OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4317"
  "WAF_RULES_PATH=/etc/equipai/waf/rules.json"
  "WAF_REQUIRE_EXTERNAL_RULES=true"
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

# Production 校验器要求公网叶子证书不能自签名；Smoke 在临时目录中生成一套
# 测试 CA 和由该 CA 签发的 localhost 叶子证书，既能验证真实 TLS/Nginx 链路，
# 又不会放宽生产环境对正式 CA 证书的门禁。
generate_smoke_issued_tls_certificate() {
  local ssl_dir="$1"
  local ca_key="$ssl_dir/smoke-ca.key"
  local ca_certificate="$ssl_dir/smoke-ca.crt"
  local leaf_csr="$ssl_dir/smoke-leaf.csr"
  local extension_file="$ssl_dir/smoke-leaf.ext"
  local serial_file="$ssl_dir/smoke-ca.srl"

  openssl req -x509 -nodes -newkey rsa:2048 \
    -days 365 \
    -keyout "$ca_key" \
    -out "$ca_certificate" \
    -subj "/C=CN/O=EquipSense/OU=Production-Smoke/CN=EquipSense Smoke CA" \
    -addext "basicConstraints=critical,CA:TRUE,pathlen:1" \
    -addext "keyUsage=critical,keyCertSign,cRLSign" \
    >/dev/null 2>&1

  openssl req -new -nodes -newkey rsa:2048 \
    -keyout "$ssl_dir/key.pem" \
    -out "$leaf_csr" \
    -subj "/C=CN/O=EquipSense/OU=Production-Smoke/CN=localhost" \
    >/dev/null 2>&1

  printf '%s\n' \
    '[v3_server]' \
    'basicConstraints=critical,CA:FALSE' \
    'keyUsage=critical,digitalSignature,keyEncipherment' \
    'extendedKeyUsage=serverAuth' \
    'subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1,IP:::1' \
    > "$extension_file"

  openssl x509 -req \
    -in "$leaf_csr" \
    -CA "$ca_certificate" \
    -CAkey "$ca_key" \
    -CAcreateserial \
    -CAserial "$serial_file" \
    -out "$ssl_dir/cert.pem" \
    -days 365 \
    -sha256 \
    -extfile "$extension_file" \
    -extensions v3_server \
    >/dev/null 2>&1

  chmod 600 "$ssl_dir/key.pem"
  chmod 644 "$ssl_dir/cert.pem"
  rm -f -- "$ca_key" "$ca_certificate" "$leaf_csr" "$extension_file" "$serial_file"
}

generate_smoke_issued_tls_certificate "$RUNTIME_DOCKER/ssl"
bash "$RUNTIME_DOCKER/generate-mqtt-cert.sh" mosquitto 365 >/dev/null
# nginx master 以 root 运行但容器 cap_drop ALL（无 DAC_OVERRIDE）：
# runner 属主的 600 私钥它读不了 → Permission denied。在有免密 sudo 的 CI 上
# 把证书目录属主改为 root（mode 600 不变，validate-env 门禁仍通过）；
# 本地无 sudo 时跳过——Docker Desktop 权限映射宽松，不受影响。
if sudo -n true 2>/dev/null; then
  # 只改文件属主，不动目录：目录若归 root，runner 随后无法清理临时目录。
  sudo chown 0:0 "$RUNTIME_DOCKER/ssl/key.pem" "$RUNTIME_DOCKER/ssl/cert.pem" \
    "$RUNTIME_DOCKER/mqtt-certs/ca.crt" "$RUNTIME_DOCKER/mqtt-certs/server.crt" \
    "$RUNTIME_DOCKER/mqtt-certs/server.key"
fi
# 密码只经标准输入交给官方工具，禁止使用 -b 或命令行参数，避免凭据出现在进程列表和审计记录中。
# 以调用者 uid 运行容器：passwd 文件归 runner 所有，随后的 chmod 才被允许
# （Linux 上容器内其他 uid 建的文件，宿主普通用户无权改权限；macOS 会掩盖这一点）。
printf '%s\n%s\n' "$MQTT_PASSWORD" "$MQTT_PASSWORD" \
  | docker run --rm -i --user "$(id -u):$(id -g)" \
    -v "$RUNTIME_DOCKER/mosquitto_passwd:/work" "$MOSQUITTO_IMAGE" \
    mosquitto_passwd -c /work/passwd "$MQTT_USERNAME" >/dev/null
chmod 600 "$RUNTIME_DOCKER/mosquitto_passwd/passwd"
# 注意：passwd 不能 chown 给 root——validate-env 需以 runner 身份读取校验；
# mosquitto 容器无 cap_drop，root 天然可读任意属主的文件，无需调整属主。

# 整个 runtime smoke 都运行在临时隔离 Compose 项目中，演示数据开关只服务于该验收环境。
validation_args=("$RUNTIME_DOCKER/.env" "--check-runtime-files" "--allow-isolated-e2e")
bash "$RUNTIME_DOCKER/validate-env.sh" "${validation_args[@]}" >/dev/null

COMPOSE=(
  docker compose
  --project-name "$PROJECT_NAME"
  --env-file "$RUNTIME_DOCKER/.env"
  -f "$RUNTIME_DOCKER/docker-compose.yml"
  -f "$RUNTIME_DOCKER/docker-compose.smoke.yml"
)
"${COMPOSE[@]}" config --quiet
COMPOSE_READY=true
if ! "${COMPOSE[@]}" up -d jaeger-init jaeger postgres redis mosquitto rabbitmq backend edgegateway frontend >/dev/null; then
  # Compose 在依赖健康检查失败时通常只返回一句摘要；在清理临时资源前保留
  # 各基础设施容器与后端的启动日志，否则迁移、配置或依赖连接类故障无法从 CI 输出定位。
  for svc in rabbitmq postgres redis mosquitto backend edgegateway; do
    echo "=== smoke 失败诊断: $svc 最近日志 ===" >&2
    "${COMPOSE[@]}" logs --no-color --tail=60 "$svc" >&2 || true
  done
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
        # 健康检查失败时保留对应服务的最近日志，否则容器可能在清理前已重启，
        # 只看 ps 无法判断是配置门禁、依赖连接还是应用自身启动异常。
        "${COMPOSE[@]}" logs --no-color --tail=200 "$service" >&2 || true
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

wait_for_jaeger_trace() {
  local services_response
  local jaeger_service
  local traces_response

  for _ in $(seq 1 45); do
    # ActivitySource 的批量导出是异步的；先从 Query API 获取服务，再查询最近一条 trace，
    # 这样烟测验证的是后端确实完成 OTLP 推送和 Jaeger 接收，而不是只验证端口已监听。
    services_response="$(curl --fail --silent --show-error --max-time 10 \
      "http://127.0.0.1:$JAEGER_UI_PORT/api/services" 2>/dev/null || true)"
    if jq -e '(.data | type == "array") and (.data | length > 0)' <<<"$services_response" >/dev/null 2>&1; then
      jaeger_service="$(jq -r '.data[0]' <<<"$services_response")"
      traces_response="$(curl --fail --silent --show-error --max-time 10 --get \
        --data-urlencode "service=$jaeger_service" \
        --data-urlencode 'lookback=1h' \
        --data-urlencode 'limit=1' \
        "http://127.0.0.1:$JAEGER_UI_PORT/api/traces" 2>/dev/null || true)"
      if jq -e '(.data | type == "array") and (.data | length > 0)' <<<"$traces_response" >/dev/null 2>&1; then
        return 0
      fi
    fi
    sleep 2
  done

  fatal "Jaeger 未收到后端 OTLP trace，Production 可观测性链路未闭环"
}

wait_for_health backend
wait_for_health edgegateway
wait_for_health frontend
wait_for_http "http://127.0.0.1:$JAEGER_UI_PORT/api/services" ""

environment_name="$("${COMPOSE[@]}" exec -T backend printenv ASPNETCORE_ENVIRONMENT)"
[[ "$environment_name" = Production ]] || fatal "backend 未运行在 Production 环境"
local_device_fallback="$("${COMPOSE[@]}" exec -T edgegateway printenv Gateway__UseLocalDeviceConfigFallback)"
[[ "$local_device_fallback" = false ]] \
  || fatal "Production edgegateway 不得启用本地示例设备配置回退"

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

# 复用统一只读验收入口，确保 smoke 的配置、Compose 展开、制品和运行态结论
# 与部署主机使用同一套检查 ID；输出目录由 CI 注入时会作为独立 artifact 留档。
SMOKE_ACCEPTANCE_OUTPUT_DIR="${SMOKE_ACCEPTANCE_OUTPUT_DIR:-$SMOKE_ROOT/production-acceptance-report}"
mkdir -p "$(dirname "$SMOKE_ACCEPTANCE_OUTPUT_DIR")"
if ! PRODUCTION_ACCEPTANCE_EXPECTED_TAG="${SMOKE_ACCEPTANCE_EXPECTED_TAG:-}" \
  COMPOSE_PROJECT_NAME="$PROJECT_NAME" \
  bash "$PROJECT_ROOT/docker/production-acceptance.sh" \
    --profile isolated-ci \
    --env-file "$RUNTIME_DOCKER/.env" \
    --runtime-dir "$RUNTIME_DOCKER" \
    --compose-file "$RUNTIME_DOCKER/docker-compose.yml" \
    --compose-file "$RUNTIME_DOCKER/docker-compose.smoke.yml" \
    --runtime \
    --output-dir "$SMOKE_ACCEPTANCE_OUTPUT_DIR"; then
  fatal "统一生产验收入口未通过，报告目录：$SMOKE_ACCEPTANCE_OUTPUT_DIR"
fi

# 完成生产 E2E 前置账户初始化。生产种子账户首次登录必须改密，
# 先执行真实 MFA/改密流程，再进入业务 API 验收，避免测试脚本绕过安全门禁。
if [[ "$SMOKE_RUN_E2E" = true ]]; then
  mfa_bootstrap_result="$(
    MFA_BOOTSTRAP_BASE_URL="http://127.0.0.1:$BACKEND_PORT" \
    MFA_BOOTSTRAP_MACHINE_API_KEY="$AUTH_MACHINE_API_KEY" \
    MFA_BOOTSTRAP_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" \
    MFA_BOOTSTRAP_LEAD_PASSWORD="$SEED_LEAD_PASSWORD" \
    MFA_BOOTSTRAP_TECH_PASSWORD="$SEED_TECH_PASSWORD" \
    MFA_BOOTSTRAP_OPERATOR_PASSWORD="$SEED_OPERATOR_PASSWORD" \
    MFA_BOOTSTRAP_VIEWER_PASSWORD="$SEED_VIEWER_PASSWORD" \
    MFA_BOOTSTRAP_TENANT2_PASSWORD="$SEED_TENANT2_PASSWORD" \
    node "$PROJECT_ROOT/tests/scripts/production-e2e-mfa-bootstrap.mjs"
  )" || fatal "Production E2E 高权限账户 MFA 初始化失败"
  e2e_admin_totp_secret="$(jq -r '.adminTotpSecret // empty' <<<"$mfa_bootstrap_result")"
  e2e_lead_totp_secret="$(jq -r '.leadTotpSecret // empty' <<<"$mfa_bootstrap_result")"
  e2e_tenant2_totp_secret="$(jq -r '.tenant2TotpSecret // empty' <<<"$mfa_bootstrap_result")"
  e2e_admin_password="$(jq -r '.adminPassword // empty' <<<"$mfa_bootstrap_result")"
  e2e_lead_password="$(jq -r '.leadPassword // empty' <<<"$mfa_bootstrap_result")"
  e2e_tech_password="$(jq -r '.techPassword // empty' <<<"$mfa_bootstrap_result")"
  e2e_operator_password="$(jq -r '.operatorPassword // empty' <<<"$mfa_bootstrap_result")"
  e2e_viewer_password="$(jq -r '.viewerPassword // empty' <<<"$mfa_bootstrap_result")"
  e2e_tenant2_password="$(jq -r '.tenant2Password // empty' <<<"$mfa_bootstrap_result")"
  [[ -n "$e2e_admin_totp_secret" && -n "$e2e_lead_totp_secret" && -n "$e2e_tenant2_totp_secret" ]] \
    || fatal "Production E2E MFA 初始化未返回完整临时密钥"
  [[ -n "$e2e_admin_password" && -n "$e2e_lead_password" && -n "$e2e_tech_password" \
    && -n "$e2e_operator_password" && -n "$e2e_viewer_password" && -n "$e2e_tenant2_password" ]] \
    || fatal "Production E2E 强制改密初始化未返回完整临时密码"
  viewer_login_password="$e2e_viewer_password"
else
  viewer_login_password="$SEED_VIEWER_PASSWORD"
fi

# 使用本次临时环境创建的观察者账户完成一次真实认证闭环；观察者不要求 MFA，
# 可以验证种子数据、密码哈希、JWT 签发和受保护 API 均在 Production 镜像中可用。
login_response="$(curl --fail --silent --show-error --max-time 10 \
  -H 'Content-Type: application/json' \
  -H "X-API-Key: $AUTH_MACHINE_API_KEY" \
  --data-binary @- \
  "http://127.0.0.1:$BACKEND_PORT/api/v1/auth/login" <<JSON
{"username":"viewer","password":"$viewer_login_password"}
JSON
)" || fatal "Production 种子观察者账户登录失败"
viewer_access_token="$(jq -r '.accessToken // empty' <<<"$login_response")"
[[ -n "$viewer_access_token" ]] || fatal "登录响应缺少访问令牌"

# 非 E2E smoke 也必须先完成一次真实改密，才能用同一套 Production 业务门禁
# 验证受保护 API；E2E 模式已由上面的隔离账户初始化完成。
if [[ "$SMOKE_RUN_E2E" != true ]]; then
  smoke_viewer_password="$(random_secret)"
  change_password_response="$(curl --fail --silent --show-error --max-time 10 \
    -H 'Content-Type: application/json' \
    -H "X-API-Key: $AUTH_MACHINE_API_KEY" \
    -H "Authorization: Bearer $viewer_access_token" \
    --data-binary @- \
    "http://127.0.0.1:$BACKEND_PORT/api/v1/auth/change-password" <<JSON
{"currentPassword":"$viewer_login_password","newPassword":"$smoke_viewer_password"}
JSON
  )" || fatal "Production 观察者强制改密失败"
  viewer_access_token="$(jq -r '.accessToken // empty' <<<"$change_password_response")"
  [[ -n "$viewer_access_token" ]] || fatal "强制改密响应缺少新的访问令牌"
fi

curl --fail --silent --show-error --max-time 10 \
  -H "Authorization: Bearer $viewer_access_token" \
  "http://127.0.0.1:$BACKEND_PORT/api/v1/auth/me" >/dev/null \
  || fatal "Production 访问令牌无法访问受保护的 /auth/me"

wait_for_jaeger_trace

# 完整演示模式除了要能启动，还必须通过真实 API 暴露完整且可读的业务闭环。
# 这里校验固定编码集合而不是只校验数量，避免基础种子或历史残留恰好凑出相同数量。
demo_devices_response="$(curl --fail --silent --show-error --max-time 10 \
  -H "Authorization: Bearer $viewer_access_token" \
  "http://127.0.0.1:$BACKEND_PORT/api/v1/devices?page=1&pageSize=100")" \
  || fatal "完整演示设备列表 API 读取失败"
expected_demo_device_codes='["AC-001","DEMO-002","DEMO-003","DEMO-004","DEMO-005","DEMO-006","DEMO-007","DEMO-008","DEMO-009","DEMO-010"]'
jq -e --argjson expected_codes "$expected_demo_device_codes" \
  '(.total == 10) and (([.items[].deviceCode] | sort) == ($expected_codes | sort))' \
  <<<"$demo_devices_response" >/dev/null \
  || fatal "完整演示设备数据不完整（期望 10 个固定设备编码）"

demo_device_id="$(jq -r '.items[] | select(.deviceCode == "AC-001") | .id' <<<"$demo_devices_response")"
[[ "$demo_device_id" =~ ^[0-9a-fA-F-]{36}$ ]] \
  || fatal "完整演示设备 AC-001 缺少有效设备 ID"

# 查询一台代表设备的最新值，确认演示遥测确实已写入时序库并经过读路径返回。
demo_telemetry_response="$(curl --fail --silent --show-error --max-time 10 \
  -H "Authorization: Bearer $viewer_access_token" \
  "http://127.0.0.1:$BACKEND_PORT/api/v1/telemetry/$demo_device_id")" \
  || fatal "完整演示遥测查询 API 读取失败"
jq -e '(.oil_temperature != null) and (.vibration != null) and (.motor_current != null)' \
  <<<"$demo_telemetry_response" >/dev/null \
  || fatal "完整演示遥测数据不完整（AC-001 缺少预期指标）"

demo_alerts_response="$(curl --fail --silent --show-error --max-time 10 \
  -H "Authorization: Bearer $viewer_access_token" \
  "http://127.0.0.1:$BACKEND_PORT/api/v1/alerts?page=1&pageSize=100")" \
  || fatal "完整演示告警列表 API 读取失败"
expected_demo_alert_codes='["DEMO-ALERT-001","DEMO-ALERT-002","DEMO-ALERT-003","DEMO-ALERT-004","DEMO-ALERT-005"]'
jq -e --argjson expected_codes "$expected_demo_alert_codes" \
  '(.total == 5) and (([.items[].alertCode] | sort) == ($expected_codes | sort))' \
  <<<"$demo_alerts_response" >/dev/null \
  || fatal "完整演示告警数据不完整（期望 5 个固定告警编码）"

demo_work_orders_response="$(curl --fail --silent --show-error --max-time 10 \
  -H "Authorization: Bearer $viewer_access_token" \
  "http://127.0.0.1:$BACKEND_PORT/api/v1/work-orders?page=1&pageSize=100")" \
  || fatal "完整演示工单列表 API 读取失败"
expected_demo_work_order_codes='["DEMO-WO-001","DEMO-WO-002","DEMO-WO-003","DEMO-WO-004"]'
jq -e --argjson expected_codes "$expected_demo_work_order_codes" \
  '(.total == 4) and (([.items[].workOrderCode] | sort) == ($expected_codes | sort))' \
  <<<"$demo_work_orders_response" >/dev/null \
  || fatal "完整演示工单数据不完整（期望 4 个固定工单编码）"

gateways_response="$(curl --fail --silent --show-error --max-time 10 \
  -H "Authorization: Bearer $viewer_access_token" \
  "http://127.0.0.1:$BACKEND_PORT/api/v1/gateways")" \
  || fatal "边缘网关心跳未能通过后端网关列表 API 读取"
jq -e --arg gateway_id "smoke-gateway" \
  'any(.[]; .gatewayId == $gateway_id and .status == "online")' \
  <<<"$gateways_response" >/dev/null \
  || fatal "边缘网关未在后端注册为 online"

# 证书生命周期监控必须在真实 Production 镜像中注册并读取三份公钥证书，
# 防止只在单元测试中存在、但容器配置或文件挂载遗漏的回归。
certificate_metrics="$(curl --fail --silent --show-error --max-time 10 \
  "http://127.0.0.1:$BACKEND_PORT/metrics")" \
  || fatal "后端 Prometheus 指标端点不可用"
for certificate_metric in \
  equipai_certificate_expiry_timestamp_seconds \
  equipai_certificate_monitoring_status \
  equipai_certificate_days_until_expiry; do
  grep -q "^${certificate_metric}" <<<"$certificate_metrics" \
    || fatal "后端缺少证书监控指标：$certificate_metric"
done
for certificate_name in nginx_tls mqtt_server mqtt_ca; do
  grep -Eq "^equipai_certificate_monitoring_status\{certificate=\"${certificate_name}\"\} 1$" \
    <<<"$certificate_metrics" \
    || fatal "证书 ${certificate_name} 未被后端成功读取"
done

wait_for_http "https://127.0.0.1:$FRONTEND_PORT/health" "-k"
wait_for_http "https://127.0.0.1:$FRONTEND_PORT/login" "-k"

login_body="$(curl -k --fail --silent --show-error --max-time 10 "https://127.0.0.1:$FRONTEND_PORT/login")"
[[ -n "$login_body" ]] || fatal "HTTPS 登录页响应体为空"
printf 'HTTPS /login 响应体长度：%s\n' "${#login_body}"

proxy_status="$(curl -k --silent --show-error --max-time 10 -o /dev/null -w '%{http_code}' "https://127.0.0.1:$FRONTEND_PORT/api/v1/auth/me")"
case "$proxy_status" in
  401|403)
    ;;
  *)
    fatal "Nginx API 反向代理未返回预期未授权响应：HTTP $proxy_status"
    ;;
esac

login_api_body="$(curl -k --silent --show-error --max-time 10 \
  -H 'Content-Type: application/json' \
  --data '{}' \
  "https://127.0.0.1:$FRONTEND_PORT/api/v1/auth/login")"
[[ -n "$login_api_body" ]] || fatal "API 反向代理登录响应体为空"
printf '%s' "$login_api_body" | grep -qi '<html' \
  && fatal "API 反向代理返回了错误页而不是业务响应"
printf 'API /auth/login 响应体：%s\n' "$login_api_body"

if [[ "$SMOKE_RUN_E2E" = true ]]; then
  printf '运行 Production 镜像完整业务 E2E……\n'
  (
    cd "$PROJECT_ROOT/frontend"
    e2e_environment=(
      "PLAYWRIGHT_BASE_URL=https://127.0.0.1:$FRONTEND_PORT"
      "PLAYWRIGHT_API_BASE_URL=http://127.0.0.1:$BACKEND_PORT"
      "PLAYWRIGHT_MACHINE_API_KEY=$AUTH_MACHINE_API_KEY"
      "E2E_PRODUCTION=1"
      "E2E_FAST_LOGIN=1"
      "E2E_ADMIN_PASSWORD=$e2e_admin_password"
      "E2E_LEAD_PASSWORD=$e2e_lead_password"
      "E2E_ADMIN_TOTP_SECRET=$e2e_admin_totp_secret"
      "E2E_LEAD_TOTP_SECRET=$e2e_lead_totp_secret"
      "E2E_TENANT2_TOTP_SECRET=$e2e_tenant2_totp_secret"
      "E2E_TECH_PASSWORD=$e2e_tech_password"
      "E2E_OPERATOR_PASSWORD=$e2e_operator_password"
      "E2E_VIEWER_PASSWORD=$e2e_viewer_password"
      "E2E_TENANT2_PASSWORD=$e2e_tenant2_password"
    )
    if ((${#SMOKE_E2E_ARGS[@]} > 0)); then
      env "${e2e_environment[@]}" npx --no-install playwright test e2e-comprehensive --reporter=list "${SMOKE_E2E_ARGS[@]}"
    else
      env "${e2e_environment[@]}" npx --no-install playwright test e2e-comprehensive --reporter=list
    fi
  ) || fatal "Production 镜像完整业务 E2E 失败"
  printf 'Production 镜像完整业务 E2E 通过。\n'
fi

printf 'Production runtime smoke 通过：镜像、迁移、完整演示数据、边缘网关缓存、健康探针、HTTPS、API 反向代理和 Jaeger OTLP trace 接收均正常。\n'
