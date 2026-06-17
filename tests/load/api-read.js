/**
 * API 读取压力测试
 *
 * 模拟多用户并发查询设备列表、告警、工单等 API。
 * 两种负载级别：50 并发 / 200 并发。
 *
 * 运行方式：
 *   k6 run -e VUS=50 tests/load/api-read.js
 *   k6 run -e VUS=200 tests/load/api-read.js
 *
 * 设计要点（v2 修复）：
 *   - 在 setup 阶段集中登录拿 token，所有 VU 共享（避免每个 VU 自己登录导致登录风暴）
 *   - 之前每 VU 独立 JS context + 独立 cachedToken，200 VUs 启动 = 200 个并发登录请求，
 *     击垮 Redis 的 refresh token 检查（StackExchange.Redis 5s 超时）。
 */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { config, standardThresholds, getToken, authHeaders } from './config.js';

/** 并发用户数 — 默认 50 */
const vus = parseInt(__ENV.VUS || '50');

export const options = {
  scenarios: {
    api_read: {
      executor: 'constant-vus',
      vus: vus,
      duration: '30s',
    },
  },
  thresholds: standardThresholds,
};

/** 需要测试的 API 端点 */
const endpoints = [
  { name: '设备列表', path: '/api/v1/devices?page=1&pageSize=20' },
  { name: '告警列表', path: '/api/v1/alerts?page=1&pageSize=20' },
  { name: '工单列表', path: '/api/v1/work-orders?page=1&pageSize=20' },
  { name: '仪表盘统计', path: '/api/v1/dashboard/stats' },
  { name: '通知列表', path: '/api/v1/notifications?page=1&pageSize=20' },
];

/** setup 阶段集中登录一次，token 传给所有 VU 共享 */
export function setup() {
  const token = getToken();
  console.log(`setup: 已集中登录，token 长度 ${token.length}，将共享给 ${vus} 个 VU`);
  return { token };
}

export default function (data) {
  const headers = authHeaders(data.token);

  // 轮询所有端点
  for (const ep of endpoints) {
    const res = http.get(`${config.baseUrl}${ep.path}`, { headers });

    check(res, {
      [`${ep.name} 成功`]: (r) => r.status === 200,
      [`${ep.name} P95<500ms`]: (r) => r.timings.duration < 500,
    });
  }

  sleep(1);
}
