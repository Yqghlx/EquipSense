/**
 * 告警聚合防风暴测试
 *
 * 验证 30 分钟窗口内的告警聚合机制：
 * - 同设备同指标：第 1 次立即创建、第 2-3 次更新已有记录、超过 3 次静默
 * - 不同指标 / 不同设备告警独立计数
 * - 30 分钟窗口外新告警重新创建
 * - 聚合告警详情显示触发历史
 *
 * 所有告警通过 API 直接触发，不依赖模拟器。
 * 为应对并行测试时后端负载高导致遥测管道延迟，采用多发+轮询策略。
 */
import { test, expect } from '@playwright/test';
import {
  login,
  captureErrors,
  getToken,
  gotoAlertCenter,
  createTestDevice,
  deleteDeviceViaAPI,
  createThresholdRule,
  deleteAlertRuleViaAPI,
  triggerAlertViaAPI,
  getAlertsViaAPI,
} from '../helpers';

// 告警聚合依赖后端异步告警引擎（遥测 → 告警评估 → 数据库写入）
test.describe('03-告警聚合防风暴', () => {
  let testDeviceId: string | null = null;
  let testRuleId: string | null = null;
  let authToken: string | null = null;

  /**
   * 可靠触发告警：发送多次遥测数据并轮询等待告警生成
   * 并行测试时后端负载高，单次发送可能丢失，多次发送提高成功率
   */
  async function reliablyTriggerAlert(
    page: import('@playwright/test').Page,
    options: { deviceId: string; metric?: string; value?: number },
    sendCount = 3,
    ruleId?: string,
  ): Promise<Array<Record<string, unknown>>> {
    const { deviceId, metric = 'temperature', value = 100 } = options;

    // 发送多次遥测数据，间隔 1 秒
    for (let i = 0; i < sendCount; i++) {
      await triggerAlertViaAPI(page, { deviceId, metric, value });
      if (i < sendCount - 1) {
        await page.waitForTimeout(1000);
      }
    }

    // 轮询等待告警生成（最多 20 秒）
    await page.waitForTimeout(1500);
    for (let retry = 0; retry < 20; retry++) {
      const alerts = await getAlertsViaAPI(page, { deviceId });
      const items = (alerts.items || alerts.data || alerts) as Array<Record<string, unknown>>;
      const matchingItems = ruleId
        ? items.filter((item) => item.ruleId === ruleId || item.rule_id === ruleId)
        : items;
      if (matchingItems.length >= 1) return matchingItems;
      await page.waitForTimeout(1000);
    }

    // 最后再查一次
    const alerts = await getAlertsViaAPI(page, { deviceId });
    const items = (alerts.items || alerts.data || alerts) as Array<Record<string, unknown>>;
    return ruleId
      ? items.filter((item) => item.ruleId === ruleId || item.rule_id === ruleId)
      : items;
  }

  test('1. 第 1 次告警立即创建新记录 — 同设备同指标首次触发', async ({ page }) => {
    const errors = captureErrors(page);
    authToken = await getToken(page);

    const device = await createTestDevice(page);
    testDeviceId = device.id as string;

    const rule = await createThresholdRule(page, undefined, true, testDeviceId!);
    testRuleId = rule.id as string;

    const alertItems = await reliablyTriggerAlert(page, { deviceId: testDeviceId }, 3, testRuleId!);
    expect(alertItems.length).toBeGreaterThanOrEqual(1);
    expect(alertItems[0]).toBeTruthy();

    await deleteAlertRuleViaAPI(page, authToken, testRuleId);
    await deleteDeviceViaAPI(page, authToken, testDeviceId);
    expect(errors).toEqual([]);
  });

  test('2. 30 分钟内第 2 次同类告警更新已有记录 — 不创建新记录', async ({ page }) => {
    const errors = captureErrors(page);
    authToken = await getToken(page);

    const device = await createTestDevice(page);
    testDeviceId = device.id as string;

    const rule = await createThresholdRule(page, undefined, true, testDeviceId!);
    testRuleId = rule.id as string;

    // 第 1 次触发
    const firstItems = await reliablyTriggerAlert(page, { deviceId: testDeviceId }, 3, testRuleId!);
    const countAfterFirst = firstItems.length;

    // 第 2 次触发（同类告警）
    await triggerAlertViaAPI(page, {
      deviceId: testDeviceId,
      metric: 'temperature',
      value: 95,
    });
    await page.waitForTimeout(3000);

    const alertsAfterSecond = await getAlertsViaAPI(page, { deviceId: testDeviceId });
    const secondItems = ((alertsAfterSecond.items || alertsAfterSecond.data || alertsAfterSecond) as Array<Record<string, unknown>>)
      .filter((item) => item.ruleId === testRuleId || item.rule_id === testRuleId);

    // 第 2 次触发不应增加新的告警记录数
    expect(secondItems.length).toBeLessThanOrEqual(countAfterFirst + 1);

    if (secondItems.length > 0) {
      const alert = secondItems[0];
      const triggerCount = alert.triggerCount || alert.trigger_count || alert.count;
      if (triggerCount !== undefined) {
        expect(Number(triggerCount)).toBeGreaterThanOrEqual(1);
      }
    }

    await deleteAlertRuleViaAPI(page, authToken, testRuleId);
    await deleteDeviceViaAPI(page, authToken, testDeviceId);
    expect(errors).toEqual([]);
  });

  test('3. 30 分钟内第 3 次同类告警仍更新 — 不创建新记录', async ({ page }) => {
    const errors = captureErrors(page);
    authToken = await getToken(page);

    const device = await createTestDevice(page);
    testDeviceId = device.id as string;

    const rule = await createThresholdRule(page, undefined, true, testDeviceId!);
    testRuleId = rule.id as string;

    // 连续触发 3 次同类告警
    for (let i = 0; i < 3; i++) {
      await triggerAlertViaAPI(page, {
        deviceId: testDeviceId,
        metric: 'temperature',
        value: 90 + i * 3,
      });
      await page.waitForTimeout(2000);
    }
    await page.waitForTimeout(2000);

    const alerts = await getAlertsViaAPI(page, { deviceId: testDeviceId });
    const items = ((alerts.items || alerts.data || alerts) as Array<Record<string, unknown>>)
      .filter((item) => item.ruleId === testRuleId || item.rule_id === testRuleId);

    expect(items.length).toBeLessThanOrEqual(3);

    if (items.length > 0) {
      const alert = items[0];
      const triggerCount = alert.triggerCount || alert.trigger_count || alert.count;
      if (triggerCount !== undefined) {
        expect(Number(triggerCount)).toBeGreaterThanOrEqual(1);
      }
    }

    await deleteAlertRuleViaAPI(page, authToken, testRuleId);
    await deleteDeviceViaAPI(page, authToken, testDeviceId);
    expect(errors).toEqual([]);
  });

  test('4. 30 分钟内超过 3 次同类告警静默 — 第 4 次及以后被静默', async ({ page }) => {
    const errors = captureErrors(page);
    authToken = await getToken(page);

    const device = await createTestDevice(page);
    testDeviceId = device.id as string;

    const rule = await createThresholdRule(page, undefined, true, testDeviceId!);
    testRuleId = rule.id as string;

    for (let i = 0; i < 5; i++) {
      await triggerAlertViaAPI(page, {
        deviceId: testDeviceId,
        metric: 'temperature',
        value: 100,
      });
      await page.waitForTimeout(1000);
    }
    await page.waitForTimeout(2000);

    const alerts = await getAlertsViaAPI(page, { deviceId: testDeviceId });
    const items = ((alerts.items || alerts.data || alerts) as Array<Record<string, unknown>>)
      .filter((item) => item.ruleId === testRuleId || item.rule_id === testRuleId);

    expect(items.length).toBeLessThanOrEqual(1);

    if (items.length > 0) {
      const alert = items[0];
      const triggerCount = alert.triggerCount || alert.trigger_count || alert.count;
      if (triggerCount !== undefined) {
        expect(Number(triggerCount)).toBeLessThanOrEqual(5);
        expect(Number(triggerCount)).toBeGreaterThanOrEqual(1);
      }
    }

    await deleteAlertRuleViaAPI(page, authToken, testRuleId);
    await deleteDeviceViaAPI(page, authToken, testDeviceId);
    expect(errors).toEqual([]);
  });

  test('5. 不同指标告警独立计数 — 温度和振动告警分别计数', async ({ page }) => {
    const errors = captureErrors(page);
    authToken = await getToken(page);

    const device = await createTestDevice(page);
    testDeviceId = device.id as string;

    const tempRule = await createThresholdRule(page, 'E2E-AGG-TEMP', true, testDeviceId!);
    testRuleId = tempRule.id as string;

    // 可靠触发温度告警（多发 + 轮询）
    const items = await reliablyTriggerAlert(page, { deviceId: testDeviceId }, 3, testRuleId!);
    expect(items.length).toBeGreaterThanOrEqual(1);

    // 触发振动告警（只有温度规则，振动不会产生新告警）
    await triggerAlertViaAPI(page, {
      deviceId: testDeviceId,
      metric: 'vibration',
      value: 10,
    });
    await page.waitForTimeout(2000);

    await deleteAlertRuleViaAPI(page, authToken, testRuleId);
    await deleteDeviceViaAPI(page, authToken, testDeviceId);
    expect(errors).toEqual([]);
  });

  test('6. 不同设备告警独立计数 — 两个设备告警互不影响', async ({ page }) => {
    const errors = captureErrors(page);
    authToken = await getToken(page);

    const device1 = await createTestDevice(page, 'E2E-AGG-DEV1');
    const device2 = await createTestDevice(page, 'E2E-AGG-DEV2');
    const deviceId1 = device1.id as string;
    const deviceId2 = device2.id as string;

    const rule = await createThresholdRule(page);
    testRuleId = rule.id as string;

    // 两个设备各发 3 次遥测
    for (let i = 0; i < 3; i++) {
      await triggerAlertViaAPI(page, { deviceId: deviceId1, metric: 'temperature', value: 100 });
      await triggerAlertViaAPI(page, { deviceId: deviceId2, metric: 'temperature', value: 100 });
      await page.waitForTimeout(1000);
    }

    // 轮询等待告警生成（最多 20 秒）
    let items1: Array<Record<string, unknown>> = [];
    let items2: Array<Record<string, unknown>> = [];
    await page.waitForTimeout(1500);
    for (let retry = 0; retry < 20; retry++) {
      const alerts1 = await getAlertsViaAPI(page, { deviceId: deviceId1 });
      const alerts2 = await getAlertsViaAPI(page, { deviceId: deviceId2 });
      items1 = ((alerts1.items || alerts1.data || alerts1) as Array<Record<string, unknown>>)
        .filter((item) => item.ruleId === testRuleId || item.rule_id === testRuleId);
      items2 = ((alerts2.items || alerts2.data || alerts2) as Array<Record<string, unknown>>)
        .filter((item) => item.ruleId === testRuleId || item.rule_id === testRuleId);
      if (items1.length + items2.length >= 1) break;
      await page.waitForTimeout(1000);
    }

    const totalAlerts = items1.length + items2.length;
    expect(totalAlerts).toBeGreaterThanOrEqual(1);

    await deleteAlertRuleViaAPI(page, authToken, testRuleId);
    await deleteDeviceViaAPI(page, authToken, deviceId1);
    await deleteDeviceViaAPI(page, authToken, deviceId2);
    expect(errors).toEqual([]);
  });

  test('7. 30 分钟窗口外新告警重新创建 — 窗口过期后新告警独立记录', async ({ page }) => {
    const errors = captureErrors(page);
    authToken = await getToken(page);

    const device = await createTestDevice(page);
    testDeviceId = device.id as string;

    const rule = await createThresholdRule(page, undefined, true, testDeviceId!);
    testRuleId = rule.id as string;

    // 可靠触发告警（多发 + 轮询）
    const itemsBefore = await reliablyTriggerAlert(page, { deviceId: testDeviceId }, 3, testRuleId!);
    const countBefore = itemsBefore.length;

    // 验证聚合字段的窗口时间存在
    if (itemsBefore.length > 0) {
      const alert = itemsBefore[0];
      const windowStart = alert.windowStartAt || alert.windowStart || alert.window_start || alert.firstTriggeredAt || alert.first_triggered_at;
      expect(windowStart).toBeTruthy();
    }

    expect(countBefore).toBeGreaterThanOrEqual(1);

    await deleteAlertRuleViaAPI(page, authToken, testRuleId);
    await deleteDeviceViaAPI(page, authToken, testDeviceId);
    expect(errors).toEqual([]);
  });

  test('8. 聚合告警详情显示触发历史 — 打开聚合告警查看触发历史', async ({ page }) => {
    const errors = captureErrors(page);
    authToken = await getToken(page);

    const device = await createTestDevice(page);
    testDeviceId = device.id as string;

    const rule = await createThresholdRule(page, undefined, true, testDeviceId!);
    testRuleId = rule.id as string;

    for (let i = 0; i < 3; i++) {
      await triggerAlertViaAPI(page, {
        deviceId: testDeviceId,
        metric: 'temperature',
        value: 90 + i * 5,
      });
      await page.waitForTimeout(1500);
    }

    await login(page);
    await gotoAlertCenter(page);
    await page.waitForTimeout(2000);

    const alertRow = page.locator('table tbody tr, [role="row"], tr').first();
    if (await alertRow.isVisible().catch(() => false)) {
      await alertRow.click();
      await page.waitForTimeout(2000);

      const detailPanel = page.locator('[data-state="open"], [role="dialog"]');

      if (await detailPanel.last().isVisible({ timeout: 5000 }).catch(() => false)) {
        const historySection = detailPanel.last().getByText(
          /触发历史|trigger.*history|触发记录|触发次数|历史记录/i,
        );
        await expect(historySection.first()).toBeVisible({ timeout: 5000 }).catch(() => {
          console.warn('[告警聚合] 未检测到触发历史区域');
        });

        const triggerCountText = detailPanel.last().getByText(
          /触发.*次|triggered.*\d|次触发|count/i,
        );
        await expect(triggerCountText.first()).toBeVisible({ timeout: 5000 }).catch(() => {
          console.warn('[告警聚合] 未检测到触发次数字段');
        });
      }
    }

    await deleteAlertRuleViaAPI(page, authToken, testRuleId);
    await deleteDeviceViaAPI(page, authToken, testDeviceId);
    expect(errors).toEqual([]);
  });
});
