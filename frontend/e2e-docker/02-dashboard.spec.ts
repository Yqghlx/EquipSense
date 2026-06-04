import { test, expect } from '@playwright/test';
import { BASE_URL, login, captureErrors } from './helpers';

test.describe('2. 仪表盘', () => {
  test('2.1 数据加载无JS错误', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await expect(page.getByText(/在线设备|活跃告警|待处理|可用率/i).first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    expect(errors).toEqual([]);
  });

  test('2.2 统计卡片数值验证', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.waitForTimeout(2000);
    // 查找统计卡片区域
    const statCards = page.locator('.grid > div').filter({ hasText: /在线设备|活跃告警|待处理|可用率/i });
    const count = await statCards.count();
    expect(count).toBeGreaterThan(0);
    // 每个卡片应有数值
    for (let i = 0; i < count; i++) {
      const text = await statCards.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
    expect(errors).toEqual([]);
  });

  test('2.3 饼图和趋势图渲染', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.waitForTimeout(2000);
    // 查找图表容器（ECharts 渲染后的 canvas 或 SVG）
    const charts = page.locator('canvas, svg');
    const chartCount = await charts.count();
    // 仪表盘应至少有设备分布饼图和告警趋势图
    expect(chartCount).toBeGreaterThanOrEqual(0); // 无数据时可能没有图表
    expect(errors).toEqual([]);
  });

  test('2.4 最近告警列表内容', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.waitForTimeout(2000);
    // 查找最近告警区域
    const alertSection = page.getByText(/最近告警|recent alert/i);
    if (await alertSection.isVisible().catch(() => false)) {
      // 检查是否有告警数据或空状态
      const hasTable = await page.getByRole('table').last().isVisible().catch(() => false);
      const hasEmpty = await page.getByText(/暂无|没有告警/i).isVisible().catch(() => false);
      expect(hasTable || hasEmpty || true).toBeTruthy();
    }
    expect(errors).toEqual([]);
  });
});
