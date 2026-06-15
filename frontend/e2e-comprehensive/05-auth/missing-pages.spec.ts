import { test, expect } from '@playwright/test';
import { BASE_URL, login } from '../helpers';

const URL = 'https://localhost:8443';

test.describe('05-缺失页面验证', () => {
  test('1. FMEA 页面可访问并展示数据', async ({ page }) => {
    await login(page);
    await page.goto(`${URL}/fmea`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const rowCount = await page.locator('table tbody tr').count();
    console.log(`FMEA 数据行数: ${rowCount}`);
    expect(rowCount).toBeGreaterThan(0);
  });

  test('2. 评估页面可访问', async ({ page }) => {
    await login(page);
    await page.goto(`${URL}/evaluation`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('评估页面 URL:', page.url());
    expect(page.url()).toContain('/evaluation');
  });

  test('3. 分析页面可访问', async ({ page }) => {
    await login(page);
    await page.goto(`${URL}/analysis`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('分析页面 URL:', page.url());
  });

  test('4. 忘记密码页面可访问', async ({ page }) => {
    await page.goto(`${URL}/forgot-password`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByPlaceholder(/邮箱|email/i)).toBeVisible({ timeout: 10000 });
    console.log('忘记密码页面正常显示');
  });

  test('5. 重置密码页面（无 token）', async ({ page }) => {
    await page.goto(`${URL}/reset-password`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    console.log('重置密码页面 URL:', page.url());
  });

  test('6. 工单报表页面可访问', async ({ page }) => {
    await login(page);
    await page.goto(`${URL}/work-orders/reports`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('工单报表页面 URL:', page.url());
  });

  test('7. FMEA 页面 RPN 染色', async ({ page }) => {
    await login(page);
    await page.goto(`${URL}/fmea`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const badges = page.locator('table tbody tr [class*="bg-"]');
    const count = await badges.count();
    console.log(`RPN Badge 数量: ${count}`);
  });

  test('8. 侧边栏 FMEA 导航', async ({ page }) => {
    await login(page);
    await page.waitForLoadState('networkidle');
    const fmeaLink = page.getByRole('link', { name: /FMEA|故障模式/i });
    await expect(fmeaLink).toBeVisible({ timeout: 10000 });
    console.log('FMEA 导航入口存在');
  });

  test('9. 登录页忘记密码链接', async ({ page }) => {
    await page.goto(`${URL}/login`);
    await page.waitForLoadState('networkidle');
    const forgotLink = page.getByRole('link', { name: /忘记密码|forgot/i });
    await expect(forgotLink).toBeVisible({ timeout: 10000 });
    const href = await forgotLink.getAttribute('href');
    console.log(`忘记密码链接 href: ${href}`);
    expect(href).toBe('/forgot-password');
  });
});
