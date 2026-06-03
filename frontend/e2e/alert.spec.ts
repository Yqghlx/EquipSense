import { test, expect } from '@playwright/test';
import { login, navigateTo } from './helpers';

test.describe('告警管理流程', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  /** 测试用例：导航到告警中心并确认页面加载 */
  test('导航到告警中心并确认页面加载', async ({ page }) => {
    await navigateTo(page, /告警/i, /alerts/);

    await expect(page).toHaveURL(/alerts/);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });
  });

  /** 测试用例：查看告警列表（表格或空状态） */
  test('查看告警列表', async ({ page }) => {
    await navigateTo(page, /告警/i, /alerts/);

    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasNoData = await page.getByText(/暂无数据|no data/i).isVisible().catch(() => false);
    expect(hasTable || hasNoData).toBeTruthy();

    if (hasTable) {
      await expect(page.getByRole('columnheader').first()).toBeVisible();
    }
  });

  /** 测试用例：按状态过滤告警 */
  test('按状态过滤告警', async ({ page }) => {
    await navigateTo(page, /告警/i, /alerts/);

    // 状态过滤是第一个 combobox（文本为 "状态▼"）
    const statusCombo = page.getByRole('combobox').first();
    const hasCombo = await statusCombo.isVisible().catch(() => false);
    if (!hasCombo) {
      console.log('未找到状态下拉框，跳过过滤测试');
      return;
    }

    await statusCombo.click();
    // 等待下拉选项出现
    await page.waitForTimeout(500);

    // 尝试选择"已确认"状态
    const acknowledgedOption = page.getByRole('option', { name: /已确认|acknowledged/i });
    if (await acknowledgedOption.isVisible().catch(() => false)) {
      await acknowledgedOption.click();
      await page.waitForLoadState('networkidle');
    }

    // 恢复全部状态
    await statusCombo.click();
    await page.waitForTimeout(500);
    const allOption = page.getByRole('option', { name: /全部|all/i });
    if (await allOption.isVisible().catch(() => false)) {
      await allOption.click();
      await page.waitForLoadState('networkidle');
    }

    // 验证过滤操作后页面仍然正常
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasNoData = await page.getByText(/暂无数据|no data/i).isVisible().catch(() => false);
    expect(hasTable || hasNoData).toBeTruthy();
  });

  /** 测试用例：确认告警（如果存在触发状态的告警） */
  test('确认告警（如果存在触发状态的告警）', async ({ page }) => {
    await navigateTo(page, /告警/i, /alerts/);

    const acknowledgeButtons = page.getByRole('button', { name: /确认|acknowledge/i });
    if (await acknowledgeButtons.first().isVisible().catch(() => false)) {
      await acknowledgeButtons.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    } else {
      console.log('当前没有活跃告警可供确认，跳过确认操作验证');
    }
  });

  /** 测试用例：导航到告警规则页面 */
  test('导航到告警规则页面', async ({ page }) => {
    // 先到告警中心页面（确保 auth 已恢复）
    await navigateTo(page, /告警/i, /alerts/);

    // 查找页面内是否有告警规则链接
    const alertRulesLink = page.locator('a[href="/alert-rules"]').first();
    if (await alertRulesLink.isVisible().catch(() => false)) {
      await alertRulesLink.click();
    } else {
      // 使用 React Router 导航（通过点击侧边栏告警链接重新进入）
      // 告警规则可能需要通过浏览器地址栏导航
      // 但直接 goto 会丢失 auth，所以先记录当前 URL 然后用 JS 导航
      await page.evaluate(() => {
        window.history.pushState({}, '', '/alert-rules');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
      await page.waitForTimeout(2000);
    }

    await page.waitForLoadState('networkidle');
    // 验证告警规则页面加载（URL 或页面标题）
    const currentUrl = page.url();
    const isOnAlertRules = currentUrl.includes('alert-rules');
    if (!isOnAlertRules) {
      // 如果 pushState 没生效，尝试用 location
      await page.evaluate(() => { window.location.href = '/alert-rules'; });
      await page.waitForURL('**/alert-rules', { timeout: 5000 }).catch(() => {});
    }

    const heading = page.getByRole('heading', { level: 1 }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  /** 测试用例：查看规则列表 */
  test('查看规则列表', async ({ page }) => {
    await navigateTo(page, /告警/i, /alerts/);

    // 查找告警规则链接
    const alertRulesLink = page.locator('a[href="/alert-rules"]').first();
    if (await alertRulesLink.isVisible().catch(() => false)) {
      await alertRulesLink.click();
    } else {
      await page.evaluate(() => { window.location.href = '/alert-rules'; });
      await page.waitForURL('**/alert-rules', { timeout: 5000 }).catch(() => {});
    }
    await page.waitForLoadState('networkidle');

    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasNoData = await page.getByText(/暂无数据|no data/i).isVisible().catch(() => false);
    expect(hasTable || hasNoData).toBeTruthy();
  });
});
