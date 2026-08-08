/**
 * tests/stress/chaos-probe.js
 *
 * 混沌测试韧性探针 — 在故障注入期间持续打 API，验证系统不崩溃。
 *
 * 与性能压测（api-read.js 等）的区别：
 *   - 性能压测：验证正常负载下的 SLO（P99 < 1000ms，错误率 < 0.1%）
 *   - 混沌探针：验证【故障注入期间】系统仍能服务核心请求（降级但不崩溃）
 *
 * 阈值设计（比正常 SLO 宽松，反映"故障容忍"而非"性能最优"）：
 *   - 健康检查成功率 ≥ 80%（允许部分失败，但不能全挂）
 *   - 错误率 < 20%（允许降级，但不能雪崩）
 *   - P95 < 3000ms（允许延迟放大 6 倍，但不能超时堆积）
 *
 * 混沌探针轮询两类端点：
 *   1. /health（基础设施存活 — DB/Redis/MQTT 连通性）
 *   2. 关键业务读 API（设备列表、告警列表 — 验证核心功能可用）
 *
 * 故障解除后，探针应观察到指标回升到正常区间（自愈验证）。
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// 自定义指标：健康检查成功率（区分于业务 API 错误率）
const healthCheckSuccess = new Rate('chaos_health_check_success');
// 故障期间的响应时间趋势（与正常 SLO 对比）
const chaosResponseTime = new Trend('chaos_response_time', true);

// 混沌阈值：故障容忍级别（比 docs/SLO.md 的正常 SLO 宽松）
// 这些阈值是"系统在故障下仍可服务"的底线，不是性能目标
export const options = {
  // 探针时长由 chaos-test.sh 的 PROBE_DURATION 通过 --duration 覆盖
  // VUs 由 --vus 覆盖，这里不在 options 里硬编码
  thresholds: {
    // 健康检查：至少 80% 成功（允许 20% 探针在故障峰值时失败）
    'chaos_health_check_success': ['rate>0.80'],
    // HTTP 错误率：低于 20%（允许降级，禁止雪崩）
    'http_req_failed': ['rate<0.20'],
    // P95 响应时间：低于 3 秒（正常 500ms × 6 = 3000ms，故障放大容忍）
    'http_req_duration': ['p(95)<3000'],
  },
};

// 缓存登录 token（避免每次迭代登录，聚焦被测 API 的韧性）
let authToken = null;

function getAuthToken() {
  if (authToken) return authToken;
  const resp = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    username: 'admin',
    password: 'Admin@123',
  }), { headers: { 'Content-Type': 'application/json' } });

  if (resp.status === 200) {
    const body = resp.json();
    authToken = body.accessToken || body.token;
  }
  return authToken;
}

/**
 * 探针主函数（k6 default）— 每次迭代轮询健康检查 + 关键业务 API
 */
export default function () {
  runProbe();
}

function runProbe() {
  // 1. 健康检查（基础设施存活）
  const healthResp = http.get(`${BASE_URL}/health`, { timeout: '5s' });
  healthCheckSuccess.add(healthResp.status === 200);
  chaosResponseTime.add(healthResp.timings.duration);

  check(healthResp, {
    '健康检查可请求': (r) => r.status !== 0 && r.status < 500,
  });

  // 2. 关键业务读 API（需认证）
  const token = getAuthToken();
  if (token) {
    const authHeaders = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: '5s',
    };

    // 设备列表（高频读路径）
    const devicesResp = http.get(`${BASE_URL}/api/v1/devices?page=1&pageSize=5`, authHeaders);
    chaosResponseTime.add(devicesResp.timings.duration);

    check(devicesResp, {
      '设备 API 可请求': (r) => r.status !== 0 && r.status < 500,
    });

    // 告警列表（实时性敏感）
    const alertsResp = http.get(`${BASE_URL}/api/v1/alerts?page=1&pageSize=5`, authHeaders);
    chaosResponseTime.add(alertsResp.timings.duration);

    check(alertsResp, {
      '告警 API 可请求': (r) => r.status !== 0 && r.status < 500,
    });
  }

  // 探针间隔（每 2 秒一轮，60s 探针 ≈ 30 次采样）
  sleep(2);
}
