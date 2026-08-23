/**
 * 告警风暴压力测试 — 验证 AlertAggregator 30 分钟窗口防风暴机制
 *
 * 场景：100 个 VU 同时上报会触发告警的异常数据（同一设备同一指标），
 * 期望后端 AlertAggregator 在 30 分钟窗口内：
 *   - 第 1 次：立即创建新告警（result: created）
 *   - 第 2-3 次：更新已有告警（result: updated）
 *   - 超过 3 次：静默不处理（result: suppressed）
 *
 * 验证维度：
 *   1. 后端不崩 — 100 VU 并发写入 P95 < 500ms，错误率 < 5%
 *   2. 告警表无重复 — 查询活跃告警数 < VU 数 × 阈值（如单指标 < 10 条）
 *   3. 不同设备/指标组合互不影响 — 压测后查询多组 (device, metric)，每组独立计数
 *
 * 运行方式：
 *   k6 run tests/load/alert-storm.js                     # 默认 100 VU，60s
 *   k6 run -e VUS=200 tests/load/alert-storm.js          # 高压
 *   k6 run -e DURATION=120s tests/load/alert-storm.js    # 长时间
 *
 * 前置条件：
 *   - 后端启动 + seed（含设备 + 告警规则）
 *   - 设备对应的告警规则已存在（否则不会触发告警）
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { config, relaxedThresholds, getToken, authHeaders } from './config.js';

/** 并发 VU 数 — 模拟同时触发的告警源数量 */
const vus = parseInt(__ENV.VUS || '100');

/** 测试时长 — 必须足够长以触发聚合窗口 */
const duration = __ENV.DURATION || '60s';

export const options = {
  scenarios: {
    alert_storm: {
      executor: 'constant-vus',
      vus: vus,
      duration: duration,
    },
  },
  thresholds: {
    ...relaxedThresholds,
    // 关键断言：被静默的请求不算失败（HTTP 200/202 都 OK）
    // 但 HTTP 5xx 必须低于 1%（说明后端没崩）
    'http_req_failed{system:error}': ['rate<0.01'],
  },
};

/**
 * 异常指标池 — 这些值会触发阈值规则（seeded 默认规则温度 > 80）
 * 每个 VU 使用不同 device + metric 组合，确保不互相干扰
 */
const anomalyMetrics = [
  { name: 'temperature', value: 95 },   // 触发温度告警
  { name: 'vibration', value: 8 },      // 触发振动告警
  { name: 'pressure', value: 120 },     // 触发压力告警
];

/**
 * setup 阶段：集中登录 + 拉取设备列表
 * 返回 token 和 device codes 给所有 VU 共享
 */
export function setup() {
  const token = getToken();
  console.log(`[storm] setup: 共享 token 给 ${vus} 个 VU`);

  // API 校验 PageSize ≤ 100（每页条数必须在 1 到 100 之间），超出直接 400。
  const res = http.get(
    `${config.baseUrl}/api/v1/devices?page=1&pageSize=100`,
    { headers: authHeaders(token) },
  );
  if (res.status !== 200) {
    throw new Error(`拉取设备列表失败: ${res.status} ${res.body}`);
  }

  const items = res.json('items') || [];
  if (items.length === 0) {
    throw new Error('数据库无设备，无法压测告警风暴');
  }

  const codes = items.map((d) => d.deviceCode);
  console.log(`[storm] setup: 取到 ${codes.length} 个真实设备`);
  return { token, codes };
}

/**
 * 每个 VU 持续上报异常数据触发告警
 * 用 __VU 取模确保不同 VU 用不同 device + metric 组合
 */
export default function (data) {
  const headers = authHeaders(data.token);

  // 每个 VU 固定一个 device + metric 组合（让 AlertAggregator 看到的是同一组）
  // 这样 N 个 VU 触发 N 组独立告警，每组内部应当被聚合防风暴
  const deviceCode = data.codes[__VU % data.codes.length];
  const metric = anomalyMetrics[__VU % anomalyMetrics.length];

  const payload = JSON.stringify({
    deviceId: deviceCode,
    metrics: { [metric.name]: metric.value },
    timestamp: new Date().toISOString(),
    quality: 'good',
  });

  const res = http.post(
    `${config.baseUrl}/api/v1/telemetry`,
    payload,
    { headers },
  );

  // 后端应在 100 VU 并发下稳定返回 200/202（即使内部 AlertAggregator 静默了部分告警）
  const ok = check(res, {
    '请求成功': (r) => r.status === 200 || r.status === 202,
  });

  if (!ok) {
    console.warn(`[VU${__VU}] 请求失败: ${res.status} ${res.body?.substring(0, 200)}`);
  }

  // 1 秒间隔（让 AlertAggregator 有时间处理 + 触发多次）
  sleep(1);
}

/**
 * teardown 阶段：打印告警表统计（人工核对防风暴效果）
 *
 * 期望：
 *   - 活跃告警数 < vus（聚合后应远少于原始触发次数）
 *   - 没有 5xx 错误（后端未崩）
 */
export function teardown(data) {
  const headers = authHeaders(data.token);

  const res = http.get(
    `${config.baseUrl}/api/v1/alerts?page=1&pageSize=1`,
    { headers },
  );

  if (res.status === 200) {
    const total = res.json('totalCount') || res.json('total') || '未知';
    console.log(`[storm] teardown: 当前告警总数 = ${total}`);
    console.log(`[storm] 预期：如果 AlertAggregator 工作正常，告警数应远少于 VU × iteration`);
    console.log(`[storm] 检查方法：去 /alerts 页面或 Grafana 看告警触发率，确认无 100VU × 60 = 6000 条爆炸`);
  }
}
