#!/usr/bin/env bash
# MQTT 吞吐量压力测试（mosquitto_pub 版本）
#
# 替代 k6 的 mqtt-publish.js（k6 原生不支持 MQTT）。
# 用 mosquitto_pub 并行发布到 factory/{tenant}/telemetry/{device} 主题，
# 直接测量 Mosquitto broker + 后端 MQTT 订阅者的真实吞吐量。
#
# 运行方式：
#   DEVICES=100 INTERVAL=2 DURATION=60 ./tests/load/mqtt-publish.sh
#   DEVICES=500 INTERVAL=5 DURATION=120 ./tests/load/mqtt-publish.sh
#
# 依赖：brew install mosquitto（提供 mosquitto_pub）

set -euo pipefail

BROKER="${MQTT_BROKER:-localhost}"
PORT="${MQTT_PORT:-1883}"
TENANT="${TENANT_ID:-11111111-1111-1111-1111-111111111111}"
DEVICES="${DEVICES:-100}"
INTERVAL="${INTERVAL:-2}"
DURATION="${DURATION:-60}"
# Mosquitto 启用了认证（docker-compose.yml 里 MQTT_USERNAME / MQTT_PASSWORD 默认 device/device123）
MQTT_USER="${MQTT_USERNAME:-device}"
MQTT_PASS="${MQTT_PASSWORD:-device123}"

echo "=== MQTT 吞吐测试 ==="
echo "Broker:     $BROKER:$PORT"
echo "Tenant:     $TENANT"
echo "Devices:    $DEVICES"
echo "Interval:   ${INTERVAL}s per device"
echo "Duration:   ${DURATION}s"
expected=$(( DEVICES * (DURATION / INTERVAL) ))
echo "Expected msgs: $expected"
echo "----------------"

# 取开始时间
start=$(date +%s)
count=0

while true; do
  now=$(date +%s)
  elapsed=$(( now - start ))
  if [ "$elapsed" -ge "$DURATION" ]; then break; fi

  # 并行发送 DEVICES 条消息，每条来自不同设备
  for i in $(seq 1 "$DEVICES"); do
    metric=$(( i % 3 ))
    case $metric in
      0) m="temperature"; v=$(( 20 + RANDOM % 80 ));;
      1) m="pressure";    v=$(( RANDOM % 100 ));;
      2) m="vibration";   v=$(( RANDOM % 50 ));;
    esac

    payload=$(cat <<JSON
{"metric":"$m","value":${v}.0,"timestamp":"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)","quality":"Good"}
JSON
)
    mosquitto_pub -h "$BROKER" -p "$PORT" \
      -u "$MQTT_USER" -P "$MQTT_PASS" \
      -t "factory/$TENANT/telemetry/device-$i" \
      -m "$payload" -q 1 &
    count=$(( count + 1 ))
  done

  # 等本轮所有发布完成（防止下一轮挤压）
  wait
  sleep "$INTERVAL"
done

end=$(date +%s)
elapsed=$(( end - start ))
rate=$(echo "scale=1; $count / $elapsed" | bc)
echo "----------------"
echo "实际发送: $count 条"
echo "耗时:     ${elapsed}s"
echo "吞吐量:   ${rate} msg/s"
