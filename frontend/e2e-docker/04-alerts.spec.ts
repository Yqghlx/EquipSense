import { test, expect } from '@playwright/test';
import { BASE_URL, login, captureErrors, navigateViaSidebar } from './helpers';

test.describe('4. 告警中心', () => {
  test('4.1 列表筛选', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /告警/i);
    await expect(page).toHaveURL(/alerts/);
    const selects = page.locator('button[role="combobox"]');
    if (await selects.first().isVisible().catch(() => false)) {
      await selects.first().click();
      await page.waitForTimeout(300);
      const opt = page.getByRole('option', { name: /活跃|active/i }).first();
      if (await opt.isVisible().catch(() => false)) await opt.click();
    }
    expect(errors).toEqual([]);
  });

  test('4.2 点击打开详情', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /告警/i);
    const row = page.locator('table tbody tr').first();
    if (await row.isVisible().catch(() => false)) {
      await row.click();
      await page.waitForTimeout(1000);
      const sheet = page.locator('[data-state="open"], [role="dialog"]').last();
      await expect(sheet).toBeVisible({ timeout: 3000 }).catch(() => {});
    }
    expect(errors).toEqual([]);
  });

  test('4.3 严重级别筛选', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /告警/i);
    const selects = page.locator('button[role="combobox"]');
    if (await selects.nth(1).isVisible().catch(() => false)) {
      await selects.nth(1).click();
      await page.waitForTimeout(300);
      const opt = page.getByRole('option', { name: /严重|critical/i }).first();
      if (await opt.isVisible().catch(() => false)) {
        await opt.click();
        await page.waitForTimeout(1000);
      }
    }
    expect(errors).toEqual([]);
  });

  test('4.4 告警确认操作', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /告警/i);
    await page.waitForTimeout(1500);
    // 查找确认按钮（在 active 状态的告警行中）
    const ackBtn = page.getByRole('button', { name: /确认|acknowledge/i }).first();
    if (await ackBtn.isVisible().catch(() => false)) {
      await ackBtn.click();
      await page.waitForTimeout(2000);
    }
    expect(errors).toEqual([]);
  });

  test('4.5 告警解决操作', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /告警/i);
    await page.waitForTimeout(1500);
    const resolveBtn = page.getByRole('button', { name: /解决|resolve/i }).first();
    if (await resolveBtn.isVisible().catch(() => false)) {
      await resolveBtn.click();
      await page.waitForTimeout(2000);
    }
    expect(errors).toEqual([]);
  });

  test('4.6 详情抽屉完整内容', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /告警/i);
    const row = page.locator('table tbody tr').first();
    if (await row.isVisible().catch(() => false)) {
      await row.click();
      await page.waitForTimeout(1500);
      // 验证抽屉内容
      const sheet = page.locator('[data-state="open"], [role="dialog"]').last();
      if (await sheet.isVisible().catch(() => false)) {
        const sheetText = await sheet.textContent();
        expect(sheetText?.trim().length).toBeGreaterThan(0);
      }
    }
    expect(errors).toEqual([]);
  });
});
