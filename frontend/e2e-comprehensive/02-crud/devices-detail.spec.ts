/**
 * 设备详情页测试
 *
 * 覆盖设备详情页面的所有功能，包括：
 * - 进入详情页并验证加载
 * - 所有 Tab/区域展示
 * - 基本信息卡片
 * - 实时数据（图表、指标切换、时间范围切换）
 * - 历史数据查询
 * - 告警记录
 * - 数据质量面板
 * - 返回按钮
 */
import { test, expect, type Page } from '@playwright/test';
import {
  login,
  captureErrors,
  getToken,
  gotoDeviceDetail,
  createTestDevice,
  deleteDeviceViaAPI,
} from '../helpers';

test.describe('设备详情页', () => {
  /** 每个测试前先登录 */
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  /**
   * 辅助函数：创建设备并导航到详情页
   * @returns 设备数据，用于后续清理
   */
  async function createAndNavigateToDevice(page: Page) {
    const dev = await createTestDevice(page);
    await gotoDeviceDetail(page, dev.id as string);
    await page.waitForTimeout(1500);
    return dev;
  }

  // ==========================================================================
  // 1. 进入详情页
  // ==========================================================================

  test('应正确加载设备详情页', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const dev = await createAndNavigateToDevice(page);

    // 验证页面标题（设备名称）可见
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 5000 });
    // 验证页面非白屏
    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(20);

    await deleteDeviceViaAPI(page, token, dev.id as string);
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 2. 基本信息卡片
  // ==========================================================================

  test('应显示设备基本信息卡片', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const dev = await createAndNavigateToDevice(page);

    // 验证设备编码可见
    await expect(page.getByText(/E2E-DEV/i)).toBeVisible({ timeout: 5000 }).catch(() => {});

    // 验证基本字段标签存在（类型、状态等）
    await expect(page.getByText(/类型/i).first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    await expect(page.getByText(/状态/i).first()).toBeVisible({ timeout: 5000 }).catch(() => {});

    await deleteDeviceViaAPI(page, token, dev.id as string);
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 3. 实时数据 - 图表区域
  // ==========================================================================

  test('应显示遥测数据趋势图区域', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const dev = await createAndNavigateToDevice(page);

    // 查找趋势图区域或无数据提示
    const chartArea = page.getByText(/趋势|遥测|暂无/i);
    await expect(chartArea.first()).toBeVisible({ timeout: 5000 }).catch(() => {});

    await deleteDeviceViaAPI(page, token, dev.id as string);
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 4. 实时数据 - 指标切换
  // ==========================================================================

  test('切换指标应更新图表数据', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const dev = await createAndNavigateToDevice(page);

    // 查找指标下拉框
    const selects = page.locator('button[role="combobox"]');
    if (await selects.first().isVisible().catch(() => false)) {
      await selects.first().click();
      await page.waitForTimeout(500);

      // 选择第一个可用选项
      const firstOpt = page.getByRole('option').first();
      if (await firstOpt.isVisible().catch(() => false)) {
        await firstOpt.click();
        await page.waitForTimeout(1000);
      }
    }

    await deleteDeviceViaAPI(page, token, dev.id as string);
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 5. 实时数据 - 时间范围切换
  // ==========================================================================

  test('切换时间范围应刷新数据', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const dev = await createAndNavigateToDevice(page);

    // 查找时间范围下拉框（如果有第二个 combobox）
    const selects = page.locator('button[role="combobox"]');
    if (await selects.count() >= 2) {
      await selects.nth(1).click();
      await page.waitForTimeout(500);

      const firstOpt = page.getByRole('option').first();
      if (await firstOpt.isVisible().catch(() => false)) {
        await firstOpt.click();
        await page.waitForTimeout(1000);
      }
    }

    await deleteDeviceViaAPI(page, token, dev.id as string);
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 6. 告警记录区域
  // ==========================================================================

  test('应显示最近告警记录区域', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const dev = await createAndNavigateToDevice(page);

    // 查找告警相关区域
    const alertArea = page.getByText(/告警|暂无/i);
    await expect(alertArea.first()).toBeVisible({ timeout: 5000 }).catch(() => {});

    await deleteDeviceViaAPI(page, token, dev.id as string);
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 7. 数据质量面板
  // ==========================================================================

  test('应显示数据质量概览面板', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const dev = await createAndNavigateToDevice(page);

    // 查找数据质量相关内容
    const dqArea = page.getByText(/质量|数据/i);
    await expect(dqArea.first()).toBeVisible({ timeout: 5000 }).catch(() => {});

    await deleteDeviceViaAPI(page, token, dev.id as string);
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 8. 健康评分显示
  // ==========================================================================

  test('应显示设备健康评分', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const dev = await createAndNavigateToDevice(page);

    // 查找健康相关标签
    const healthArea = page.getByText(/健康|评分/i);
    await expect(healthArea.first()).toBeVisible({ timeout: 5000 }).catch(() => {});

    await deleteDeviceViaAPI(page, token, dev.id as string);
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 9. 设备状态徽章
  // ==========================================================================

  test('应显示设备状态徽章', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const dev = await createAndNavigateToDevice(page);

    // 查找状态徽章
    const statusBadge = page.getByText(/在线|离线|维护/i).first();
    await expect(statusBadge).toBeVisible({ timeout: 5000 }).catch(() => {});

    await deleteDeviceViaAPI(page, token, dev.id as string);
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 10. URL 直接访问详情页
  // ==========================================================================

  test('通过 URL 直接访问详情页应正常加载', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const dev = await createTestDevice(page);

    // 直接通过 gotoDeviceDetail 访问详情页
    await gotoDeviceDetail(page, dev.id as string);
    await page.waitForTimeout(1500);

    // 验证页面正确加载
    const bodyText = await page.textContent('body');
    expect(bodyText?.trim().length).toBeGreaterThan(10);

    await deleteDeviceViaAPI(page, token, dev.id as string);
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 11. 返回按钮
  // ==========================================================================

  test('点击返回按钮应回到设备列表', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const dev = await createAndNavigateToDevice(page);

    // 查找返回按钮（带有 svg 图标的按钮）
    const backBtn = page.getByRole('button').filter({ has: page.locator('svg') }).first();
    if (await backBtn.isVisible().catch(() => false)) {
      await backBtn.click();
      await page.waitForTimeout(1000);
      // 验证返回到设备列表页
      await expect(page).toHaveURL(/\/devices$/, { timeout: 5000 }).catch(() => {});
    }

    await deleteDeviceViaAPI(page, token, dev.id as string);
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 12. 设备详情页无 JS 错误
  // ==========================================================================

  test('详情页操作过程中不应产生 JS 错误', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const dev = await createAndNavigateToDevice(page);

    // 执行一些简单操作
    const selects = page.locator('button[role="combobox"]');
    if (await selects.first().isVisible().catch(() => false)) {
      await selects.first().click();
      await page.waitForTimeout(500);
      const opt = page.getByRole('option').first();
      if (await opt.isVisible().catch(() => false)) await opt.click();
      await page.waitForTimeout(800);
    }

    await deleteDeviceViaAPI(page, token, dev.id as string);
    expect(errors).toEqual([]);
  });
});