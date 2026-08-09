import http from 'k6/http';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

/**
 * 登录压测账户。密码必须由运行者显式传入，禁止在压测脚本中保留公开默认值。
 */
export function login(username = __ENV.AUTH_USER || 'admin', password = __ENV.AUTH_PASS || '') {
  if (!password) {
    throw new Error('缺少 AUTH_PASS，请使用 -e AUTH_PASS=<测试账户密码> 显式传入压测凭据');
  }

  const resp = http.post(`${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ username, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (resp.status !== 200) {
    throw new Error(`登录失败: ${resp.status} ${resp.body}`);
  }

  const body = resp.json();
  const token = body.accessToken || body.token;
  if (!token) {
    throw new Error('登录响应缺少 accessToken 字段');
  }
  return token;
}

export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}
