// EquipSense API 性能压测脚本
// 使用方式：
//   快速验证：k6 run --duration 20s --vus 5 tests/stress/api-load.js
//   负载测试：k6 run tests/stress/api-load.js（默认配置 10→20→0 VUs）
//   压力测试：k6 run --env STAGES=1m:50,2m:100,30s:0 tests/stress/api-load.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiLatency = new Trend('api_latency', true);

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1500'],
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

function login() {
  const res = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
    username: 'admin',
    password: 'Admin@123',
  }), { headers: { 'Content-Type': 'application/json' } });

  if (res.status === 200) {
    return res.json('accessToken');
  }
  return null;
}

export default function () {
  // 认证端点：系统信息（需带 JWT，否则 401）
  const sysToken = login();
  if (sysToken) {
    const res = http.get(`${BASE_URL}/api/v1/system/info`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sysToken}` },
    });
    const ok = check(res, { 'system/info 200': (r) => r.status === 200 });
    if (!ok) errorRate.add(1);
    apiLatency.add(res.timings.duration);
  }

  // 匿名端点：健康检查
  {
    const res = http.get(`${BASE_URL}/health/startup`);
    const ok = check(res, { 'health/startup 200': (r) => r.status === 200 });
    if (!ok) errorRate.add(1);
    apiLatency.add(res.timings.duration);
  }

  // 认证端点：登录本身
  {
    const res = http.post(`${BASE_URL}/api/v1/auth/login`, JSON.stringify({
      username: 'admin',
      password: 'Admin@123',
    }), { headers: { 'Content-Type': 'application/json' } });
    const ok = check(res, { 'auth/login 200': (r) => r.status === 200 });
    if (!ok) errorRate.add(1);
    apiLatency.add(res.timings.duration);
  }

  // 认证 API 调用
  const token = login();
  if (token) {
    const params = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };

    // 设备列表
    {
      const res = http.get(`${BASE_URL}/api/v1/devices?page=1&pageSize=20`, params);
      const ok = check(res, { 'devices 200': (r) => r.status === 200 });
      if (!ok) errorRate.add(1);
      apiLatency.add(res.timings.duration);
    }

    // 告警列表
    {
      const res = http.get(`${BASE_URL}/api/v1/alerts?page=1&pageSize=20`, params);
      const ok = check(res, { 'alerts 200': (r) => r.status === 200 });
      if (!ok) errorRate.add(1);
      apiLatency.add(res.timings.duration);
    }

    // 工单列表
    {
      const res = http.get(`${BASE_URL}/api/v1/work-orders?page=1&pageSize=20`, params);
      const ok = check(res, { 'work-orders 200': (r) => r.status === 200 });
      if (!ok) errorRate.add(1);
      apiLatency.add(res.timings.duration);
    }
  }

  sleep(0.3);
}
