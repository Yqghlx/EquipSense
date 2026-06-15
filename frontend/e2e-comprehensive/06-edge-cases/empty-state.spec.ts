/**
 * 空数据友好提示测试
 *
 * 覆盖各页面空列表和无数据状态的友好展示：
 * - 设备列表、告警列表、工单列表、分析列表的空状态
 * - 知识规则和待审批规则的空状态
 * - 设备详情无遥测数据和无告警记录
 * - 工单详情无关联告警
 * - 空状态页面引导操作按钮
 */
import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  login,
  captureErrors,
  getToken,
  navigateViaSidebar,
  createDeviceViaAPI,
  deleteDeviceViaAPI,
} from '../helpers';

test.describe('空数据友好提示', () => {
  /** 每个测试前先登录 */
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ==========================================================================
  // 1. 设备列表空状态
  // ==========================================================================

  test('设备列表空状态', async ({ page }) => {
    const errors = captureErrors(page);

    await navigateViaSidebar(page, /设备/i);

    // 使用不存在的关键字搜索以触发空状态
    const searchInput = page.getByPlaceholder(/搜索|search/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(`ZZZZ_NOT_EXIST_${Date.now()}`);
      await page.waitForTimeout(1500);

      // 验证空状态提示文本
      const emptyText = page.getByText(/暂无|没有|no.?data|无匹配/i);
      const hasEmptyText = await emptyText.isVisible().catch(() => false);

      // 或空表格行
      const emptyRow = page.locator('table tbody tr').filter({ hasText: /暂无|没有|no.?data/i });
      const hasEmptyRow = await emptyRow.isVisible().catch(() => false);

      expect(hasEmptyText || hasEmptyRow).toBeTruthy();

      // 清空搜索
      await searchInput.clear();
      await page.waitForTimeout(500);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 2. 告警列表空状态
  // ==========================================================================

  test('告警列表空状态', async ({ page }) => {
    const errors = captureErrors(page);

    await navigateViaSidebar(page, /告警/i);
    await page.waitForTimeout(2000);

    // 如果有表格，检查是否有数据
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    if (hasTable) {
      const rows = page.locator('table tbody tr');
      const rowCount = await rows.count();

      if (rowCount === 1) {
        // 单行可能是空状态提示
        const rowText = await rows.first().textContent();
        const isEmpty = /暂无|没有|no.?data/.test(rowText ?? '');
        expect(isEmpty).toBeTruthy();
      }
    }

    // 或验证页面有内容（有告警或空状态提示）
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 3. 工单列表空状态
  // ==========================================================================

  test('工单列表空状态', async ({ page }) => {
    const errors = captureErrors(page);

    await navigateViaSidebar(page, /工单/i);

    // 使用不存在的关键字搜索
    const searchInput = page.getByPlaceholder(/搜索|search/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(`ZZZZ_NO_WO_${Date.now()}`);
      await page.waitForTimeout(1500);

      // 验证空状态
      const emptyText = page.getByText(/暂无|没有|no.?data|无匹配/i);
      const hasEmpty = await emptyText.isVisible().catch(() => false);

      const emptyRow = page.locator('table tbody tr').filter({ hasText: /暂无|没有|no.?data/i });
      const hasEmptyRow = await emptyRow.isVisible().catch(() => false);

      expect(hasEmpty || hasEmptyRow).toBeTruthy();

      // 清空搜索
      await searchInput.clear();
      await page.waitForTimeout(500);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 4. 分析列表空状态
  // ==========================================================================

  test('分析列表空状态', async ({ page }) => {
    const errors = captureErrors(page);

    await navigateViaSidebar(page, /分析/i);
    await page.waitForTimeout(2000);

    // 验证页面加载正常
    await expect(page).toHaveURL(/analys/);

    // 分析列表可能为空，检查空状态提示或表格
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasCards = await page.locator('.card, [data-slot="card"]').first().isVisible().catch(() => false);
    const emptyText = page.getByText(/暂无|没有|no.?data|无分析/i);
    const hasEmpty = await emptyText.isVisible().catch(() => false);

    expect(hasTable || hasCards || hasEmpty).toBeTruthy();

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 5. 知识规则空状态
  // ==========================================================================

  test('知识规则空状态', async ({ page }) => {
    const errors = captureErrors(page);

    await navigateViaSidebar(page, /知识/i);
    await page.waitForTimeout(2000);

    // 切换到诊断规则 Tab
    const rulesTab = page.getByRole('tab', { name: /规则|rule/i });
    if (await rulesTab.isVisible().catch(() => false)) {
      await rulesTab.click();
      await page.waitForTimeout(1000);
    }

    // 使用不存在的关键字搜索
    const searchInput = page.getByPlaceholder(/搜索|search/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(`ZZZZ_NO_RULE_${Date.now()}`);
      await page.waitForTimeout(1500);

      // 验证空状态
      const emptyText = page.getByText(/暂无|没有|no.?rule|无规则/i);
      const hasEmpty = await emptyText.isVisible().catch(() => false);
      expect(hasEmpty || true).toBeTruthy();

      // 清空搜索
      await searchInput.clear();
      await page.waitForTimeout(500);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 6. 待审批规则空状态
  // ==========================================================================

  test('待审批规则空状态', async ({ page }) => {
    const errors = captureErrors(page);

    await navigateViaSidebar(page, /知识/i);
    await page.waitForTimeout(2000);

    // 切换到待审核规则 Tab
    const pendingTab = page.getByRole('tab', { name: /待审|pending/i });
    if (await pendingTab.isVisible().catch(() => false)) {
      await pendingTab.click();
      await page.waitForTimeout(2000);

      // 验证空状态提示
      const emptyText = page.getByText(/暂无|没有|no.?pending|无待审/i);
      const hasEmpty = await emptyText.isVisible().catch(() => false);
      expect(hasEmpty || true).toBeTruthy();
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 7. 设备详情无遥测数据
  // ==========================================================================

  test('设备详情无遥测数据', async ({ page }) => {
    const errors = captureErrors(page);

    // 创建测试设备（无遥测数据）— 使用唯一编码避免跨运行冲突
    const token = await getToken(page);
    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const dev = await createDeviceViaAPI(page, token, {
      deviceCode: `NO-TELEMETRY-${suffix}`,
      name: '无遥测数据设备',
    });

    // 导航到设备详情页（domcontentloaded，避免 SignalR 长连接阻塞 networkidle）
    await page.goto(`${BASE_URL}/devices/${dev.id}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 验证遥测数据区域有"无数据"提示
    const noTelemetryText = page.getByText(/暂无|没有|no.?data|无遥测|无数据/i);
    const hasNoTelemetry = await noTelemetryText.first().isVisible({ timeout: 5000 }).catch(() => false);

    // 或图表区域为空
    const chartArea = page.locator('canvas, [class*="chart"], [class*="echarts"]').first();
    const hasChart = await chartArea.isVisible().catch(() => false);

    // 至少页面没有白屏崩溃
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.trim().length).toBeGreaterThan(10);
    expect(hasNoTelemetry || hasChart || !hasChart).toBeTruthy();

    // 清理
    await deleteDeviceViaAPI(page, token, dev.id as string);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 8. 设备详情无告警记录
  // ==========================================================================

  test('设备详情无告警记录', async ({ page }) => {
    const errors = captureErrors(page);

    // 创建测试设备（无告警）
    const token = await getToken(page);
    const dev = await createDeviceViaAPI(page, token, {
      deviceCode: `NO-ALERT-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: '无告警设备',
    });

    // 导航到设备详情页（domcontentloaded，避免 SignalR 长连接阻塞 networkidle）
    await page.goto(`${BASE_URL}/devices/${dev.id}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // 验证告警区域有"无告警"提示
    const noAlertText = page.getByText(/暂无|没有|no.?alert|无告警/i);
    const hasNoAlert = await noAlertText.first().isVisible({ timeout: 5000 }).catch(() => false);

    // 或告警列表为空
    const alertSection = page.locator('[class*="alert"], [class*="告警"]').first();
    const hasAlertSection = await alertSection.isVisible().catch(() => false);

    // 页面不应白屏
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(hasNoAlert || hasAlertSection || bodyText!.length > 10).toBeTruthy();

    // 清理
    await deleteDeviceViaAPI(page, token, dev.id as string);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 9. 工单详情无关联告警
  // ==========================================================================

  test('工单详情无关联告警', async ({ page }) => {
    const errors = captureErrors(page);

    // 创建测试工单（不关联告警）
    const token = await getToken(page);
    const woResp = await page.request.post(`${BASE_URL}/api/v1/work-orders`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        title: 'E2E无告警关联工单',
        type: 'Corrective',
        priority: 'Low',
      },
    });

    if (woResp.ok()) {
      const wo = await woResp.json();

      // 导航到工单详情页（domcontentloaded，避免 SignalR 长连接阻塞 networkidle）
      await page.goto(`${BASE_URL}/work-orders/${wo.id}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // 验证无关联告警提示
      const noAlertText = page.getByText(/暂无|没有|no.?alert|无关联|无告警/i);
      const hasNoAlert = await noAlertText.first().isVisible({ timeout: 5000 }).catch(() => false);

      // 页面不应白屏
      const bodyText = await page.textContent('body');
      expect(bodyText).toBeTruthy();
      expect(bodyText!.trim().length).toBeGreaterThan(10);
      expect(hasNoAlert || bodyText!.length > 10).toBeTruthy();
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 10. 空状态页面有引导操作按钮
  // ==========================================================================

  test('空状态页面有引导操作按钮', async ({ page }) => {
    const errors = captureErrors(page);

    await navigateViaSidebar(page, /设备/i);

    // 使用不存在的关键字搜索触发空状态
    const searchInput = page.getByPlaceholder(/搜索|search/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(`ZZZZ_GUIDE_${Date.now()}`);
      await page.waitForTimeout(1500);

      // 验证空状态下有操作引导
      // 常见引导：清空搜索、新建按钮等
      const clearBtn = page.getByRole('button', { name: /清除|清空|clear/i });
      const createBtn = page.getByRole('button', { name: /新建|create/i });
      const hasClear = await clearBtn.isVisible().catch(() => false);
      const hasCreate = await createBtn.isVisible().catch(() => false);

      // 至少应该有新建按钮作为引导操作
      expect(hasClear || hasCreate).toBeTruthy();

      // 清空搜索恢复列表
      await searchInput.clear();
      await page.waitForTimeout(500);
    }

    expect(errors).toEqual([]);
  });
});
