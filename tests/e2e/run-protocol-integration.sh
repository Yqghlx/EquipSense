#!/usr/bin/env bash
# tests/e2e/run-protocol-integration.sh
# 使用仓库正式 Simulator 验收 OPC UA/Modbus TCP 适配器的真实读取链路。
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_DIR="$(mktemp -d "${TMPDIR:-/tmp}/equipsense-protocol.XXXXXX")"
SIMULATOR_PID=""
SIMULATOR_DLL="$PROJECT_ROOT/src/EquipAI.Simulator/bin/Release/net8.0/EquipAI.Simulator.dll"

# 只清理本脚本启动的 Simulator 和本脚本创建的临时目录，绝不影响宿主机其他服务。
cleanup() {
    local exit_code=$?
    trap - EXIT
    if [[ -n "$SIMULATOR_PID" ]] && kill -0 "$SIMULATOR_PID" 2>/dev/null; then
        kill "$SIMULATOR_PID" 2>/dev/null || true
        wait "$SIMULATOR_PID" 2>/dev/null || true
    fi
    rm -rf "$LOG_DIR"
    exit "$exit_code"
}
trap cleanup EXIT

print_simulator_log() {
    echo "--- Simulator 日志 ---" >&2
    sed -n '1,260p' "$LOG_DIR/simulator.log" >&2 || true
}

assert_port_free() {
    local port="$1"
    if (echo >/dev/tcp/127.0.0.1/"$port") 2>/dev/null; then
        echo "错误：协议验收端口 $port 已被占用；脚本不会终止已有进程" >&2
        exit 1
    fi
}

wait_for_port() {
    local port="$1"
    local attempts=40
    local attempt
    for ((attempt = 1; attempt <= attempts; attempt++)); do
        if ! kill -0 "$SIMULATOR_PID" 2>/dev/null; then
            echo "错误：Simulator 在端口 $port 就绪前退出" >&2
            print_simulator_log
            exit 1
        fi
        if (echo >/dev/tcp/127.0.0.1/"$port") 2>/dev/null; then
            return 0
        fi
        sleep 1
    done

    echo "错误：等待 Simulator 端口 $port 超时" >&2
    print_simulator_log
    exit 1
}

if [[ ! -f "$SIMULATOR_DLL" ]]; then
    echo "错误：未找到 Release Simulator；请先运行 dotnet build EquipAI.sln --configuration Release" >&2
    exit 2
fi

assert_port_free 4840
assert_port_free 5020

echo "=== OPC UA/Modbus TCP 协议验收 ==="
echo "启动仓库 Simulator（OPC UA: 4840，Modbus TCP: 5020）..."
(
    cd "$PROJECT_ROOT/src/EquipAI.Simulator"
    exec dotnet "$SIMULATOR_DLL" --headless
) >"$LOG_DIR/simulator.log" 2>&1 &
SIMULATOR_PID=$!

wait_for_port 4840
wait_for_port 5020
echo "Simulator 两个协议端口均已监听（PID=${SIMULATOR_PID}）"

echo "运行四条协议集成测试（缺少 Simulator 时显式失败）..."
if ! (
    cd "$PROJECT_ROOT"
    RUN_PROTOCOL_INTEGRATION_TESTS=true \
    EQUIPAI_OPCUA_TEST_ENDPOINT=opc.tcp://127.0.0.1:4840 \
    EQUIPAI_MODBUS_TEST_ENDPOINT=127.0.0.1:5020 \
    dotnet test tests/EquipAI.Tests.Unit/EquipAI.Tests.Unit.csproj \
        --configuration Release \
        --no-build \
        --filter "Category=RequiresSimulator" \
        --verbosity normal \
        --nologo \
        -m:1 \
        -p:UseSharedCompilation=false \
        --disable-build-servers
) 2>&1 | tee "$LOG_DIR/protocol-tests.log"; then
    echo "错误：协议集成测试失败" >&2
    print_simulator_log
    exit 1
fi

if ! grep -Fq "Total tests: 4" "$LOG_DIR/protocol-tests.log" \
    || ! grep -Fq "Passed: 4" "$LOG_DIR/protocol-tests.log" \
    || grep -Eq "Failed: [1-9]|Skipped: [1-9]" "$LOG_DIR/protocol-tests.log"; then
    echo "错误：协议测试未确认四条用例全部实际通过" >&2
    exit 1
fi

echo "=== 协议验收通过：4/4，0 失败，0 跳过 ==="
