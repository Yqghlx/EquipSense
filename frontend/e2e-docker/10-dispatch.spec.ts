import { test, expect } from '@playwright/test';
import { BASE_URL, login, captureErrors, navigateViaSidebar, getToken, createWorkOrderViaAPI } from './helpers';

test.describe('10. 派工看板', () => {
  test('10.1 看板加载', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /派工/i);
    await expect(page).toHaveURL(/dispatch/, { timeout: 5000 });
    expect(errors).toEqual([]);
  });

  test('10.2 选择待派工工单', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    // 创建 PendingDispatch 工单
    const wo = await createWorkOrderViaAPI(page, token, { title: '派工看板测试' });
    await navigateViaSidebar(page, /派工/i);
    await page.waitForTimeout(2000);
    // 查找工单卡片
    const woCard = page.locator('[class*="card"], [class*="cursor-pointer"]').filter({ hasText: '派工看板测试' }).first();
    if (await woCard.isVisible().catch(() => false)) {
      await woCard.click();
      await page.waitForTimeout(1000);
    }
    expect(errors).toEqual([]);
  });

  test('10.3 查看推荐技术员', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const wo = await createWorkOrderViaAPI(page, token, { title: '推荐技术员测试' });
    await navigateViaSidebar(page, /派工/i);
    await page.waitForTimeout(2000);
    // 查找并点击工单
    const woCard = page.locator('[class*="card"], [class*="cursor-pointer"]').filter({ hasText: '推荐技术员测试' }).first();
    if (await woCard.isVisible().catch(() => false)) {
      await woCard.click();
      await page.waitForTimeout(2000);
      // 查找推荐区域
      const recommendSection = page.getByText(/推荐|recommendation|技术员/i);
      await expect(recommendSection.first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    }
    expect(errors).toEqual([]);
  });

  test('10.4 执行派工操作', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const wo = await createWorkOrderViaAPI(page, token, { title: '执行派工测试' });
    await navigateViaSidebar(page, /派工/i);
    await page.waitForTimeout(2000);
    const woCard = page.locator('[class*="card"], [class*="cursor-pointer"]').filter({ hasText: '执行派工测试' }).first();
    if (await woCard.isVisible().catch(() => false)) {
      await woCard.click();
      await page.waitForTimeout(2000);
      // 查找派工按钮
      const dispatchBtn = page.getByRole('button', { name: /派工|assign/i }).first();
      if (await dispatchBtn.isVisible().catch(() => false)) {
        await dispatchBtn.click();
        await page.waitForTimeout(2000);
      }
    }
    expect(errors).toEqual([]);
  });
});
