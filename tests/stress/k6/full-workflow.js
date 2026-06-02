import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, login, authHeaders } from './config.js';

export const options = {
  stages: [
    { duration: '20s', target: 20 },
    { duration: '60s', target: 20 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.05'],
  },
};

export function setup() {
  return { token: login() };
}

export default function (data) {
  const headers = authHeaders(data.token);

  const dashResp = http.get(`${BASE_URL}/api/v1/dashboard/summary`, { headers });
  check(dashResp, { '仪表盘': (r) => r.status === 200 || r.status === 404 });

  sleep(1);

  const devResp = http.get(`${BASE_URL}/api/v1/devices?page=1&pageSize=20`, { headers });
  check(devResp, { '设备列表': (r) => r.status === 200 });

  sleep(0.5);

  const alertResp = http.get(`${BASE_URL}/api/v1/alerts?page=1&pageSize=20`, { headers });
  check(alertResp, { '告警列表': (r) => r.status === 200 });

  sleep(0.5);

  const woResp = http.get(`${BASE_URL}/api/v1/work-orders?page=1&pageSize=20`, { headers });
  check(woResp, { '工单列表': (r) => r.status === 200 });

  sleep(2);
}
