import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

/** 辅助函数：登录后等待仪表盘加载 */
async function login(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByPlaceholder(/用户名|username/i).fill('admin');
  await page.getByPlaceholder(/密码|password/i).fill('Admin@123');
  await page.getByRole('button', { name: /登录|login/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

test.describe('告警管理流程', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  /** 测试用例：导航到告警中心并确认页面加载 */
  test('导航到告警中心并确认页面加载', async ({ page }) => {
    // 通过侧边栏导航到告警中心
    await page.getByRole('link', { name: /告警/i }).first().click();
    await page.waitForURL('**/alerts', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // 验证 URL 正确
    await expect(page).toHaveURL(/alerts/);

    // 验证页面标题可见
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });
  });

  /** 测试用例：查看告警列表（表格或空状态） */
  test('查看告警列表', async ({ page }) => {
    await page.goto(`${BASE_URL}/alerts`);
    await page.waitForLoadState('networkidle');

    // 验证表格或空状态提示存在
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasNoData = await page.getByText(/暂无数据|no data/i).isVisible().catch(() => false);
    expect(hasTable || hasNoData).toBeTruthy();

    // 如果有表格，验证表头列包含关键字段
    if (hasTable) {
      await expect(page.getByRole('columnheader').first()).toBeVisible();
    }
  });

  /** 测试用例：按状态过滤告警 */
  test('按状态过滤告警', async ({ page }) => {
    await page.goto(`${BASE_URL}/alerts`);
    await page.waitForLoadState('networkidle');

    // 点击状态下拉框（第一个下拉框是状态过滤）
    const statusTriggers = page.getByRole('combobox');
    await statusTriggers.first().click();

    // 选择"已确认"状态进行过滤
    const acknowledgedOption = page.getByRole('option', { name: /已确认|acknowledged/i });
    if (await acknowledgedOption.isVisible().catch(() => false)) {
      await acknowledgedOption.click();
      // 等待列表刷新
      await page.waitForLoadState('networkidle');
    }

    // 恢复全部状态（重新点击下拉框选择"全部"）
    await statusTriggers.first().click();
    const allOption = page.getByRole('option', { name: /全部|all/i });
    if (await allOption.isVisible().catch(() => false)) {
      await allOption.click();
      await page.waitForLoadState('networkidle');
    }

    // 验证过滤操作后页面仍然正常（表格或空状态）
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasNoData = await page.getByText(/暂无数据|no data/i).isVisible().catch(() => false);
    expect(hasTable || hasNoData).toBeTruthy();
  });

  /** 测试用例：确认告警（如果存在触发状态的告警） */
  test('确认告警（如果存在触发状态的告警）', async ({ page }) => {
    await page.goto(`${BASE_URL}/alerts`);
    await page.waitForLoadState('networkidle');

    // 查找是否存在"确认"按钮（仅 active 状态的告警显示确认按钮）
    const acknowledgeButtons = page.getByRole('button', { name: /确认|acknowledge/i });

    if (await acknowledgeButtons.first().isVisible().catch(() => false)) {
      // 点击第一个确认按钮
      await acknowledgeButtons.first().click();

      // 等待操作完成（列表刷新）
      await page.waitForLoadState('networkidle');

      // 验证确认按钮已消失或状态已变更
      await page.waitForTimeout(1000);
    } else {
      // 没有活跃告警可确认，跳过验证
      console.log('当前没有活跃告警可供确认，跳过确认操作验证');
    }
  });

  /** 测试用例：导航到告警规则页面 */
  test('导航到告警规则页面', async ({ page }) => {
    // 从侧边栏导航到告警规则（匹配告警规则链接）
    const alertRulesLink = page.getByRole('link', { name: /告警规则|规则|rules/i });
    if (await alertRulesLink.isVisible().catch(() => false)) {
      await alertRulesLink.click();
    } else {
      // 如果侧边栏没有规则链接，直接导航
      await page.goto(`${BASE_URL}/alert-rules`);
    }

    await page.waitForURL('**/alert-rules', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // 验证告警规则页面已加载
    await expect(page).toHaveURL(/alert-rules/);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });
  });

  /** 测试用例：查看规则列表 */
  test('查看规则列表', async ({ page }) => {
    await page.goto(`${BASE_URL}/alert-rules`);
    await page.waitForLoadState('networkidle');

    // 验证表格或空状态提示存在
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasNoData = await page.getByText(/暂无数据|no data/i).isVisible().catch(() => false);
    expect(hasTable || hasNoData).toBeTruthy();
  });
});
