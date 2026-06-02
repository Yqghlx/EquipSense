import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, login, authHeaders } from './config.js';

export const options = {
  stages: [
    { duration: '15s', target: 30 },
    { duration: '30s', target: 30 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

export function setup() {
  return { token: login() };
}

export default function (data) {
  const headers = authHeaders(data.token);

  const listResp = http.get(`${BASE_URL}/api/v1/devices?page=1&pageSize=20`, { headers });
  check(listResp, {
    '设备列表 200': (r) => r.status === 200,
    '返回分页数据': (r) => r.json('items') !== undefined,
  });

  sleep(0.5);
}
