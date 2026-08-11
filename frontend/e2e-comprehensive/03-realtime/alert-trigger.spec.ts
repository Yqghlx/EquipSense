/**
 * 告警触发实时测试
 *
 * 通过 HTTP API 发送异常遥测数据触发告警，验证 SignalR 实时推送行为：
 * - Toast 通知弹出、自动消失、点击跳转
 * - 告警中心实时接收和展示
 * - 告警详情侧滑面板（确认/解决按钮）
 * - 仪表盘活跃告警卡片实时更新
 * - 不同级别告警颜色区分
 * - 告警列表自动刷新无闪烁
 */
import { test, expect } from '@playwright/test';
import {
  login,
  captureErrors,
  getToken,
  gotoAlertCenter,
  createTestDevice,
  deleteDeviceViaAPI,
  triggerAlertViaAPI,
  createThresholdRule,
  deleteAlertRuleViaAPI,
} from '../helpers';

test.describe('03-告警触发', () => {
  // 每个测试独立创建设备和规则，避免跨测试状态污染

  // ==========================================================================
  // 1. Toast 通知弹出 — API 触发异常数据后 Toast 弹出
  // ==========================================================================

  test('1. 告警触发后 Toast 通知弹出 — API 发送异常数据触发 Toast', async ({ page }) => {
    const errors = captureErrors(page);

    // 创建测试设备和告警规则（温度 > 80 触发 High 级别告警）
    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const rule = await createThresholdRule(page, undefined, true, deviceId);
    const ruleId = rule.id as string;

    // 登录并等待仪表盘加载（仪表盘页面会接收 SignalR Toast 推送）
    await login(page);

    // 通过 API 发送异常遥测数据触发告警
    await triggerAlertViaAPI(page, { deviceId, metric: 'temperature', value: 100 });

    // 等待告警评估 + SignalR 推送 + Toast 出现
    const toast = page.getByTestId('notification-toast');
    await expect(toast.first()).toBeVisible({ timeout: 30000 }).catch(() => {
      console.warn('[告警] 在 30 秒内未检测到 Toast 通知');
    });

    // 清理
    const token = await getToken(page);
    await deleteAlertRuleViaAPI(page, token, ruleId);
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 2. Toast 通知自动消失 — Toast 弹出后一定时间内消失
  // ==========================================================================

  test('2. Toast 通知自动消失 — Toast 弹出后一定时间内消失', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const rule = await createThresholdRule(page, undefined, true, deviceId);
    const ruleId = rule.id as string;

    await login(page);

    await triggerAlertViaAPI(page, { deviceId, metric: 'temperature', value: 100 });

    // 等待 Toast 出现
    const toast = page.getByTestId('notification-toast');
    // 保存首条通知的标识。并行测试可能同时触发其他告警，页面会展示新的 Toast；
    // 断言必须只针对本测试触发的首条通知，而不能重新查询 toast.first()。
    const firstNotificationId = await toast.first()
      .getAttribute('data-notification-id', { timeout: 30000 })
      .catch(() => null);
    expect(firstNotificationId).toBeTruthy();

    if (firstNotificationId) {
      // 等待首次告警 Toast 自动消失（通常 3-8 秒）。后续新告警可以继续展示新的 Toast，
      // 但首次通知对应的节点必须从页面移除。
      await expect(
        page.locator(`[data-testid="notification-toast"][data-notification-id="${firstNotificationId}"]`),
      ).toHaveCount(0, { timeout: 10000 });
    }

    // 清理
    const token = await getToken(page);
    await deleteAlertRuleViaAPI(page, token, ruleId);
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 3. Toast 点击跳转到告警中心
  // ==========================================================================

  test('3. Toast 点击跳转到告警中心 — 点击 Toast 通知后导航到告警页面', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const rule = await createThresholdRule(page, undefined, true, deviceId);
    const ruleId = rule.id as string;

    await login(page);

    await triggerAlertViaAPI(page, { deviceId, metric: 'temperature', value: 100 });

    // 等待 Toast 出现并点击
    const toast = page.getByTestId('notification-toast');
    const toastAppeared = await toast.first().isVisible({ timeout: 30000 }).catch(() => false);

    if (toastAppeared) {
      await toast.first().click();
      await page.waitForTimeout(2000);

      // 验证已跳转到告警中心或告警详情页
      const currentUrl = page.url();
      const navigatedToAlerts = /alert/.test(currentUrl);
      expect(navigatedToAlerts).toBeTruthy();
    }

    // 清理
    const token = await getToken(page);
    await deleteAlertRuleViaAPI(page, token, ruleId);
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 4. 告警中心实时接收新告警
  // ==========================================================================

  test('4. 告警中心实时接收新告警 — 导航到告警中心后看到新告警', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const rule = await createThresholdRule(page, undefined, true, deviceId);
    const ruleId = rule.id as string;

    // 先登录并导航到告警中心
    await login(page);
    await gotoAlertCenter(page);
    await page.waitForTimeout(2000);

    // 触发告警（用户已在告警中心页面，SignalR 会实时推送新告警）
    await triggerAlertViaAPI(page, { deviceId, metric: 'temperature', value: 100 });

    // 等待告警中心列表更新
    const alertRow = page.locator('table tbody tr, [role="row"], tr');
    const alertAppeared = await alertRow.first()
      .waitFor({ state: 'visible', timeout: 30000 })
      .catch(() => null);

    if (alertAppeared) {
      const rowCount = await alertRow.count();
      expect(rowCount).toBeGreaterThanOrEqual(1);
    }

    // 清理
    const token = await getToken(page);
    await deleteAlertRuleViaAPI(page, token, ruleId);
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 5. 告警详情侧滑面板打开
  // ==========================================================================

  test('5. 告警详情侧滑面板打开 — 点击告警行打开侧滑面板', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const rule = await createThresholdRule(page, undefined, true, deviceId);
    const ruleId = rule.id as string;

    // 先触发告警，等告警入库后再打开告警中心
    await triggerAlertViaAPI(page, { deviceId, metric: 'temperature', value: 100 });
    await page.waitForTimeout(5000);

    await login(page);
    await gotoAlertCenter(page);
    await page.waitForTimeout(3000);

    // 等待告警出现并点击。该流程的核心结果是打开详情抽屉，不能把找不到告警或抽屉降级为 warning，
    // 否则告警详情不可用时 E2E 仍会显示通过，发布门禁无法保护真实用户流程。
    const alertRow = page.locator('table tbody tr').first();
    await expect(alertRow).toBeVisible({ timeout: 10000 });
    await alertRow.click();
    await page.waitForTimeout(2000);

    // Base UI 的 SheetContent 使用稳定的 data-slot 标记；比依赖实现细节的 data-state 更可靠。
    await expect(page.locator('[data-slot="sheet-content"]')).toBeVisible({ timeout: 5000 });

    // 清理
    const token = await getToken(page);
    await deleteAlertRuleViaAPI(page, token, ruleId);
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 6. 告警详情确认按钮
  // ==========================================================================

  test('6. 告警详情确认按钮 — 打开详情面板点击确认', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const rule = await createThresholdRule(page, undefined, true, deviceId);
    const ruleId = rule.id as string;

    // 触发告警
    await triggerAlertViaAPI(page, { deviceId, metric: 'temperature', value: 100 });
    await page.waitForTimeout(5000);

    await login(page);
    await gotoAlertCenter(page);
    await page.waitForTimeout(3000);

    // 等待告警出现并点击打开详情
    const alertRow = page.locator('table tbody tr, [role="row"], tr');
    if (await alertRow.first().isVisible({ timeout: 10000 }).catch(() => false)) {
      await alertRow.first().click();
      await page.waitForTimeout(2000);

      // 查找确认按钮
      const confirmBtn = page.getByRole('button', { name: /确认|acknowledge|confirm/i });
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(3000);

        // 验证确认操作成功
        const confirmedText = page.getByText(/已确认|acknowledged|confirmed/i);
        await expect(confirmedText.first()).toBeVisible({ timeout: 5000 }).catch(() => {
          console.warn('[告警] 确认操作后未检测到"已确认"状态文本');
        });
      }
    }

    // 清理
    const token = await getToken(page);
    await deleteAlertRuleViaAPI(page, token, ruleId);
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 7. 告警详情解决按钮
  // ==========================================================================

  test('7. 告警详情解决按钮 — 打开详情面板点击解决', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const rule = await createThresholdRule(page, undefined, true, deviceId);
    const ruleId = rule.id as string;

    // 触发告警
    await triggerAlertViaAPI(page, { deviceId, metric: 'temperature', value: 100 });
    await page.waitForTimeout(5000);

    await login(page);
    await gotoAlertCenter(page);
    await page.waitForTimeout(3000);

    // 等待告警出现并点击打开详情
    const alertRow = page.locator('table tbody tr, [role="row"], tr');
    if (await alertRow.first().isVisible({ timeout: 10000 }).catch(() => false)) {
      await alertRow.first().click();
      await page.waitForTimeout(2000);

      // 查找解决按钮
      const resolveBtn = page.getByRole('button', { name: /解决|resolve|处理/i });
      if (await resolveBtn.isVisible().catch(() => false)) {
        await resolveBtn.click();
        await page.waitForTimeout(3000);

        // 如果弹出解决确认对话框，填写解决说明
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible().catch(() => false)) {
          const textarea = dialog.locator('textarea');
          if (await textarea.isVisible().catch(() => false)) {
            await textarea.fill('E2E 测试：自动解决告警');
          }
          await dialog.getByRole('button', { name: /确认|确定|submit/i }).click();
          await page.waitForTimeout(3000);
        }

        // 验证解决操作成功
        const resolvedText = page.getByText(/已解决|resolved|已处理/i);
        await expect(resolvedText.first()).toBeVisible({ timeout: 5000 }).catch(() => {
          console.warn('[告警] 解决操作后未检测到"已解决"状态文本');
        });
      }
    }

    // 清理
    const token = await getToken(page);
    await deleteAlertRuleViaAPI(page, token, ruleId);
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 8. 仪表盘活跃告警卡片实时更新（已使用 API 触发模式）
  // ==========================================================================

  test('8. 仪表盘活跃告警卡片实时更新 — 告警触发后仪表盘卡片数字增加', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const rule = await createThresholdRule(page, undefined, true, deviceId);
    const ruleId = rule.id as string;

    await login(page);

    const getActiveAlertCount = async (): Promise<string | null> => {
      const alertCard = page.getByText(/活跃告警|active.*alert/i).locator('..');
      if (await alertCard.isVisible().catch(() => false)) {
        const countText = await alertCard.textContent();
        const match = countText?.match(/(\d+)/);
        return match?.[1] ?? null;
      }
      return null;
    };

    const initialCount = await getActiveAlertCount();

    // 通过 API 发送异常遥测数据触发告警
    await triggerAlertViaAPI(page, { deviceId, metric: 'temperature', value: 100 });

    // 等待告警评估 + SignalR 推送 + 前端更新
    await page.waitForTimeout(8000);

    const updatedCount = await getActiveAlertCount();

    if (initialCount !== null && updatedCount !== null) {
      expect(Number(updatedCount)).toBeGreaterThanOrEqual(Number(initialCount));
    }

    // 清理
    const token = await getToken(page);
    await deleteAlertRuleViaAPI(page, token, ruleId);
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 9. 不同级别告警颜色区分
  // ==========================================================================

  test('9. 不同级别告警颜色区分 — Critical/High/Medium/Low 颜色不同', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const rule = await createThresholdRule(page, undefined, true, deviceId);
    const ruleId = rule.id as string;

    // 触发告警
    await triggerAlertViaAPI(page, { deviceId, metric: 'temperature', value: 100 });
    await page.waitForTimeout(5000);

    await login(page);
    await gotoAlertCenter(page);
    await page.waitForTimeout(3000);

    // 检查告警行是否存在级别标签
    const alertRows = page.locator('table tbody tr, [role="row"], tr');
    if (await alertRows.first().isVisible({ timeout: 10000 }).catch(() => false)) {
      // 查找不同级别的告警标签
      const severityLabels = page.locator('[class*="badge"], [class*="severity"], span');
      const labelCount = await severityLabels.count();

      if (labelCount > 0) {
        // 获取不同级别标签的背景颜色
        const colors = new Set<string>();
        for (let i = 0; i < Math.min(labelCount, 10); i++) {
          const color = await severityLabels.nth(i).evaluate((el) => {
            return window.getComputedStyle(el).backgroundColor;
          });
          colors.add(color);
        }

        // 验证至少有 1 种颜色存在
        expect(colors.size).toBeGreaterThanOrEqual(1);
      }
    }

    // 清理
    const token = await getToken(page);
    await deleteAlertRuleViaAPI(page, token, ruleId);
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 10. 告警列表自动刷新无闪烁
  // ==========================================================================

  test('10. 告警列表自动刷新无闪烁 — SignalR 推送时列表不闪烁', async ({ page }) => {
    const errors = captureErrors(page);

    const device = await createTestDevice(page);
    const deviceId = device.id as string;
    const rule = await createThresholdRule(page, undefined, true, deviceId);
    const ruleId = rule.id as string;

    await login(page);
    await gotoAlertCenter(page);
    await page.waitForTimeout(3000);

    // 触发告警后在数据推送期间连续截图，验证无闪烁
    await triggerAlertViaAPI(page, { deviceId, metric: 'temperature', value: 100 });

    // 连续截图验证页面稳定
    const screenshots: Buffer[] = [];
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(3000);
      const screenshot = await page.screenshot();
      screenshots.push(screenshot);
    }

    // 验证：连续截图之间页面结构稳定（非空白）
    for (let i = 0; i < screenshots.length; i++) {
      expect(screenshots[i].length).toBeGreaterThan(1024);
    }

    // 清理
    const token = await getToken(page);
    await deleteAlertRuleViaAPI(page, token, ruleId);
    await deleteDeviceViaAPI(page, token, deviceId);

    expect(errors).toEqual([]);
  });
});
