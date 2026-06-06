/**
 * 遥测数据写入压力测试
 *
 * 模拟多设备并发写入遥测数据，测试后端 MQTT → DB 管线的吞吐量。
 * 三种负载级别：100 设备 / 500 设备 / 1000 设备。
 *
 * 运行方式：
 *   k6 run -e DEVICES=100 tests/load/telemetry-write.js
 *   k6 run -e DEVICES=500 tests/load/telemetry-write.js
 *   k6 run -e DEVICES=1000 tests/load/telemetry-write.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { config, relaxedThresholds, getToken, authHeaders } from './config.js';

/** 设备数量 — 默认 100 */
const deviceCount = parseInt(__ENV.DEVICES || '100');

/** 每个 VU 代表一个设备 */
export const options = {
  scenarios: {
    telemetry_write: {
      executor: 'constant-arrival-rate',
      rate: deviceCount,
      timeUnit: '5s',
      duration: '60s',
      preAllocatedVUs: Math.min(deviceCount, 200),
      maxVUs: Math.min(deviceCount, 500),
    },
  },
  thresholds: relaxedThresholds,
};

/** 指标列表 */
const metrics = ['temperature', 'pressure', 'vibration', 'humidity', 'rpm'];

export default function () {
  const token = getToken();
  const headers = authHeaders(token);
  const deviceId = `device-${__VU % deviceCount + 1}`;

  // 生成遥测数据
  const metric = metrics[__VU % metrics.length];
  const value = Math.random() * 100;

  const payload = JSON.stringify({
    deviceId,
    metric,
    value,
    timestamp: new Date().toISOString(),
  });

  const res = http.post(
    `${config.baseUrl}/api/v1/telemetry`,
    payload,
    { headers },
  );

  check(res, {
    '写入成功': (r) => r.status === 200 || r.status === 202,
  });

  sleep(5);
}
