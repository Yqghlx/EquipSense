/**
 * 认证相关辅助函数
 *
 * 提供 E2E 测试中常用的登录、获取 Token 等认证操作。
 * 支持五种角色：admin / lead / tech / operator / viewer。
 */
import { type Page } from '@playwright/test';

/** E2E 测试基础 URL — CI 中通过 PLAYWRIGHT_BASE_URL 环境变量覆盖 */
export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:8443';

/** 角色到登录凭证的映射 */
const ROLE_CREDENTIALS: Record<string, { username: string; password: string }> = {
  admin: { username: 'admin', password: 'Admin@123' },
  lead: { username: 'lead', password: 'Lead@123' },
  tech: { username: 'tech', password: 'Tech@123' },
  operator: { username: 'operator', password: 'Operator@123' },
  viewer: { username: 'viewer', password: 'Viewer@123' },
};

/**
 * 以指定角色登录并等待仪表盘加载
 *
 * @param page - Playwright Page 实例
 * @param role - 角色名称：admin / lead / tech / operator / viewer
 */
export async function loginAs(page: Page, role: string): Promise<void> {
  const credentials = ROLE_CREDENTIALS[role];
  if (!credentials) {
    throw new Error(`未知的角色: ${role}，支持的角色: ${Object.keys(ROLE_CREDENTIALS).join(', ')}`);
  }

  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder(/用户名|username/i).fill(credentials.username);
  await page.getByPlaceholder(/密码|password/i).fill(credentials.password);
  await page.getByRole('button', { name: /登录|login/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}

/**
 * 以管理员身份登录（兼容原有调用方式）
 *
 * @param page - Playwright Page 实例
 */
export async function login(page: Page): Promise<void> {
  await loginAs(page, 'admin');
}

/**
 * 获取管理员认证 Token
 *
 * @param page - Playwright Page 实例
 * @returns JWT Token 字符串
 */
export async function getToken(page: Page): Promise<string> {
  return getTokenForRole(page, 'admin');
}

/**
 * 按角色获取认证 Token
 *
 * @param page - Playwright Page 实例
 * @param role - 角色名称
 * @returns JWT Token 字符串
 */
export async function getTokenForRole(page: Page, role: string): Promise<string> {
  const credentials = ROLE_CREDENTIALS[role];
  if (!credentials) {
    throw new Error(`未知的角色: ${role}，支持的角色: ${Object.keys(ROLE_CREDENTIALS).join(', ')}`);
  }

  const resp = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
    data: { username: credentials.username, password: credentials.password },
  });
  const body = await resp.json();
  return body.accessToken || body.token;
}
