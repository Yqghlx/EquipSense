import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from './config.js';

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '10s', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const resp = http.post(`${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ username: 'admin', password: 'Admin@123' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(resp, {
    '登录成功': (r) => r.status === 200,
    '返回 token': (r) => r.json('token') !== undefined,
    '响应时间 < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
