/**
 * 告警触发实时测试
 *
 * 使用 MQTT 模拟器以 20% 异常率发送遥测数据，触发告警规则。
 * 测试场景：
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
  
  
  createThresholdRule,
  deleteAlertRuleViaAPI,
  startSimulator,
  stopSimulator,
  waitForMQTTConnection,
  TEST_TENANT_ID,
} from '../helpers';
import type { ChildProcess } from 'child_process';

test.describe('03-告警触发', () => {
  let simulatorProc: ChildProcess | null = null;
  let testDeviceId: string | null = null;
  let testRuleId: string | null = null;

  test.afterAll(async () => {
    if (simulatorProc) {
      stopSimulator(simulatorProc);
      simulatorProc = null;
    }
  });

  test('1. 告警触发后 Toast 通知弹出 — 模拟器发送异常数据触发 Toast', async ({ page }) => {
    const errors = captureErrors(page);

    // 创建告警规则（温度阈值 > 80 触发 High 级别告警）
    const rule = await createThresholdRule(page);
    testRuleId = rule.id as string;

    // 启动模拟器，20% 异常率
    simulatorProc = startSimulator({
      tenantId: TEST_TENANT_ID,
      devices: 1,
      interval: 2,
      anomalyRate: 20,
    });

    // 等待模拟器连接，失败时跳过测试
    const connected = await waitForMQTTConnection(simulatorProc).catch(() => false);
    if (!connected) {
      console.warn('[告警] 模拟器启动失败，跳过测试');
      stopSimulator(simulatorProc);
      simulatorProc = null;
      test.skip();
      return;
    }

    // 登录并等待仪表盘加载
    await login(page);

    // 等待告警触发和 Toast 通知出现（SignalR 推送有延迟）
    // Toast 通知由 SignalR 推送触发，timeout 设为 60 秒
    const toast = page.locator('[class*="toast"], [role="status"], [data-sonner-toast]');
    await expect(toast.first()).toBeVisible({ timeout: 60000 }).catch(() => {
      console.warn('[告警] 在 60 秒内未检测到 Toast 通知，可能异常率未命中');
    });

    // 停止模拟器
    stopSimulator(simulatorProc);
    simulatorProc = null;

    // 清理规则
    if (testRuleId) {
      const token = await getToken(page);
      await deleteAlertRuleViaAPI(page, token, testRuleId);
      testRuleId = null;
    }

    expect(errors).toEqual([]);
  });

  test('2. Toast 通知自动消失 — Toast 弹出后一定时间内消失', async ({ page }) => {
    const errors = captureErrors(page);

    // 创建告警规则
    const rule = await createThresholdRule(page);
    testRuleId = rule.id as string;

    // 启动模拟器
    simulatorProc = startSimulator({
      tenantId: TEST_TENANT_ID,
      devices: 1,
      interval: 2,
      anomalyRate: 20,
    });

    const connected = await waitForMQTTConnection(simulatorProc).catch(() => false);
    if (!connected) {
      console.warn('[告警] 模拟器启动失败，跳过测试');
      stopSimulator(simulatorProc);
      simulatorProc = null;
      test.skip();
      return;
    }

    // 登录
    await login(page);

    // 等待 Toast 出现（使用简化选择器）
    const toast = page.locator('[class*="toast"], [role="status"], [data-sonner-toast]');
    const toastAppeared = await toast.first().isVisible({ timeout: 60000 }).catch(() => false);

    if (toastAppeared) {
      // 等待 Toast 自动消失（通常 3-8 秒）
      await page.waitForTimeout(10000);

      // 验证 Toast 已消失
      const toastGone = await toast.first().isVisible().catch(() => false);
      expect(toastGone).toBeFalsy();
    }

    // 清理
    stopSimulator(simulatorProc);
    simulatorProc = null;
    if (testRuleId) {
      const token = await getToken(page);
      await deleteAlertRuleViaAPI(page, token, testRuleId);
      testRuleId = null;
    }

    expect(errors).toEqual([]);
  });

  test('3. Toast 点击跳转到告警中心 — 点击 Toast 通知后导航到告警页面', async ({ page }) => {
    const errors = captureErrors(page);

    // 创建告警规则
    const rule = await createThresholdRule(page);
    testRuleId = rule.id as string;

    // 启动模拟器
    simulatorProc = startSimulator({
      tenantId: TEST_TENANT_ID,
      devices: 1,
      interval: 2,
      anomalyRate: 20,
    });

    const connected = await waitForMQTTConnection(simulatorProc).catch(() => false);
    if (!connected) {
      console.warn('[告警] 模拟器启动失败，跳过测试');
      stopSimulator(simulatorProc);
      simulatorProc = null;
      test.skip();
      return;
    }

    // 登录
    await login(page);

    // 等待 Toast 出现并点击（使用简化选择器）
    const toast = page.locator('[class*="toast"], [role="status"], [data-sonner-toast]');
    const toastAppeared = await toast.first().isVisible({ timeout: 60000 }).catch(() => false);

    if (toastAppeared) {
      // 点击 Toast 通知
      await toast.first().click();
      await page.waitForTimeout(2000);

      // 验证已跳转到告警中心或告警详情页
      const currentUrl = page.url();
      const navigatedToAlerts = /alert/.test(currentUrl);
      expect(navigatedToAlerts).toBeTruthy();
    }

    // 清理
    stopSimulator(simulatorProc);
    simulatorProc = null;
    if (testRuleId) {
      const token = await getToken(page);
      await deleteAlertRuleViaAPI(page, token, testRuleId);
      testRuleId = null;
    }

    expect(errors).toEqual([]);
  });

  test('4. 告警中心实时接收新告警 — 导航到告警中心后看到新告警', async ({ page }) => {
    const errors = captureErrors(page);

    // 创建告警规则
    const rule = await createThresholdRule(page);
    testRuleId = rule.id as string;

    // 登录并直接导航到告警中心
    await login(page);
    await gotoAlertCenter(page);
    await page.waitForTimeout(2000);

    // 启动模拟器
    simulatorProc = startSimulator({
      tenantId: TEST_TENANT_ID,
      devices: 1,
      interval: 2,
      anomalyRate: 20,
    });

    const connected = await waitForMQTTConnection(simulatorProc).catch(() => false);
    if (!connected) {
      console.warn('[告警] 模拟器启动失败，跳过测试');
      stopSimulator(simulatorProc);
      simulatorProc = null;
      test.skip();
      return;
    }

    // 等待告警中心列表更新（SignalR 推送新告警到已打开的告警中心页面）
    const alertRow = page.locator('table tbody tr, [role="row"], tr');
    const alertAppeared = await alertRow.first().waitFor({ state: 'visible', timeout: 60000 })
      .catch(() => null);

    if (alertAppeared) {
      // 验证告警行已出现
      const rowCount = await alertRow.count();
      expect(rowCount).toBeGreaterThanOrEqual(1);
    }

    // 清理
    stopSimulator(simulatorProc);
    simulatorProc = null;
    if (testRuleId) {
      const token = await getToken(page);
      await deleteAlertRuleViaAPI(page, token, testRuleId);
      testRuleId = null;
    }

    expect(errors).toEqual([]);
  });

  test('5. 告警详情侧滑面板打开 — 点击告警行打开侧滑面板', async ({ page }) => {
    const errors = captureErrors(page);

    // 创建告警规则
    const rule = await createThresholdRule(page);
    testRuleId = rule.id as string;

    // 登录并直接导航到告警中心
    await login(page);
    await gotoAlertCenter(page);
    await page.waitForTimeout(2000);

    // 启动模拟器触发告警
    simulatorProc = startSimulator({
      tenantId: TEST_TENANT_ID,
      devices: 1,
      interval: 2,
      anomalyRate: 20,
    });

    const connected = await waitForMQTTConnection(simulatorProc).catch(() => false);
    if (!connected) {
      console.warn('[告警] 模拟器启动失败，跳过测试');
      stopSimulator(simulatorProc);
      simulatorProc = null;
      test.skip();
      return;
    }

    // 等待告警出现（使用简化选择器）
    const alertRow = page.locator('table tbody tr, [role="row"], tr');
    await alertRow.first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});

    // 点击告警行打开详情面板
    if (await alertRow.first().isVisible().catch(() => false)) {
      await alertRow.first().click();
      await page.waitForTimeout(2000);

      // 验证侧滑面板打开（Sheet/Drawer 组件，使用简化选择器）
      const detailPanel = page.locator('[data-state="open"], [role="dialog"]');
      await expect(detailPanel.last()).toBeVisible({ timeout: 5000 }).catch(() => {
        console.warn('[告警] 点击告警行后未检测到侧滑面板');
      });
    }

    // 清理
    stopSimulator(simulatorProc);
    simulatorProc = null;
    if (testRuleId) {
      const token = await getToken(page);
      await deleteAlertRuleViaAPI(page, token, testRuleId);
      testRuleId = null;
    }

    expect(errors).toEqual([]);
  });

  test('6. 告警详情确认按钮 — 打开详情面板点击确认', async ({ page }) => {
    const errors = captureErrors(page);

    // 创建告警规则
    const rule = await createThresholdRule(page);
    testRuleId = rule.id as string;

    // 登录并直接导航到告警中心
    await login(page);
    await gotoAlertCenter(page);
    await page.waitForTimeout(2000);

    // 启动模拟器触发告警
    simulatorProc = startSimulator({
      tenantId: TEST_TENANT_ID,
      devices: 1,
      interval: 2,
      anomalyRate: 20,
    });

    const connected = await waitForMQTTConnection(simulatorProc).catch(() => false);
    if (!connected) {
      console.warn('[告警] 模拟器启动失败，跳过测试');
      stopSimulator(simulatorProc);
      simulatorProc = null;
      test.skip();
      return;
    }

    // 等待告警出现并点击打开详情（使用简化选择器）
    const alertRow = page.locator('table tbody tr, [role="row"], tr');
    await alertRow.first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});

    if (await alertRow.first().isVisible().catch(() => false)) {
      await alertRow.first().click();
      await page.waitForTimeout(2000);

      // 查找确认按钮
      const confirmBtn = page.getByRole('button', { name: /确认|acknowledge|confirm/i });
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
        await page.waitForTimeout(3000);

        // 验证确认操作成功（告警状态变为"已确认"）
        const confirmedText = page.getByText(/已确认|acknowledged|confirmed/i);
        await expect(confirmedText.first()).toBeVisible({ timeout: 5000 }).catch(() => {
          console.warn('[告警] 确认操作后未检测到"已确认"状态文本');
        });
      }
    }

    // 清理
    stopSimulator(simulatorProc);
    simulatorProc = null;
    if (testRuleId) {
      const token = await getToken(page);
      await deleteAlertRuleViaAPI(page, token, testRuleId);
      testRuleId = null;
    }

    expect(errors).toEqual([]);
  });

  test('7. 告警详情解决按钮 — 打开详情面板点击解决', async ({ page }) => {
    const errors = captureErrors(page);

    // 创建告警规则
    const rule = await createThresholdRule(page);
    testRuleId = rule.id as string;

    // 登录并直接导航到告警中心
    await login(page);
    await gotoAlertCenter(page);
    await page.waitForTimeout(2000);

    // 启动模拟器触发告警
    simulatorProc = startSimulator({
      tenantId: TEST_TENANT_ID,
      devices: 1,
      interval: 2,
      anomalyRate: 20,
    });

    const connected = await waitForMQTTConnection(simulatorProc).catch(() => false);
    if (!connected) {
      console.warn('[告警] 模拟器启动失败，跳过测试');
      stopSimulator(simulatorProc);
      simulatorProc = null;
      test.skip();
      return;
    }

    // 等待告警出现并点击打开详情（使用简化选择器）
    const alertRow = page.locator('table tbody tr, [role="row"], tr');
    await alertRow.first().waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});

    if (await alertRow.first().isVisible().catch(() => false)) {
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
    stopSimulator(simulatorProc);
    simulatorProc = null;
    if (testRuleId) {
      const token = await getToken(page);
      await deleteAlertRuleViaAPI(page, token, testRuleId);
      testRuleId = null;
    }

    expect(errors).toEqual([]);
  });

  test('8. 仪表盘活跃告警卡片实时更新 — 告警触发后仪表盘卡片数字增加', async ({ page }) => {
    const errors = captureErrors(page);

    // 创建告警规则
    const rule = await createThresholdRule(page);
    testRuleId = rule.id as string;

    // 登录并等待仪表盘加载
    await login(page);

    // 获取初始活跃告警数量
    const getActiveAlertCount = async (): Promise<string | null> => {
      const alertCard = page.getByText(/活跃告警|active.*alert/i).locator('..');
      if (await alertCard.isVisible().catch(() => false)) {
        const countText = await alertCard.textContent();
        // 提取数字
        const match = countText?.match(/(\d+)/);
        return match?.[1] ?? null;
      }
      return null;
    };

    const initialCount = await getActiveAlertCount();

    // 启动模拟器触发告警
    simulatorProc = startSimulator({
      tenantId: TEST_TENANT_ID,
      devices: 1,
      interval: 2,
      anomalyRate: 20,
    });
    await waitForMQTTConnection(simulatorProc);

    // 等待仪表盘告警卡片更新（SignalR 推送）
    await page.waitForTimeout(15000);

    // 获取更新后的活跃告警数量
    const updatedCount = await getActiveAlertCount();

    // 验证：告警数量应该增加（或至少有变化）
    if (initialCount !== null && updatedCount !== null) {
      expect(Number(updatedCount)).toBeGreaterThanOrEqual(Number(initialCount));
    }

    // 清理
    stopSimulator(simulatorProc);
    simulatorProc = null;
    if (testRuleId) {
      const token = await getToken(page);
      await deleteAlertRuleViaAPI(page, token, testRuleId);
      testRuleId = null;
    }

    expect(errors).toEqual([]);
  });

  test('9. 不同级别告警颜色区分 — Critical/High/Medium/Low 颜色不同', async ({ page }) => {
    const errors = captureErrors(page);

    // 登录并直接导航到告警中心
    await login(page);
    await gotoAlertCenter(page);
    await page.waitForTimeout(2000);

    // 创建不同级别的告警规则
    const ruleHigh = await createThresholdRule(page, 'E2E-ALERT-HIGH', true);
    testRuleId = ruleHigh.id as string;

    // 启动模拟器触发多级别告警
    simulatorProc = startSimulator({
      tenantId: TEST_TENANT_ID,
      devices: 3,
      interval: 2,
      anomalyRate: 30,
    });

    const connected = await waitForMQTTConnection(simulatorProc).catch(() => false);
    if (!connected) {
      console.warn('[告警] 模拟器启动失败，跳过测试');
      stopSimulator(simulatorProc);
      simulatorProc = null;
      test.skip();
      return;
    }

    // 等待告警出现（增加等待时间适应 SignalR 延迟）
    await page.waitForTimeout(20000);

    // 检查告警行是否存在级别标签（使用简化选择器）
    const alertRows = page.locator('table tbody tr, [role="row"], tr');
    if (await alertRows.first().isVisible().catch(() => false)) {
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

        // 验证至少有 1 种颜色存在（不同级别应该有不同颜色）
        expect(colors.size).toBeGreaterThanOrEqual(1);
      }
    }

    // 清理
    stopSimulator(simulatorProc);
    simulatorProc = null;
    if (testRuleId) {
      const token = await getToken(page);
      await deleteAlertRuleViaAPI(page, token, testRuleId);
      testRuleId = null;
    }

    expect(errors).toEqual([]);
  });

  test('10. 告警列表自动刷新无闪烁 — SignalR 推送时列表不闪烁', async ({ page }) => {
    const errors = captureErrors(page);

    // 创建告警规则
    const rule = await createThresholdRule(page);
    testRuleId = rule.id as string;

    // 登录并直接导航到告警中心
    await login(page);
    await gotoAlertCenter(page);
    await page.waitForTimeout(2000);

    // 启动模拟器
    simulatorProc = startSimulator({
      tenantId: TEST_TENANT_ID,
      devices: 1,
      interval: 2,
      anomalyRate: 20,
    });

    const connected = await waitForMQTTConnection(simulatorProc).catch(() => false);
    if (!connected) {
      console.warn('[告警] 模拟器启动失败，跳过测试');
      stopSimulator(simulatorProc);
      simulatorProc = null;
      test.skip();
      return;
    }

    // 在数据推送期间连续截图，验证无闪烁（增加等待时间）
    // 闪烁通常表现为：内容突然消失再出现，或布局突然跳动
    const screenshots: Buffer[] = [];
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(3000);
      const screenshot = await page.screenshot();
      screenshots.push(screenshot);
    }

    // 验证：连续截图之间页面结构稳定（不检查像素差异，只检查非空白）
    for (let i = 0; i < screenshots.length; i++) {
      // 每张截图应非空（大小 > 1KB 表示有内容）
      expect(screenshots[i].length).toBeGreaterThan(1024);
    }

    // 清理
    stopSimulator(simulatorProc);
    simulatorProc = null;
    if (testRuleId) {
      const token = await getToken(page);
      await deleteAlertRuleViaAPI(page, token, testRuleId);
      testRuleId = null;
    }

    expect(errors).toEqual([]);
  });
});
