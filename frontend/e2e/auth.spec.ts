import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

/** 辅助函数：登录后等待仪表盘加载 */
async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder(/用户名|username/i).fill('admin');
  await page.getByPlaceholder(/密码|password/i).fill('Admin@123');
  await page.getByRole('button', { name: /登录|login/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

test.describe('认证流程', () => {
  test('登录成功后跳转到仪表盘', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('错误密码停留在登录页', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('wrong');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('导航和页面加载', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('仪表盘加载成功', async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });
  });

  test('导航到设备管理页', async ({ page }) => {
    await page.getByRole('link', { name: /设备/i }).first().click();
    await page.waitForURL('**/devices', { timeout: 5000 });
    await expect(page).toHaveURL(/devices/);
  });

  test('导航到告警中心页', async ({ page }) => {
    await page.getByRole('link', { name: /告警/i }).first().click();
    await page.waitForURL('**/alerts', { timeout: 5000 });
    await expect(page).toHaveURL(/alerts/);
  });

  test('导航到工单管理页', async ({ page }) => {
    await page.getByRole('link', { name: /工单/i }).click();
    await page.waitForURL('**/work-orders', { timeout: 5000 });
    await expect(page).toHaveURL(/work-orders/);
  });

  test('导航到 AI 分析页', async ({ page }) => {
    await page.getByRole('link', { name: /分析/i }).click();
    await page.waitForURL('**/analyses', { timeout: 5000 });
    await expect(page).toHaveURL(/analyses/);
  });

  test('导航到系统设置页', async ({ page }) => {
    await page.getByRole('link', { name: /设置/i }).click();
    await page.waitForURL('**/settings', { timeout: 5000 });
    await expect(page).toHaveURL(/settings/);
  });
});

test.describe('设备管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/devices`);
    await page.waitForLoadState('networkidle');
  });

  test('设备列表显示表格或空状态', async ({ page }) => {
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasNoData = await page.getByText(/暂无数据|no data/i).isVisible().catch(() => false);
    expect(hasTable || hasNoData).toBeTruthy();
  });
});

test.describe('告警中心', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/alerts`);
    await page.waitForLoadState('networkidle');
  });

  test('告警列表页加载成功', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('工单管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/work-orders`);
    await page.waitForLoadState('networkidle');
  });

  test('工单列表页加载成功', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('AI 分析', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/analyses`);
    await page.waitForLoadState('networkidle');
  });

  test('分析列表页加载成功', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('系统设置', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/settings`);
    await page.waitForLoadState('networkidle');
  });

  test('设置页加载成功', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });
  });
});
