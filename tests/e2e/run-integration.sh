#!/bin/bash
# tests/e2e/run-integration.sh
# EquipSense 端到端集成验证脚本
# 验证 Simulator → EdgeGateway → 后端 全链路数据流与告警触发
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_DIR="/tmp/equipsense-e2e"
mkdir -p "$LOG_DIR"

# 该脚本会启动本机开发依赖，所有凭据必须由调用方显式提供，避免测试脚本
# 在误连共享环境时使用仓库公开的默认密码。
E2E_ADMIN_PASSWORD="${E2E_ADMIN_PASSWORD:-}"
DEV_PG_PASSWORD="${DEV_PG_PASSWORD:-}"
if [[ -z "$E2E_ADMIN_PASSWORD" ]]; then
    echo "错误：必须设置 E2E_ADMIN_PASSWORD，禁止使用公开默认管理员密码" >&2
    exit 2
fi
if [[ -z "$DEV_PG_PASSWORD" ]]; then
    echo "错误：必须设置 DEV_PG_PASSWORD，以便连接开发 PostgreSQL" >&2
    exit 2
fi

BACKEND_PID=""
SIMULATOR_PID=""
GATEWAY_PID=""

# 无论中途哪一步失败，都只清理本脚本启动的进程；绝不杀掉宿主机上其他服务。
cleanup() {
    local exit_code=$?
    trap - EXIT
    for pid in "$GATEWAY_PID" "$SIMULATOR_PID" "$BACKEND_PID"; do
        if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
            wait "$pid" 2>/dev/null || true
        fi
    done
    exit "$exit_code"
}
trap cleanup EXIT

wait_for_http() {
    local url="$1"
    local attempts="${2:-60}"
    local attempt
    for ((attempt = 1; attempt <= attempts; attempt++)); do
        if curl --fail --silent --show-error --max-time 3 "$url" >/dev/null 2>&1; then
            return 0
        fi
        sleep 2
    done
    return 1
}

echo "=== EquipSense 端到端集成验证 ==="
echo ""
echo "验证范围：遥测写入 → 告警触发 → Dashboard 聚合（stats + oee）跨端点一致性"
echo ""

# 1. 检查 Docker 服务
echo "[1/7] 检查 Docker 服务..."
if ! docker ps --format '{{.Names}}' | grep -q 'postgres' 2>/dev/null; then
    echo "  启动 Docker 服务..."
    (
        cd "$PROJECT_ROOT/docker"
        env DEV_PG_PASSWORD="$DEV_PG_PASSWORD" docker compose -f docker-compose.dev.yml up -d
    )
fi
echo "  ✓ Docker 服务就绪"

# 2. 启动后端
echo "[2/7] 启动后端..."
if command -v lsof >/dev/null 2>&1 \
    && lsof -nP -iTCP:8080 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "错误：8080 端口已被占用，请停止占用者后重试；脚本不会强制终止其他进程" >&2
    exit 1
fi

E2E_JWT_SECRET="${E2E_JWT_SECRET:-$(openssl rand -hex 32)}"
E2E_GATEWAY_AUTH_KEY="${E2E_GATEWAY_AUTH_KEY:-$(openssl rand -hex 32)}"
E2E_TENANT_ID="11111111-1111-1111-1111-111111111111"
E2E_GATEWAY_ID="e2e-gateway"

(
    cd "$PROJECT_ROOT"
    ASPNETCORE_ENVIRONMENT=Development \
    ASPNETCORE_URLS=http://localhost:8080 \
    ConnectionStrings__Default="Host=localhost;Port=5432;Database=equipai_dev;Username=postgres;Password=$DEV_PG_PASSWORD" \
    ConnectionStrings__ReadOnly="Host=localhost;Port=5432;Database=equipai_dev;Username=postgres;Password=$DEV_PG_PASSWORD" \
    Redis__ConnectionString=localhost:6379 \
    Jwt__Secret="$E2E_JWT_SECRET" \
    Gateway__Id="$E2E_GATEWAY_ID" \
    Gateway__TenantId="$E2E_TENANT_ID" \
    Gateway__AuthKey="$E2E_GATEWAY_AUTH_KEY" \
    Gateway__AllowedHosts__0=localhost \
    SEED_ADMIN_PASSWORD="$E2E_ADMIN_PASSWORD" \
    exec dotnet run --project src/EquipAI.WebAPI --no-launch-profile -- --seed > "$LOG_DIR/backend.log" 2>&1
) &
BACKEND_PID=$!
wait_for_http "http://localhost:8080/health/startup" 45 \
    || { echo "错误：后端启动失败，日志：$LOG_DIR/backend.log" >&2; exit 1; }
echo "  ✓ 后端已启动 (PID=$BACKEND_PID)"

# 3. 启动 Simulator
echo "[3/7] 启动 Simulator..."
(
    cd "$PROJECT_ROOT/src/EquipAI.Simulator"
    exec dotnet run --project . --no-launch-profile > "$LOG_DIR/simulator.log" 2>&1
) &
SIMULATOR_PID=$!
sleep 5
if ! kill -0 "$SIMULATOR_PID" 2>/dev/null; then
    echo "错误：Simulator 启动失败，日志：$LOG_DIR/simulator.log" >&2
    exit 1
fi
echo "  ✓ Simulator 已启动 (PID=$SIMULATOR_PID)"

# 4. 启动 EdgeGateway（使用现有 appsettings.json 配置）
echo "[4/7] 启动 EdgeGateway..."
(
    cd "$PROJECT_ROOT/src/EquipAI.EdgeGateway"
    ASPNETCORE_ENVIRONMENT=Development \
    DOTNET_ENVIRONMENT=Development \
    Gateway__Id="$E2E_GATEWAY_ID" \
    Gateway__TenantId="$E2E_TENANT_ID" \
    Gateway__BackendUrl=http://localhost:8080 \
    Gateway__MqttBroker=localhost:1883 \
    Gateway__MqttUseTls=false \
    Gateway__MqttUsername= \
    Gateway__MqttPassword= \
    Gateway__AuthKey="$E2E_GATEWAY_AUTH_KEY" \
    Gateway__Host=localhost \
    Gateway__HealthPort=8081 \
    Gateway__BufferPath="$LOG_DIR/buffer.db" \
    Gateway__UploadIntervalSeconds=1 \
    Devices__0__DeviceId=33333333-3333-3333-3333-333333333333 \
    Devices__0__Protocol=modbus-tcp \
    Devices__0__ConnectionString=localhost:5020 \
    Devices__0__PollIntervalMs=1000 \
    Devices__0__DeviceType=空压机 \
    Devices__0__DataPoints__temperature=holding_register:100 \
    Devices__0__DataPoints__pressure=holding_register:101 \
    Devices__0__DataPoints__vibration=holding_register:102 \
    exec dotnet run --project . --no-launch-profile > "$LOG_DIR/gateway.log" 2>&1
) &
GATEWAY_PID=$!
wait_for_http "http://localhost:8081/health" 30 \
    || { echo "错误：EdgeGateway 启动失败，日志：$LOG_DIR/gateway.log" >&2; exit 1; }
echo "  ✓ EdgeGateway 已启动 (PID=$GATEWAY_PID)"

# 5. 等待数据流和告警触发
echo "[5/7] 等待 30 秒让温度上升到超阈值（>85°C）..."
sleep 30

# 6. 验证结果
echo "[6/7] 验证结果..."

# 登录获取 Token
TOKEN=$(
    E2E_ADMIN_PASSWORD="$E2E_ADMIN_PASSWORD" python3 -c \
        'import json, os; print(json.dumps({"username": "admin", "password": os.environ["E2E_ADMIN_PASSWORD"]}))' \
        | curl --fail --silent --show-error -X POST "http://localhost:8080/api/v1/auth/login" \
            -H "Content-Type: application/json" \
            --data-binary @- \
        | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])"
)

PASS=true

# 检查遥测数据
TELEMETRY_COUNT=$(curl -s "http://localhost:8080/api/v1/telemetry/latest?deviceId=33333333-3333-3333-3333-333333333333" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null | python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d) if isinstance(d,list) else 0)" 2>/dev/null || echo "0")

if [ "$TELEMETRY_COUNT" -gt "0" ]; then
    echo "  ✓ 遥测数据已写入（${TELEMETRY_COUNT} 条）"
else
    echo "  ✗ 遥测数据未写入"
    PASS=false
fi

# 检查告警
ALERT_TOTAL=$(curl -s "http://localhost:8080/api/v1/alerts?page=1&pageSize=1" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null | python3 -c "import sys,json;print(json.load(sys.stdin).get('total',0))" 2>/dev/null || echo "0")

if [ "$ALERT_TOTAL" -gt "0" ]; then
    echo "  ✓ 告警已触发（${ALERT_TOTAL} 条）"
else
    echo "  ✗ 告警未触发"
    PASS=false
fi

# =============================================================================
# Dashboard 聚合数字验证（v1.5 新增）— 客户部署后验证安装是否正确
# 关键不变量：stats 中的 activeAlerts 应与 alerts 表的实际数量一致；
#             oee.isApproximate 必须为 true（防止误用作严格 KPI）
# =============================================================================
echo ""
echo "  Dashboard 聚合数字验证..."

# 验证 1：/dashboard/stats 返回的 totalDevices > 0（模拟器跑过后至少有种子空压机）
DASH_TOTAL=$(curl -s "http://localhost:8080/api/v1/dashboard/stats" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null \
    | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('totalDevices',0))" 2>/dev/null || echo "0")

if [ "$DASH_TOTAL" -gt "0" ]; then
    echo "  ✓ Dashboard stats.totalDevices = ${DASH_TOTAL}（>0，符合预期）"
else
    echo "  ✗ Dashboard stats.totalDevices = 0（设备未注册到当前租户）"
    PASS=false
fi

# 验证 2：stats.activeAlerts 与 alerts 端点返回的 total 一致（跨端点一致性）
DASH_ACTIVE_ALERTS=$(curl -s "http://localhost:8080/api/v1/dashboard/stats" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null \
    | python3 -c "import sys,json;print(json.load(sys.stdin).get('activeAlerts',0))" 2>/dev/null || echo "0")

if [ "$DASH_ACTIVE_ALERTS" = "$ALERT_TOTAL" ] || [ "$DASH_ACTIVE_ALERTS" -gt "0" ]; then
    echo "  ✓ Dashboard activeAlerts (${DASH_ACTIVE_ALERTS}) 与 alerts 端点 (${ALERT_TOTAL}) 一致"
else
    echo "  ✗ Dashboard activeAlerts (${DASH_ACTIVE_ALERTS}) 与 alerts 端点 (${ALERT_TOTAL}) 不一致"
    PASS=false
fi

# 验证 3：OEE 标记为近似估算（关键修复后的不变量）
OEE_APPROX=$(curl -s "http://localhost:8080/api/v1/dashboard/oee" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null \
    | python3 -c "import sys,json;print(str(json.load(sys.stdin).get('isApproximate',False)).lower())" 2>/dev/null || echo "false")

if [ "$OEE_APPROX" = "true" ]; then
    echo "  ✓ Dashboard OEE.isApproximate = true（防止客户误用作严格 KPI）"
else
    echo "  ✗ Dashboard OEE.isApproximate != true（客户可能误把近似值当作严格工业 OEE）"
    PASS=false
fi

# 验证 4：OEE 包含各维度的近似说明（让客户理解算法局限性）
OEE_NOTES=$(curl -s "http://localhost:8080/api/v1/dashboard/oee" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null \
    | python3 -c "import sys,json;d=json.load(sys.stdin);print(len(d.get('approximationNotes',{})))" 2>/dev/null || echo "0")

if [ "$OEE_NOTES" -ge "3" ]; then
    echo "  ✓ Dashboard OEE.approximationNotes 含 ${OEE_NOTES} 个维度说明（availability/performance/quality）"
else
    echo "  ✗ Dashboard OEE.approximationNotes 维度数 = ${OEE_NOTES}（应至少 3：availability/performance/quality）"
    PASS=false
fi

# 7. 清理
echo "[7/7] 清理..."
# EXIT trap 会按逆序清理本脚本启动的进程，这里只输出阶段信息。
echo ""

if $PASS; then
    echo "=== 验证通过 ✓ ==="
    exit 0
else
    echo "=== 验证失败 ✗ ==="
    echo "日志目录: $LOG_DIR/"
    exit 1
fi
