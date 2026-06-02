import http from 'k6/http';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export function login(username = 'admin', password = 'Admin@123') {
  const resp = http.post(`${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ username, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (resp.status !== 200) {
    throw new Error(`登录失败: ${resp.status} ${resp.body}`);
  }

  return resp.json('token');
}

export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}
