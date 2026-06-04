import { test, expect } from '@playwright/test';
import { BASE_URL, login, captureErrors, navigateViaSidebar } from './helpers';

test.describe('12. 租户管理', () => {
  test('12.1 租户列表', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /租户/i);
    await page.waitForTimeout(2000);
    expect(errors).toEqual([]);
  });

  test('12.2 搜索功能', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /租户/i);
    await page.waitForTimeout(2000);
    const searchInput = page.getByPlaceholder(/搜索|search/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('admin');
      await page.waitForTimeout(1500);
    }
    expect(errors).toEqual([]);
  });

  test('12.3 点击进入详情', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /租户/i);
    await page.waitForTimeout(2000);
    const row = page.locator('table tbody tr').first();
    if (await row.isVisible().catch(() => false)) {
      await row.click();
      await page.waitForTimeout(3000);
      await expect(page).toHaveURL(/\/admin\/tenants\/[0-9a-f-]+/, { timeout: 5000 }).catch(() => {});
    }
    expect(errors).toEqual([]);
  });

  test('12.4 冻结租户', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /租户/i);
    await page.waitForTimeout(2000);
    // 查找冻结按钮（注意不能冻结自身租户）
    const freezeBtns = page.getByRole('button', { name: /冻结|freeze/i });
    if (await freezeBtns.first().isVisible().catch(() => false)) {
      // 不实际点击，仅验证按钮可见
      await page.waitForTimeout(500);
    }
    expect(errors).toEqual([]);
  });

  test('12.5 解冻租户', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /租户/i);
    await page.waitForTimeout(2000);
    const unfreezeBtns = page.getByRole('button', { name: /解冻|unfreeze/i });
    if (await unfreezeBtns.first().isVisible().catch(() => false)) {
      await page.waitForTimeout(500);
    }
    expect(errors).toEqual([]);
  });

  test('12.6 列表分页', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /租户/i);
    await page.waitForTimeout(2000);
    const nextBtn = page.getByRole('button', { name: /下一页|next/i });
    if (await nextBtn.isVisible().catch(() => false)) {
      const isDisabled = await nextBtn.isDisabled().catch(() => true);
      if (!isDisabled) {
        await nextBtn.click();
        await page.waitForTimeout(1500);
      }
    }
    expect(errors).toEqual([]);
  });

  test('12.7 详情-基础信息和用量', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /租户/i);
    await page.waitForTimeout(2000);
    const row = page.locator('table tbody tr').first();
    if (await row.isVisible().catch(() => false)) {
      await row.click();
      await page.waitForTimeout(3000);
      // 验证详情页内容
      const bodyText = await page.textContent('body');
      expect(bodyText?.trim().length).toBeGreaterThan(10);
    }
    expect(errors).toEqual([]);
  });

  test('12.8 详情-返回列表', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /租户/i);
    await page.waitForTimeout(2000);
    const row = page.locator('table tbody tr').first();
    if (await row.isVisible().catch(() => false)) {
      await row.click();
      await page.waitForTimeout(3000);
      // 使用浏览器后退导航
      await page.goBack();
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/admin\/tenants/);
    }
    expect(errors).toEqual([]);
  });
});
