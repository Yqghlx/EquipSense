import type { Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

/** 登录并等待仪表盘完全加载 */
export async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder(/用户名|username/i).fill('admin');
  await page.getByPlaceholder(/密码|password/i).fill('Admin@123');
  await page.getByRole('button', { name: /登录|login/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  // 等待 auth store 完全初始化（防止刷新后被重定向）
  await page.waitForTimeout(1000);
}

/** 通过侧边栏导航到指定路径 */
export async function navigateTo(page: Page, linkPattern: RegExp, expectedUrl: RegExp) {
  await page.getByRole('link', { name: linkPattern }).first().click();
  await page.waitForURL(`**/${expectedUrl.source}`, { timeout: 5000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

export { BASE_URL };
