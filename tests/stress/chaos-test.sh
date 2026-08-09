#!/usr/bin/env bash
#
# tests/stress/chaos-test.sh
#
# 混沌工程故障注入脚本（Docker 原生，无需 K8s / Chaos Mesh）
#
# 用 Pumba 向 Docker Compose 服务注入故障，验证系统韧性：
#   - 网络延迟（模拟跨可用区延迟、慢查询拖累）
#   - 网络丢包（模拟不稳定网络、MQTT 丢消息）
#   - 容器 kill（模拟进程崩溃、OOM kill、Pod 重启）
#   - 容器暂停（模拟 CPU 节流、GC 暂停）
#
# 故障注入期间，chaos-probe.js（k6）持续打 API 验证：
#   - 可用性（错误率不飙升）
#   - 延迟（P99 不爆炸）
#   - 自愈（故障解除后恢复）
#
# 用法：
#   ./tests/stress/chaos-test.sh                    # 跑全部场景
#   ./tests/stress/chaos-test.sh network-delay      # 单场景
#   ./tests/stress/chaos-test.sh container-kill
#
# 前置：
#   1. docker compose -f docker/docker-compose.yml up -d（生产栈已启动）
#   2. chaos-probe.js 的 BASE_URL 指向被测环境（默认 http://localhost:8080）
#
# Pumba 以 Docker sidecar 方式运行，通过 Docker socket 控制目标容器。
# 不污染目标容器镜像——纯运行时网络/进程扰动，故障解除后容器自愈。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker/docker-compose.yml"
PROBE_SCRIPT="$SCRIPT_DIR/chaos-probe.js"

# k6 探针配置（故障注入期间持续验证韧性）
PROBE_DURATION="${PROBE_DURATION:-60s}"    # 单场景探针时长
PROBE_VUS="${PROBE_VUS:-10}"               # 并发虚拟用户
BASE_URL="${BASE_URL:-http://localhost:8080}"
AUTH_USER="${AUTH_USER:-admin}"

# 故障注入参数
DELAY_MS="${DELAY_MS:-500}"                # 网络延迟（毫秒）
DELAY_JITTER="${DELAY_JITTER:-100}"        # 延迟抖动
LOSS_PERCENT="${LOSS_PERCENT:-5}"          # 丢包率（%）
CHAOS_DURATION="${CHAOS_DURATION:-45s}"    # 单次故障持续时长

# Pumba 镜像（固定版本保证可复现）
PUMBA_IMAGE="gaiaadm/pumba:0.8.1"

# 被扰动目标（按故障类型选择，避免一次打挂所有服务）
TARGET_BACKEND="equipai-backend"
TARGET_REDIS="equipai-redis"
TARGET_POSTGRES="equipai-postgres"

log() { echo "[chaos] $*"; }
err() { echo "[chaos][ERROR] $*" >&2; }

# 检查前置条件
preflight() {
  command -v docker >/dev/null 2>&1 || { err "docker 未安装"; exit 1; }
  command -v k6 >/dev/null 2>&1 || { err "k6 未安装（brew install k6 / 参考 tests/stress/k6）"; exit 1; }
  [ -f "$PROBE_SCRIPT" ] || { err "探针脚本不存在: $PROBE_SCRIPT"; exit 1; }
  [ -n "${AUTH_PASS:-}" ] || { err "必须设置 AUTH_PASS，禁止使用公开默认凭据运行混沌测试"; exit 1; }

  # 验证目标服务存活
  if ! docker ps --format '{{.Names}}' | grep -q "$TARGET_BACKEND"; then
    err "后端容器 $TARGET_BACKEND 未运行，请先 docker compose up -d"
    exit 1
  fi
  log "前置检查通过"
}

# 运行 k6 探针（后台），故障注入期间持续验证韧性
# 输出 JUnit XML 供 CI 解析 pass/fail
run_probe() {
  local scenario="$1"
  local outfile="$SCRIPT_DIR/chaos-result-${scenario}.xml"
  local k6_status=0
  log "启动 k6 探针（场景: $scenario, 时长: $PROBE_DURATION, VUs: $PROBE_VUS）"
  # 不吞掉 k6 失败状态；否则脚本会在阈值失败或探针配置错误时错误地报告“完成”。
  set +e
  k6 run \
    -e "BASE_URL=$BASE_URL" \
    -e "AUTH_USER=$AUTH_USER" \
    -e "AUTH_PASS=$AUTH_PASS" \
    --vus "$PROBE_VUS" \
    --duration "$PROBE_DURATION" \
    --out json="$SCRIPT_DIR/chaos-probe-${scenario}.json" \
    --summary-export="$SCRIPT_DIR/chaos-summary-${scenario}.json" \
    "$PROBE_SCRIPT" 2>&1 | tee "$SCRIPT_DIR/chaos-probe-${scenario}.log"
  k6_status=${PIPESTATUS[0]}
  set -e
  if [ "$k6_status" -ne 0 ]; then
    err "k6 探针失败（场景: $scenario，退出码: $k6_status）"
    return "$k6_status"
  fi
  log "探针完成，结果: $outfile"
}

# 运行 Pumba 注入故障
# $1 = 故障类型（netem-delay / netem-loss / kill / pause）
# $2 = 目标容器名
# 其余参数透传给 pumba
inject_fault() {
  local fault_type="$1"
  local target="$2"
  shift 2
  log "注入故障: $fault_type → $target (持续 $CHAOS_DURATION)"
  # Pumba 通过 --docker-sock 控制目标，容器名用正则匹配
  # --dry-run=false 真实注入；duration 控制故障持续时长后自动解除
  docker run --rm \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    "$PUMBA_IMAGE" \
    "$fault_type" \
    --duration "$CHAOS_DURATION" \
    --regex \
    "$target" \
    "$@" 2>&1 | tee -a "$SCRIPT_DIR/chaos-injection.log" || true
  log "故障 $fault_type 已解除（$target）"
}

# 等待服务恢复（故障解除后健康检查）
wait_recovery() {
  local target="$1"
  log "等待 $target 恢复..."
  local retries=0
  while [ $retries -lt 15 ]; do
    if docker ps --filter "name=$target" --filter "status=running" --format '{{.Names}}' | grep -q "$target"; then
      log "$target 已恢复运行"
      return 0
    fi
    sleep 2
    retries=$((retries + 1))
  done
  err "$target 在 30 秒内未恢复"
  return 1
}

# =========================================================================
# 故障场景
# =========================================================================

# 场景 1：后端网络延迟（模拟慢网络 / 跨可用区调用）
scenario_network_delay() {
  log "=== 场景 1：后端网络延迟 ${DELAY_MS}ms ± ${DELAY_JITTER}ms ==="
  inject_fault netem --netem-delay "${DELAY_MS}ms:${DELAY_JITTER}ms" "$TARGET_BACKEND" &
  local pid=$!
  run_probe "network-delay"
  wait "$pid" 2>/dev/null || true
}

# 场景 2：Redis 丢包（模拟缓存抖动，验证降级到 DB 的路径）
scenario_packet_loss() {
  log "=== 场景 2：Redis 网络丢包 ${LOSS_PERCENT}% ==="
  inject_fault netem --netem-loss "$LOSS_PERCENT" "$TARGET_REDIS" &
  local pid=$!
  run_probe "packet-loss"
  wait "$pid" 2>/dev/null || true
}

# 场景 3：后端容器 kill（模拟进程崩溃 / OOM，验证重启自愈）
scenario_container_kill() {
  log "=== 场景 3：后端容器 kill（模拟崩溃） ==="
  # kill 故障：Pumba 随机杀进程，docker compose restart 策略会自动拉起
  inject_fault kill "$TARGET_BACKEND" &
  local pid=$!
  run_probe "container-kill"
  wait "$pid" 2>/dev/null || true
  wait_recovery "$TARGET_BACKEND"
}

# 场景 4：Postgres 暂停（模拟 DB CPU 节流 / 长 GC，验证连接池 + 重试）
scenario_container_pause() {
  log "=== 场景 4：Postgres 容器暂停（模拟 DB 卡顿） ==="
  inject_fault pause "$TARGET_POSTGRES" &
  local pid=$!
  run_probe "container-pause"
  wait "$pid" 2>/dev/null || true
  wait_recovery "$TARGET_POSTGRES"
}

# =========================================================================
# 主流程
# =========================================================================

usage() {
  cat <<EOF
用法: $0 [场景]
场景:
  network-delay    后端网络延迟（默认 ${DELAY_MS}ms）
  packet-loss      Redis 丢包（默认 ${LOSS_PERCENT}%）
  container-kill   后端容器 kill（验证自愈）
  container-pause  Postgres 暂停（验证连接池重试）
  all              全部场景（默认）

环境变量:
  DELAY_MS          网络延迟毫秒数（默认 500）
  DELAY_JITTER      延迟抖动毫秒数（默认 100）
  LOSS_PERCENT      丢包百分比（默认 5）
  CHAOS_DURATION    单次故障持续时长（默认 45s）
  PROBE_DURATION    k6 探针时长（默认 60s）
  PROBE_VUS         k6 并发用户数（默认 10）
  BASE_URL          被测后端地址（默认 http://localhost:8080）
  AUTH_USER         压测账户（默认 admin）
  AUTH_PASS         压测账户密码（必填，不提供公开默认值）
EOF
}

main() {
  local scenario="${1:-all}"
  preflight

  case "$scenario" in
    network-delay)   scenario_network_delay ;;
    packet-loss)     scenario_packet_loss ;;
    container-kill)  scenario_container_kill ;;
    container-pause) scenario_container_pause ;;
    all)
      scenario_network_delay
      scenario_packet_loss
      scenario_container_kill
      scenario_container_pause
      ;;
    *)
      usage
      err "未知场景: $scenario"
      exit 1
      ;;
  esac

  log "全部混沌场景完成"
  log "结果文件: $SCRIPT_DIR/chaos-summary-*.json（k6 阈值判定 pass/fail）"
}

main "$@"
