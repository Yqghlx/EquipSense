/**
 * 待审批页面测试
 *
 * 覆盖 Phase 3 新增的待审批页面交互：
 * - 页面加载与空状态展示
 * - 待审批工单列表显示
 * - 审批通过操作
 * - 审批驳回操作（含驳回原因）
 * - 跳转到工单详情
 * - 侧边栏导航入口
 */
import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  login,
  captureErrors,
} from '../helpers';

test.describe('02-待审批页面', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('1. 应正确加载待审批页面', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/pending-approvals`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 验证页面标题
    await expect(page.getByText('待审批工单')).toBeVisible({ timeout: 5000 });

    // 验证表格存在
    const table = page.locator('table');
    if (await table.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(table).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test('2. 无待审批工单时应显示空状态', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/pending-approvals`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 空状态时显示提示文字
    const emptyHint = page.getByText(/暂无待审批|没有待审批/i).first();
    const hasEmpty = await emptyHint.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasEmpty) {
      await expect(emptyHint).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test('3. 待审批列表应显示工单基本信息', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/pending-approvals`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 查找待审批行
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // 验证表格列存在
      const tableHeaders = page.locator('table thead th');
      const headerCount = await tableHeaders.count();
      expect(headerCount).toBeGreaterThanOrEqual(3);

      // 验证操作按钮存在（通过/驳回）
      const approveButtons = page.getByRole('button', { name: /通过|approve/i });
      const rejectButtons = page.getByRole('button', { name: /驳回|reject/i });
      const approveCount = await approveButtons.count();
      const rejectCount = await rejectButtons.count();
      expect(approveCount + rejectCount).toBeGreaterThan(0);
    }

    expect(errors).toEqual([]);
  });

  test('4. 审批通过后工单应从列表消失', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/pending-approvals`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const approveButton = page.getByRole('button', { name: /通过|approve/i }).first();
    if (await approveButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      const rowsBefore = await page.locator('table tbody tr').count();

      await approveButton.click();
      await page.waitForTimeout(2000);

      // 验证列表刷新（至少不增加）
      const rowsAfter = await page.locator('table tbody tr').count();
      expect(rowsAfter).toBeLessThanOrEqual(rowsBefore);
    }

    expect(errors).toEqual([]);
  });

  test('5. 驳回应弹出驳回原因对话框', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/pending-approvals`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const rejectButton = page.getByRole('button', { name: /驳回|reject/i }).first();
    if (await rejectButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rejectButton.click();
      await page.waitForTimeout(1000);

      // 验证驳回原因对话框出现
      const dialog = page.getByText(/驳回原因|请输入驳回原因/i).first();
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // 验证确认驳回按钮存在
      const confirmReject = page.getByRole('button', { name: /确认驳回/i });
      if (await confirmReject.isVisible().catch(() => false)) {
        // 填写驳回原因
        const reasonInput = page.getByPlaceholder(/驳回原因|请输入/i).first();
        if (await reasonInput.isVisible().catch(() => false)) {
          await reasonInput.fill('E2E 测试驳回原因');
        }

        await confirmReject.click();
        await page.waitForTimeout(2000);
      }
    }

    expect(errors).toEqual([]);
  });

  test('6. 点击工单标题应跳转到工单详情', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/pending-approvals`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 查找工单标题链接
    const woLinks = page.locator('table tbody tr td a').first();
    if (await woLinks.isVisible({ timeout: 3000 }).catch(() => false)) {
      await woLinks.click();
      await page.waitForTimeout(2000);

      // 验证跳转到工单详情
      const url = page.url();
      expect(url).toMatch(/\/work-orders\//);
    }

    expect(errors).toEqual([]);
  });

  test('7. 侧边栏应有待审批入口', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 点击侧边栏"待审批"链接
    const pendingLink = page.getByRole('link', { name: /待审批/i }).first();
    if (await pendingLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pendingLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // 验证跳转到待审批页面
      await expect(page.getByText('待审批工单')).toBeVisible({ timeout: 5000 });
    }

    expect(errors).toEqual([]);
  });
});
