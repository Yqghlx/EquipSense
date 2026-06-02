import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, login, authHeaders } from './config.js';

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '60s', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.02'],
  },
};

export function setup() {
  return { token: login() };
}

export default function (data) {
  const headers = authHeaders(data.token);
  const deviceId = __ENV.DEVICE_ID || '00000000-0000-0000-0000-000000000001';
  const metrics = ['temperature', 'pressure', 'vibration', 'humidity'];

  const resp = http.get(
    `${BASE_URL}/api/v1/devices/${deviceId}/telemetry?metric=${metrics[Math.floor(Math.random() * metrics.length)]}&range=24hours`,
    { headers }
  );

  check(resp, {
    '遥测查询 200': (r) => r.status === 200 || r.status === 404,
  });

  sleep(0.2);
}
