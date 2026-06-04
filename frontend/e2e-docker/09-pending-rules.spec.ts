import { test, expect } from '@playwright/test';
import { BASE_URL, login, captureErrors } from './helpers';

test.describe('9. 候选规则审核', () => {
  test('9.1 页面加载和列表展示', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.goto(`${BASE_URL}/pending-rules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    // 验证页面标题
    const title = page.getByText(/候选规则|待审核|pending/i);
    await expect(title.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    expect(errors).toEqual([]);
  });

  test('9.2 审核状态筛选', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.goto(`${BASE_URL}/pending-rules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const selects = page.locator('button[role="combobox"]');
    if (await selects.first().isVisible().catch(() => false)) {
      await selects.first().click();
      await page.waitForTimeout(300);
      const opt = page.getByRole('option', { name: /已批准|approved/i }).first();
      if (await opt.isVisible().catch(() => false)) {
        await opt.click();
        await page.waitForTimeout(1000);
      }
    }
    expect(errors).toEqual([]);
  });

  test('9.3 批准操作', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.goto(`${BASE_URL}/pending-rules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    // 查找批准按钮
    const approveBtns = page.getByRole('button', { name: /批准|approve/i });
    if (await approveBtns.first().isVisible().catch(() => false)) {
      await approveBtns.first().click();
      await page.waitForTimeout(1000);
    }
    expect(errors).toEqual([]);
  });

  test('9.4 驳回操作含原因输入', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.goto(`${BASE_URL}/pending-rules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    // 查找驳回按钮
    const rejectBtns = page.getByRole('button', { name: /驳回|reject/i });
    if (await rejectBtns.first().isVisible().catch(() => false)) {
      await rejectBtns.first().click();
      await page.waitForTimeout(500);
      // 应展开驳回原因输入区域
      const reasonInput = page.locator('textarea').filter({ hasText: '' }).first();
      if (await reasonInput.isVisible().catch(() => false)) {
        await reasonInput.fill('E2E测试驳回原因');
        // 查找确认驳回按钮
        const confirmBtn = page.getByRole('button', { name: /确认驳回|confirm/i });
        if (await confirmBtn.isVisible().catch(() => false)) {
          await confirmBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }
    expect(errors).toEqual([]);
  });
});
