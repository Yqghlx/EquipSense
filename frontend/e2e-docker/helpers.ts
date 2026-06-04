import { expect, type Page } from '@playwright/test';

export const BASE_URL = 'https://localhost:8443';

/** 判断是否为可忽略的 ServiceWorker SSL 错误 */
export function isIgnorableError(msg: string): boolean {
  return msg.includes('ServiceWorker') || msg.includes('SSL certificate error') || msg.includes('ResizeObserver');
}

/** 捕获非 SW 的页面错误 */
export function captureErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    if (!isIgnorableError(err.message)) errors.push(err.message);
  });
  return errors;
}

/** 登录并等待仪表盘加载 */
export async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder(/用户名|username/i).fill('admin');
  await page.getByPlaceholder(/密码|password/i).fill('Admin@123');
  await page.getByRole('button', { name: /登录|login/i }).click();
  await page.waitForURL(/dashboard/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}

/** 获取认证 token */
export async function getToken(page: Page): Promise<string> {
  const resp = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
    data: { username: 'admin', password: 'Admin@123' },
  });
  const body = await resp.json();
  return body.accessToken || body.token;
}

/** 通过侧边栏导航 */
export async function navigateViaSidebar(page: Page, pattern: RegExp) {
  await page.getByRole('link', { name: pattern }).first().click();
  await page.waitForTimeout(1500);
  await page.waitForLoadState('networkidle');
}

/** 通过 API 创建设备 */
export async function createDeviceViaAPI(
  page: Page,
  token: string,
  overrides: Record<string, string> = {},
) {
  const suffix = Date.now().toString(36);
  const resp = await page.request.post(`${BASE_URL}/api/v1/devices`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      deviceCode: `E2E-DEV-${suffix}`,
      name: 'E2E测试设备',
      type: 'motor',
      ...overrides,
    },
  });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 通过 API 删除设备 */
export async function deleteDeviceViaAPI(page: Page, token: string, id: string) {
  await page.request.delete(`${BASE_URL}/api/v1/devices/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** 通过 API 创建工单 */
export async function createWorkOrderViaAPI(
  page: Page,
  token: string,
  overrides: Record<string, string> = {},
) {
  const suffix = Date.now().toString(36);
  const resp = await page.request.post(`${BASE_URL}/api/v1/work-orders`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title: `E2E-WO-${suffix}`,
      type: 'Corrective',
      priority: 'High',
      ...overrides,
    },
  });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 通过 API 创建告警规则 */
export async function createAlertRuleViaAPI(
  page: Page,
  token: string,
  overrides: Record<string, unknown> = {},
) {
  const suffix = Date.now().toString(36);
  const resp = await page.request.post(`${BASE_URL}/api/v1/alert-rules`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: {
      name: `E2E-RULE-${suffix}`,
      ruleType: 'Threshold',
      metric: 'temperature',
      operator: 'GT',
      threshold: 80,
      severity: 'High',
      cooldownSeconds: 300,
      ...overrides,
    },
  });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 通过 API 删除告警规则 */
export async function deleteAlertRuleViaAPI(page: Page, token: string, id: string) {
  await page.request.delete(`${BASE_URL}/api/v1/alert-rules/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** 工单状态流转辅助 */
export async function transitionWorkOrder(
  page: Page,
  token: string,
  id: string,
  action: string,
  data?: Record<string, unknown>,
) {
  const h = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const resp = await page.request.put(`${BASE_URL}/api/v1/work-orders/${id}/${action}`, {
    headers: h,
    data: data ?? {},
  });
  return resp;
}
