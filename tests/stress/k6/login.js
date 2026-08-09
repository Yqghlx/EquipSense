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

const AUTH_PASS = __ENV.AUTH_PASS || '';
if (!AUTH_PASS) {
  throw new Error('缺少 AUTH_PASS，请使用 -e AUTH_PASS=<测试账户密码> 显式传入压测凭据');
}

export default function () {
  const resp = http.post(`${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ username: __ENV.AUTH_USER || 'admin', password: AUTH_PASS }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(resp, {
    '登录成功': (r) => r.status === 200,
    '返回 token': (r) => {
      const body = r.json();
      return (body.accessToken || body.token) !== undefined;
    },
    '响应时间 < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
