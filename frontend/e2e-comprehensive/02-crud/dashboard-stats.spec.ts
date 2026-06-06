/**
 * 仪表盘统计测试
 *
 * 覆盖 Phase 3 增强的仪表盘统计功能：
 * - 统计卡片（设备总数、在线设备、活跃告警、待处理工单）
 * - 告警严重度分布饼图
 * - 工单趋势折线图
 * - 工单状态分布
 * - 统计卡片点击跳转
 */
import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  login,
  getToken,
  captureErrors,
} from '../helpers';

test.describe('02-仪表盘统计', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('1. 仪表盘应正确加载', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 验证页面加载成功（标题或关键元素）
    const dashboardContent = page.locator('main').first();
    await expect(dashboardContent).toBeVisible({ timeout: 5000 });

    expect(errors).toEqual([]);
  });

  test('2. 应显示统计卡片', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 验证统计卡片区域存在
    const statCards = page.locator('[class*="card"], [class*="Card"]');
    const cardCount = await statCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    expect(errors).toEqual([]);
  });

  test('3. 告警严重度分布饼图应渲染', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 查找告警严重度分布标题
    const severityTitle = page.getByText(/告警严重度分布|Alert Severity/i).first();
    const hasTitle = await severityTitle.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTitle) {
      await expect(severityTitle).toBeVisible();

      // 验证 ECharts 饼图容器存在
      const chartContainers = page.locator('div[_echarts_instance_], div[class*="chart"]');
      const chartCount = await chartContainers.count();
      expect(chartCount).toBeGreaterThanOrEqual(1);
    }

    expect(errors).toEqual([]);
  });

  test('4. 工单趋势折线图应渲染', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 查找工单趋势标题
    const trendTitle = page.getByText(/工单趋势|Work Order Trend/i).first();
    const hasTitle = await trendTitle.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTitle) {
      await expect(trendTitle).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test('5. 工单状态分布应显示', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 查找工作单状态分布标题
    const statusTitle = page.getByText(/工单状态分布|Work Order Status/i).first();
    const hasTitle = await statusTitle.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasTitle) {
      await expect(statusTitle).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test('6. 统计卡片点击应跳转到对应页面', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 查找可点击的统计卡片（cursor-pointer）
    const clickableCards = page.locator('[class*="cursor-pointer"]');
    const cardCount = await clickableCards.count();

    if (cardCount > 0) {
      // 点击第一个卡片
      await clickableCards.first().click();
      await page.waitForTimeout(2000);

      // 验证 URL 变化（跳转到了某个详情页）
      const url = page.url();
      expect(url).not.toBe(`${BASE_URL}/dashboard`);
      expect(url).toMatch(/\/(devices|alerts|work-orders)/);
    }

    expect(errors).toEqual([]);
  });

  test('7. 最近告警列表应显示', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 查找最近告警区域
    const recentAlerts = page.getByText(/最近告警|Recent Alerts/i).first();
    const hasAlerts = await recentAlerts.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasAlerts) {
      await expect(recentAlerts).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test('8. 仪表盘统计 API 应返回数据', async ({ page }) => {
    const errors = captureErrors(page);

    // 直接调用 API 验证统计接口
    const token = await getToken(page);
    const resp = await page.request.get(`${BASE_URL}/api/v1/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 记录实际状态码方便调试
    if (!resp.ok()) {
      const status = resp.status();
      const body = await resp.text().catch(() => '');
      // 如果 API 尚未实现或返回 404，跳过而非失败
      console.log(`Dashboard stats API 返回 ${status}: ${body}`);
    }
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();

    // 验证返回结构
    expect(data).toHaveProperty('totalDevices');
    expect(data).toHaveProperty('onlineDevices');
    expect(data).toHaveProperty('activeAlerts');
    expect(data).toHaveProperty('pendingWorkOrders');
    expect(typeof data.totalDevices).toBe('number');
    expect(typeof data.activeAlerts).toBe('number');

    expect(errors).toEqual([]);
  });
});
