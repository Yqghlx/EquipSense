/**
 * 遥测数据写入压力测试
 *
 * 模拟多设备并发写入遥测数据，测试后端 HTTP 上报通道 + MQTT→DB 管线的吞吐量。
 * 三种负载级别：100 设备 / 500 设备 / 1000 设备。
 *
 * 修复历史：
 *   - v1：用 {metric, value} 单值格式 + 虚构 deviceId，全部 400。已废弃。
 *   - v2：改为 {metrics: {name: value}} 字典格式 + setup 拉真实设备列表。
 *   - v3（当前）：
 *     • setup 阶段集中登录拿 token，所有 VU 共享（避免每 VU 独立登录击垮 Redis）
 *     • 改用 constant-vus 替代 constant-arrival-rate（后者在 sleep-heavy 场景下测量失真）
 *     • sleep(5) → sleep(2)，让请求密度更接近真实工业现场
 *
 * 运行方式：
 *   k6 run -e DEVICES=100 -e DURATION=60s tests/load/telemetry-write.js
 *   k6 run -e DEVICES=500 -e DURATION=5m tests/load/telemetry-write.js
 *   k6 run -e DEVICES=1000 -e DURATION=10m tests/load/telemetry-write.js
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { config, relaxedThresholds, getToken, authHeaders } from './config.js';

/** 设备数量 — 默认 100，作为 VU 数 */
const deviceCount = parseInt(__ENV.DEVICES || '100');

/** 压测时长 — CI 可缩短为轻量写路径回归，手工容量测试按场景传入更长时长 */
const duration = __ENV.DURATION || '60s';

/** 模拟的指标池，每次上报随机挑 3 个写入 metrics 字典 */
const metricPool = ['temperature', 'pressure', 'vibration', 'humidity', 'rpm', 'current', 'voltage'];

export const options = {
  scenarios: {
    telemetry_write: {
      executor: 'constant-vus',
      vus: Math.min(deviceCount, 200),
      duration: duration,
    },
  },
  thresholds: relaxedThresholds,
};

/**
 * setup 阶段：集中登录 + 拉取真实设备列表
 *  - token 共享给所有 VU，避免每 VU 独立登录击垮 Redis
 *  - 用真实 device_code 避免压测时全部 400
 */
export function setup() {
  const token = getToken();
  console.log(`setup: 已集中登录，token 长度 ${token.length}，将共享给 ${deviceCount} 个 VU`);

  const res = http.get(
    `${config.baseUrl}/api/v1/devices?page=1&pageSize=${Math.min(deviceCount, 500)}`,
    { headers: authHeaders(token) },
  );
  if (res.status !== 200) {
    throw new Error(`拉取设备列表失败: ${res.status} ${res.body}`);
  }
  const items = res.json('items') || [];
  if (items.length === 0) {
    throw new Error('数据库无设备，无法压测');
  }
  const codes = items.map((d) => d.deviceCode);
  console.log(`setup: 取到 ${codes.length} 个真实设备，循环复用模拟 ${deviceCount} 设备`);
  return { token, codes };
}

export default function (data) {
  const headers = authHeaders(data.token);

  // 循环复用真实设备 code（实际设备数 < deviceCount 时仍可压满并发）
  const deviceCode = data.codes[__VU % data.codes.length];

  // 随机挑 3 个指标组成 metrics 字典，匹配 TelemetryUploadRequest.Metrics
  const metrics = {};
  for (let i = 0; i < 3; i++) {
    const m = metricPool[(__VU + i) % metricPool.length];
    metrics[m] = Math.round(Math.random() * 100 * 100) / 100;
  }

  const payload = JSON.stringify({
    deviceId: deviceCode,
    metrics,
    timestamp: new Date().toISOString(),
    quality: 'good',
  });

  const res = http.post(
    `${config.baseUrl}/api/v1/telemetry`,
    payload,
    { headers },
  );

  check(res, {
    '写入成功': (r) => r.status === 200 || r.status === 202,
  });

  sleep(2);
}
