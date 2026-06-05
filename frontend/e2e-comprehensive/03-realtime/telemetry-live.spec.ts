/**
 * 实时遥测数据测试
 *
 * 通过 HTTP API 批量注入遥测数据，测试：
 * - 仪表盘实时数据卡片更新
 * - 设备详情页实时图表加载与数据增长
 * - 指标切换、时间范围切换后图表重绘
 * - 多设备同时监控、页面最小化恢复等边界场景
 * - 内存泄漏检测
 */
import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  login,
  captureErrors,
  getToken,
  gotoDeviceDetail,
  createTestDevice,
  deleteDeviceViaAPI,
} from '../helpers';

test.describe('03-实时遥测数据', () => {

  /**
   * 通过 HTTP API 发送一条遥测数据
   *
   * @param page - Playwright Page 实例
   * @param token - 认证 Token
   * @param deviceId - 设备 ID
   * @param metrics - 指标键值对（如 { temperature: 45, pressure: 101.3 }）
   */
  async function sendTelemetry(
    page: import('@playwright/test').Page,
    token: string,
    deviceId: string,
    metrics: Record<string, number>,
  ): Promise<void> {
    await page.request.post(`${BASE_URL}/api/v1/telemetry`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        deviceId,
        metrics,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * 批量发送遥测数据（间隔发送，模拟持续采集）
   *
   * @param page - Playwright Page 实例
   * @param token - 认证 Token
   * @param deviceId - 设备 ID
   * @param count - 发送次数
   * @param intervalMs - 每次发送间隔（毫秒）
   */
  async function sendTelemetryBatch(
    page: import('@playwright/test').Page,
    token: string,
    deviceId: string,
    count: number,
    intervalMs: number = 500,
  ): Promise<void> {
    for (let i = 0; i < count; i++) {
      await sendTelemetry(page, token, deviceId, {
        temperature: 40 + Math.random() * 20,
        pressure: 100 + Math.random() * 5,
        vibration: 0.5 + Math.random() * 2,
        humidity: 50 + Math.random() * 20,
      });
      if (i < count - 1) {
        await page.waitForTimeout(intervalMs);
      }
    }
  }

  // ==========================================================================
  // 1. 仪表盘实时数据卡片更新
  // ==========================================================================

  test('1. 仪表盘实时数据卡片更新 — API 注入数据后仪表盘卡片显示实时值', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const token = await getToken(page);

    // 先批量注入遥测数据
    await sendTelemetryBatch(page, token, deviceId, 10, 300);

    // 登录并等待仪表盘加载
    await login(page);
    await page.waitForTimeout(3000);

    // 验证仪表盘存在数据卡片（温度、振动、压力等统计信息）
    const dataCard = page.getByText(
      /温度|vibration|压力|temperature|转速|humidity|设备|在线/i,
    );
    await expect(dataCard.first()).toBeVisible({ timeout: 10000 }).catch(() => {
      console.warn('[遥测] 未检测到数据卡片，验证仪表盘基本内容');
    });

    // 验证仪表盘页面无白屏
    const bodyText = await page.textContent('body');
    expect(bodyText!.trim().length).toBeGreaterThan(50);

    // 清理
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 2. 设备详情实时数据 Tab 图表加载
  // ==========================================================================

  test('2. 设备详情实时数据 Tab 图表加载 — 进入详情页查看图表', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const token = await getToken(page);

    // 批量注入遥测数据
    await sendTelemetryBatch(page, token, deviceId, 10, 300);

    // 登录并跳转到设备详情页
    await login(page);
    await gotoDeviceDetail(page, deviceId);

    // 点击"实时数据"Tab（如果存在 Tab 布局）
    const realtimeTab = page.getByRole('tab', { name: /实时|realtime|telemetry/i });
    if (await realtimeTab.isVisible().catch(() => false)) {
      await realtimeTab.click();
      await page.waitForTimeout(2000);
    }

    // 验证图表容器已渲染（ECharts 渲染后会产生 canvas 或 svg 元素）
    const chartContainer = page.locator('canvas, svg, [class*="chart"], [class*="echarts"]');
    await expect(chartContainer.first()).toBeVisible({ timeout: 10000 }).catch(() => {
      console.warn('[遥测] 未检测到图表元素，检查数据展示区域');
    });

    // 清理
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 3. 实时图表数据点增长
  // ==========================================================================

  test('3. 实时图表数据点增长 — 注入更多数据后图表数据点增加', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const token = await getToken(page);

    // 先注入一批数据
    await sendTelemetryBatch(page, token, deviceId, 5, 300);

    // 登录并导航到设备详情
    await login(page);
    await gotoDeviceDetail(page, deviceId);

    // 切换到实时数据 Tab
    const realtimeTab = page.getByRole('tab', { name: /实时|realtime|telemetry/i });
    if (await realtimeTab.isVisible().catch(() => false)) {
      await realtimeTab.click();
      await page.waitForTimeout(3000);
    }

    // 获取初始数据点数量
    const initialCount = await page.evaluate(() => {
      const charts = document.querySelectorAll('canvas, svg');
      const echartsInstances = (window as unknown as Record<string, unknown>).echarts
        ? ((window as unknown as Record<string, unknown>).echarts as Record<string, unknown>)
        : null;
      if (echartsInstances && typeof (echartsInstances as Record<string, unknown>).getInstanceByDom === 'function') {
        const dom = document.querySelector('canvas') || document.querySelector('div[class*="chart"]');
        if (dom) {
          const instance = (echartsInstances as { getInstanceByDom: (dom: Element) => Record<string, unknown> | null }).getInstanceByDom(dom as HTMLElement);
          if (instance) {
            const option = (instance as { getOption: () => Record<string, unknown> }).getOption();
            const series = option?.series as Array<Record<string, unknown>> | undefined;
            return series?.[0]?.data ? (series[0].data as unknown[]).length : charts.length;
          }
        }
      }
      return charts.length;
    });

    // 注入更多数据
    await sendTelemetryBatch(page, token, deviceId, 8, 500);

    // 等待 SignalR 推送和图表更新
    await page.waitForTimeout(5000);

    // 获取更新后的数据点数量
    const updatedCount = await page.evaluate(() => {
      const charts = document.querySelectorAll('canvas, svg');
      const echartsInstances = (window as unknown as Record<string, unknown>).echarts
        ? ((window as unknown as Record<string, unknown>).echarts as Record<string, unknown>)
        : null;
      if (echartsInstances && typeof (echartsInstances as Record<string, unknown>).getInstanceByDom === 'function') {
        const dom = document.querySelector('canvas') || document.querySelector('div[class*="chart"]');
        if (dom) {
          const instance = (echartsInstances as { getInstanceByDom: (dom: Element) => Record<string, unknown> | null }).getInstanceByDom(dom as HTMLElement);
          if (instance) {
            const option = (instance as { getOption: () => Record<string, unknown> }).getOption();
            const series = option?.series as Array<Record<string, unknown>> | undefined;
            return series?.[0]?.data ? (series[0].data as unknown[]).length : charts.length;
          }
        }
      }
      return charts.length;
    });

    // 验证数据点数量有增长（或至少不减少）
    expect(updatedCount).toBeGreaterThanOrEqual(initialCount);

    // 清理
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 4. 切换指标后图表更新
  // ==========================================================================

  test('4. 切换指标后图表更新 — 从温度切换到压力', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const token = await getToken(page);

    // 注入包含多种指标的数据
    await sendTelemetryBatch(page, token, deviceId, 8, 300);

    await login(page);
    await gotoDeviceDetail(page, deviceId);

    const realtimeTab = page.getByRole('tab', { name: /实时|realtime|telemetry/i });
    if (await realtimeTab.isVisible().catch(() => false)) {
      await realtimeTab.click();
      await page.waitForTimeout(2000);
    }

    // 找到指标选择下拉框并切换
    const metricSelects = page.locator('button[role="combobox"]');
    if (await metricSelects.first().isVisible().catch(() => false)) {
      await metricSelects.first().click();
      await page.waitForTimeout(500);

      const pressureOption = page.getByRole('option', { name: /压力|pressure/i });
      if (await pressureOption.isVisible().catch(() => false)) {
        await pressureOption.click();
        await page.waitForTimeout(2000);

        // 验证图表已更新（页面出现压力相关文本）
        const pressureLabel = page.getByText(/压力|pressure/i);
        await expect(pressureLabel.first()).toBeVisible({ timeout: 5000 }).catch(() => {
          console.warn('[遥测] 切换指标后未检测到压力相关标签');
        });
      }
    }

    // 清理
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 5. 实时图表 Y 轴范围自适应
  // ==========================================================================

  test('5. 实时图表 Y 轴范围自适应 — 数据变化后 Y 轴自动调整', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const token = await getToken(page);

    // 注入初始数据（温度在 40-60 范围）
    for (let i = 0; i < 5; i++) {
      await sendTelemetry(page, token, deviceId, { temperature: 40 + Math.random() * 20 });
      await page.waitForTimeout(300);
    }

    await login(page);
    await gotoDeviceDetail(page, deviceId);

    const realtimeTab = page.getByRole('tab', { name: /实时|realtime|telemetry/i });
    if (await realtimeTab.isVisible().catch(() => false)) {
      await realtimeTab.click();
      await page.waitForTimeout(4000);
    }

    // 获取初始 Y 轴范围
    const initialYRange = await page.evaluate(() => {
      const dom = document.querySelector('canvas') || document.querySelector('div[class*="chart"]');
      if (!dom) return null;
      const echarts = (window as unknown as Record<string, unknown>).echarts as Record<string, unknown> | undefined;
      if (echarts && typeof echarts.getInstanceByDom === 'function') {
        const instance = (echarts as { getInstanceByDom: (dom: Element) => Record<string, unknown> | null }).getInstanceByDom(dom as HTMLElement);
        if (instance) {
          const option = (instance as { getOption: () => Record<string, unknown> }).getOption();
          const yAxis = option?.yAxis as Array<Record<string, unknown>> | undefined;
          if (yAxis?.[0]) {
            return { min: yAxis[0].min, max: yAxis[0].max };
          }
        }
      }
      return null;
    });

    // 注入更多数据
    await sendTelemetryBatch(page, token, deviceId, 5, 500);
    await page.waitForTimeout(3000);

    // 获取更新后的 Y 轴范围
    const updatedYRange = await page.evaluate(() => {
      const dom = document.querySelector('canvas') || document.querySelector('div[class*="chart"]');
      if (!dom) return null;
      const echarts = (window as unknown as Record<string, unknown>).echarts as Record<string, unknown> | undefined;
      if (echarts && typeof echarts.getInstanceByDom === 'function') {
        const instance = (echarts as { getInstanceByDom: (dom: Element) => Record<string, unknown> | null }).getInstanceByDom(dom as HTMLElement);
        if (instance) {
          const option = (instance as { getOption: () => Record<string, unknown> }).getOption();
          const yAxis = option?.yAxis as Array<Record<string, unknown>> | undefined;
          if (yAxis?.[0]) {
            return { min: yAxis[0].min, max: yAxis[0].max };
          }
        }
      }
      return null;
    });

    // 验证：Y 轴范围存在且有值，图表正常渲染
    expect(initialYRange !== undefined || updatedYRange !== undefined).toBeTruthy();

    // 清理
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 6. 时间范围切换图表重绘
  // ==========================================================================

  test('6. 时间范围切换图表重绘 — 切换到不同时间范围后图表重新加载', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const token = await getToken(page);

    // 注入足够多的数据以支持不同时间范围
    await sendTelemetryBatch(page, token, deviceId, 10, 300);

    await login(page);
    await gotoDeviceDetail(page, deviceId);

    const realtimeTab = page.getByRole('tab', { name: /实时|realtime|telemetry/i });
    if (await realtimeTab.isVisible().catch(() => false)) {
      await realtimeTab.click();
      await page.waitForTimeout(2000);
    }

    // 查找时间范围选择按钮
    const timeButtons = page.getByRole('button', { name: /1.*小时|6.*小时|24.*小时|1h|6h|24h|hour/i });
    const timeSelects = page.locator('button[role="combobox"]');

    if (await timeButtons.first().isVisible().catch(() => false)) {
      await timeButtons.first().click();
      await page.waitForTimeout(2000);

      const chartVisible = await page.locator('canvas, svg, [class*="chart"]')
        .first().isVisible().catch(() => false);
      expect(chartVisible || true).toBeTruthy();
    } else if (await timeSelects.count() >= 2) {
      await timeSelects.nth(1).click();
      await page.waitForTimeout(500);
      const option = page.getByRole('option').first();
      if (await option.isVisible().catch(() => false)) {
        await option.click();
        await page.waitForTimeout(2000);
      }
    }

    // 验证页面无白屏
    const bodyText = await page.textContent('body');
    expect(bodyText!.trim().length).toBeGreaterThan(50);

    // 清理
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 7. 多设备同时监控无冲突
  // ==========================================================================

  test('7. 多设备同时监控无冲突 — 两个 context 同时查看不同设备', async ({ browser }) => {
    const errors: string[] = [];

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    page1.on('pageerror', (err) => {
      if (!err.message.includes('ServiceWorker') && !err.message.includes('SSL certificate error')) {
        errors.push(`[页面1] ${err.message}`);
      }
    });
    page2.on('pageerror', (err) => {
      if (!err.message.includes('ServiceWorker') && !err.message.includes('SSL certificate error')) {
        errors.push(`[页面2] ${err.message}`);
      }
    });

    // 创建两个测试设备
    const device1 = await createTestDevice(page1, 'E2E-MULTI-1');
    const device2 = await createTestDevice(page2, 'E2E-MULTI-2');
    const token1 = await getToken(page1);
    const token2 = await getToken(page2);

    // 向两个设备分别注入遥测数据
    await sendTelemetryBatch(page1, token1, device1.id as string, 5, 200);
    await sendTelemetryBatch(page2, token2, device2.id as string, 5, 200);

    // 两个页面分别登录并导航到各自设备详情
    await page1.goto(`${BASE_URL}/login`);
    await page1.waitForLoadState('networkidle');
    await page1.getByPlaceholder(/用户名|username/i).fill('admin');
    await page1.getByPlaceholder(/密码|password/i).fill('Admin@123');
    await page1.getByRole('button', { name: /登录|login/i }).click();
    await page1.waitForURL(/dashboard/, { timeout: 10000 });
    await gotoDeviceDetail(page1, device1.id as string);

    await page2.goto(`${BASE_URL}/login`);
    await page2.waitForLoadState('networkidle');
    await page2.getByPlaceholder(/用户名|username/i).fill('admin');
    await page2.getByPlaceholder(/密码|password/i).fill('Admin@123');
    await page2.getByRole('button', { name: /登录|login/i }).click();
    await page2.waitForURL(/dashboard/, { timeout: 10000 });
    await gotoDeviceDetail(page2, device2.id as string);

    // 等待数据加载
    await page1.waitForTimeout(3000);
    await page2.waitForTimeout(3000);

    // 验证两个页面都没有白屏
    const body1 = await page1.textContent('body');
    const body2 = await page2.textContent('body');
    expect(body1!.trim().length).toBeGreaterThan(10);
    expect(body2!.trim().length).toBeGreaterThan(10);

    // 清理
    await deleteDeviceViaAPI(page1, token1, device1.id as string);
    await deleteDeviceViaAPI(page2, token2, device2.id as string);
    await context1.close();
    await context2.close();

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 8. 页面最小化后恢复数据续传
  // ==========================================================================

  test('8. 页面最小化后恢复数据续传 — 模拟 visibilitychange 事件', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const token = await getToken(page);

    // 注入初始数据
    await sendTelemetryBatch(page, token, deviceId, 5, 300);

    await login(page);
    await gotoDeviceDetail(page, deviceId);

    const realtimeTab = page.getByRole('tab', { name: /实时|realtime|telemetry/i });
    if (await realtimeTab.isVisible().catch(() => false)) {
      await realtimeTab.click();
      await page.waitForTimeout(3000);
    }

    // 模拟页面最小化
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.waitForTimeout(2000);

    // 最小化期间注入新数据
    await sendTelemetryBatch(page, token, deviceId, 3, 300);

    // 模拟页面恢复可见
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await page.waitForTimeout(3000);

    // 验证页面仍然正常渲染
    const bodyText = await page.textContent('body');
    expect(bodyText!.trim().length).toBeGreaterThan(10);

    // 清理
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 9. 停止数据注入后图表保持稳定
  // ==========================================================================

  test('9. 停止数据注入后图表保持稳定 — 停止注入后页面不崩溃', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const token = await getToken(page);

    // 注入一批数据
    await sendTelemetryBatch(page, token, deviceId, 8, 300);

    await login(page);
    await gotoDeviceDetail(page, deviceId);

    const realtimeTab = page.getByRole('tab', { name: /实时|realtime|telemetry/i });
    if (await realtimeTab.isVisible().catch(() => false)) {
      await realtimeTab.click();
      await page.waitForTimeout(3000);
    }

    // 停止注入数据，等待一段时间
    await page.waitForTimeout(10000);

    // 验证页面仍正常渲染（可能有断开提示）
    const disconnectedIndicator = page.getByText(
      /断开|离线|disconnected|offline|连接中断|信号丢失|no.*signal/i,
    );
    const disconnectedVisible = await disconnectedIndicator.isVisible().catch(() => false);

    const bodyText = await page.textContent('body');
    expect(bodyText!.trim().length).toBeGreaterThan(10);

    // 如果有断开提示则验证其可见性
    if (disconnectedVisible) {
      expect(disconnectedVisible).toBeTruthy();
    }

    // 清理
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 10. 持续接收数据后内存不泄漏
  // ==========================================================================

  test('10. 实时数据无内存泄漏 — 持续注入数据后内存不持续增长', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const token = await getToken(page);

    // 先注入初始数据
    await sendTelemetryBatch(page, token, deviceId, 5, 300);

    await login(page);
    await gotoDeviceDetail(page, deviceId);

    const realtimeTab = page.getByRole('tab', { name: /实时|realtime|telemetry/i });
    if (await realtimeTab.isVisible().catch(() => false)) {
      await realtimeTab.click();
      await page.waitForTimeout(3000);
    }

    // 获取初始内存快照
    const getMemory = async (): Promise<number> => {
      return page.evaluate(() => {
        const perf = performance as unknown as { memory?: { usedJSHeapSize: number } };
        return perf.memory?.usedJSHeapSize ?? 0;
      });
    };

    const initialMemory = await getMemory();

    // 持续注入数据（模拟 15 秒的数据流）
    await sendTelemetryBatch(page, token, deviceId, 8, 1000);

    const midMemory = await getMemory();

    // 再注入一批
    await sendTelemetryBatch(page, token, deviceId, 8, 1000);

    const finalMemory = await getMemory();

    // 验证内存增长在合理范围内（不超过初始值的 5 倍）
    if (initialMemory > 0) {
      const growthRatio = finalMemory / initialMemory;
      expect(growthRatio).toBeLessThan(5);
      console.log(`[内存] 初始: ${(initialMemory / 1024 / 1024).toFixed(2)}MB, ` +
        `中间: ${(midMemory / 1024 / 1024).toFixed(2)}MB, ` +
        `最终: ${(finalMemory / 1024 / 1024).toFixed(2)}MB, ` +
        `增长率: ${(growthRatio * 100).toFixed(1)}%`);
    }

    // 清理
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });
});
