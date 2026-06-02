#!/bin/bash
# tests/e2e/run-integration.sh
# EquipSense 端到端集成验证脚本
# 验证 Simulator → EdgeGateway → 后端 全链路数据流与告警触发
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_DIR="/tmp/equipsense-e2e"
mkdir -p "$LOG_DIR"

echo "=== EquipSense 端到端集成验证 ==="
echo ""

# 1. 检查 Docker 服务
echo "[1/7] 检查 Docker 服务..."
if ! docker ps --format '{{.Names}}' | grep -q 'postgres' 2>/dev/null; then
    echo "  启动 Docker 服务..."
    cd "$PROJECT_ROOT/docker" && docker compose -f docker-compose.dev.yml up -d
    sleep 5
fi
echo "  ✓ Docker 服务就绪"

# 2. 启动后端
echo "[2/7] 启动后端..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
cd "$PROJECT_ROOT" && dotnet run --project src/EquipAI.WebAPI -- --seed > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
sleep 8
echo "  ✓ 后端已启动 (PID=$BACKEND_PID)"

# 3. 启动 Simulator
echo "[3/7] 启动 Simulator..."
cd "$PROJECT_ROOT" && dotnet run --project src/EquipAI.Simulator > "$LOG_DIR/simulator.log" 2>&1 &
SIM_PID=$!
sleep 5
echo "  ✓ Simulator 已启动 (PID=$SIM_PID)"

# 4. 启动 EdgeGateway（使用现有 appsettings.json 配置）
echo "[4/7] 启动 EdgeGateway..."
cd "$PROJECT_ROOT" && dotnet run --project src/EquipAI.EdgeGateway > "$LOG_DIR/gateway.log" 2>&1 &
GW_PID=$!
sleep 5
echo "  ✓ EdgeGateway 已启动 (PID=$GW_PID)"

# 5. 等待数据流和告警触发
echo "[5/7] 等待 30 秒让温度上升到超阈值（>85°C）..."
sleep 30

# 6. 验证结果
echo "[6/7] 验证结果..."

# 登录获取 Token
TOKEN=$(curl -s -X POST "http://localhost:8080/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"Admin@123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

PASS=true

# 检查遥测数据
TELEMETRY_COUNT=$(curl -s "http://localhost:8080/api/v1/telemetry/latest?deviceId=cd177305-b63f-4e30-b20f-086358ab725b" \
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

# 7. 清理
echo "[7/7] 清理..."
kill $GW_PID 2>/dev/null || true
kill $SIM_PID 2>/dev/null || true
kill $BACKEND_PID 2>/dev/null || true
echo ""

if $PASS; then
    echo "=== 验证通过 ✓ ==="
    exit 0
else
    echo "=== 验证失败 ✗ ==="
    echo "日志目录: $LOG_DIR/"
    exit 1
fi
