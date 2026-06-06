/**
 * MQTT 吞吐量压力测试
 *
 * 使用 k6 x MQTT 扩展测试 MQTT 消息发布吞吐量。
 * 注意：需要安装 k6 MQTT 扩展（k6 run --ext jslib.k6-mqtt=...）
 *
 * 运行方式：
 *   k6 run -e MQTT_BROKER=localhost:1883 -e DEVICES=100 tests/load/mqtt-publish.js
 */
import { check, sleep } from 'k6';
import { config, relaxedThresholds } from './config.js';

/** MQTT Broker 地址 */
const mqttBroker = __ENV.MQTT_BROKER || 'localhost:1883';

/** 设备数量 */
const deviceCount = parseInt(__ENV.DEVICES || '100');

export const options = {
  scenarios: {
    mqtt_publish: {
      executor: 'constant-arrival-rate',
      rate: deviceCount * 2, // 每秒每个设备发 2 条
      timeUnit: '1s',
      duration: '30s',
      preAllocatedVUs: Math.min(deviceCount, 100),
      maxVUs: Math.min(deviceCount, 200),
    },
  },
  thresholds: relaxedThresholds,
};

/** 指标列表 */
const metrics = ['temperature', 'pressure', 'vibration'];

export default function () {
  const deviceId = `device-${__VU % deviceCount + 1}`;
  const metric = metrics[__VU % metrics.length];
  const value = (Math.random() * 100).toFixed(2);

  const topic = `factory/${config.tenantId}/telemetry/${deviceId}`;
  const payload = JSON.stringify({
    metric,
    value: parseFloat(value),
    timestamp: new Date().toISOString(),
    quality: 'Good',
  });

  // 注意：k6 原生不支持 MQTT，此处为脚本模板。
  // 实际运行需要使用 k6 MQTT 扩展或通过 WebSocket 代理。
  // 替代方案：使用 mosquitto_pub 命令行工具进行基准测试
  //   mosquitto_pub -h $BROKER -t "$TOPIC" -m "$PAYLOAD"

  sleep(0.5);
}
