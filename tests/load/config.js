/**
 * k6 压力测试公共配置
 *
 * 所有测试脚本共享的基础 URL、阈值和认证信息。
 * 使用方式：import { config, thresholds } from './config.js';
 */
import http from 'k6/http';

// 基础配置 — 通过环境变量覆盖：k6 run -e BASE_URL=http://host:port script.js
export const config = {
  /** 后端 API 地址 */
  baseUrl: __ENV.BASE_URL || 'http://localhost:8080',

  /** 默认租户 ID（种子数据租户） */
  tenantId: __ENV.TENANT_ID || '11111111-1111-1111-1111-111111111111',

  /** 认证用户 */
  username: __ENV.AUTH_USER || 'admin',

  /** 认证密码 */
  password: __ENV.AUTH_PASS || 'Admin@123',
};

/** 标准性能阈值 — P95 < 500ms，错误率 < 1% */
export const standardThresholds = {
  http_req_duration: ['p(95)<500'],
  http_req_failed: ['rate<0.01'],
};

/** 宽松性能阈值 — P95 < 1000ms，错误率 < 5%（适用于写操作） */
export const relaxedThresholds = {
  http_req_duration: ['p(95)<1000'],
  http_req_failed: ['rate<0.05'],
};

/** 缓存的 token（避免每次迭代都登录，提升压测准确性） */
let cachedToken = null;

/**
 * 获取 JWT Token — 通过登录 API 获取认证令牌（带缓存）
 *
 * 首次调用登录获取 token 并缓存，后续调用直接返回缓存值。
 * 这样压测的 default 函数里每次迭代不会产生登录请求，只测目标 API。
 *
 * 如需每次迭代都重新登录（测试认证性能），调用前重置 cachedToken = null。
 * @returns {string} JWT Token
 */
export function getToken() {
  if (cachedToken) return cachedToken;

  const res = http.post(`${config.baseUrl}/api/v1/auth/login`, JSON.stringify({
    username: config.username,
    password: config.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (res.status !== 200) {
    throw new Error(`登录失败: ${res.status} ${res.body}`);
  }

  // 登录 API 返回字段是 accessToken（非 token）
  cachedToken = res.json().accessToken;
  if (!cachedToken) {
    throw new Error('登录响应缺少 accessToken 字段');
  }
  return cachedToken;
}

/** 常用请求头构造 */
export function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}
