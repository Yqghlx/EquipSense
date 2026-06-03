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

test.describe('工单管理流程', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  /** 测试用例：导航到工单列表并确认页面加载 */
  test('导航到工单列表并确认页面加载', async ({ page }) => {
    // 通过侧边栏导航到工单管理
    await page.getByRole('link', { name: /工单/i }).click();
    await page.waitForURL('**/work-orders', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // 验证 URL 正确
    await expect(page).toHaveURL(/work-orders/);

    // 验证页面标题可见
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });

    // 验证表格或空状态提示存在
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasNoData = await page.getByText(/暂无数据|no data/i).isVisible().catch(() => false);
    expect(hasTable || hasNoData).toBeTruthy();
  });

  /** 测试用例：创建新工单 */
  test('创建新工单', async ({ page }) => {
    await page.goto(`${BASE_URL}/work-orders`);
    await page.waitForLoadState('networkidle');

    // 先确保有设备可供关联（导航到设备页确认有设备）
    await page.goto(`${BASE_URL}/devices`);
    await page.waitForLoadState('networkidle');

    // 如果设备列表为空，先创建一个设备
    const hasNoDevices = await page.getByText(/暂无数据|no data/i).isVisible().catch(() => false);
    if (hasNoDevices) {
      await page.getByRole('button', { name: /新增|创建|create/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page.getByPlaceholder(/设备编码|devicecode/i).fill('E2E-WO-DEV');
      await page.getByPlaceholder(/设备名称|name/i).fill('E2E工单关联设备');
      await page.getByRole('group').getByRole('combobox').nth(0).click();
      await page.getByRole('option', { name: 'pump' }).click();
      await page.getByRole('dialog').getByRole('button', { name: /保存|save/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    }

    // 回到工单列表页
    await page.goto(`${BASE_URL}/work-orders`);
    await page.waitForLoadState('networkidle');

    // 点击新增按钮，打开工单表单对话框
    await page.getByRole('button', { name: /新增|创建|create/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // 生成唯一的工单标题
    const uniqueTitle = `E2E测试工单-${Date.now()}`;

    // 填写工单标题
    await page.getByRole('dialog').getByPlaceholder(/标题|title/i).fill(uniqueTitle);

    // 选择工单类型（从下拉列表选择"纠正性"）
    await page.getByRole('dialog').getByRole('combobox').nth(0).click();
    const correctiveOption = page.getByRole('option', { name: /纠正|corrective/i });
    if (await correctiveOption.isVisible().catch(() => false)) {
      await correctiveOption.click();
    }

    // 选择优先级（从下拉列表选择"普通"）
    await page.getByRole('dialog').getByRole('combobox').nth(1).click();
    const normalOption = page.getByRole('option', { name: /普通|normal/i });
    if (await normalOption.isVisible().catch(() => false)) {
      await normalOption.click();
    }

    // 选择关联设备（第三个下拉框）
    await page.getByRole('dialog').getByRole('combobox').nth(2).click();
    // 选择列表中的第一个设备
    const firstDeviceOption = page.getByRole('option').first();
    if (await firstDeviceOption.isVisible().catch(() => false)) {
      await firstDeviceOption.click();
    }

    // 填写工单描述
    await page.getByRole('dialog').getByPlaceholder(/描述|description/i).fill('E2E自动化测试创建的工单');

    // 提交表单
    await page.getByRole('dialog').getByRole('button', { name: /保存|save/i }).click();

    // 等待对话框关闭，表示提交成功
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
  });

  /** 测试用例：验证工单出现在列表中 */
  test('验证工单出现在列表中', async ({ page }) => {
    await page.goto(`${BASE_URL}/work-orders`);
    await page.waitForLoadState('networkidle');

    // 先确保有设备（创建工单需要关联设备）
    await page.goto(`${BASE_URL}/devices`);
    await page.waitForLoadState('networkidle');
    const hasNoDevices = await page.getByText(/暂无数据|no data/i).isVisible().catch(() => false);
    if (hasNoDevices) {
      await page.getByRole('button', { name: /新增|创建|create/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page.getByPlaceholder(/设备编码|devicecode/i).fill('E2E-WO-VFY');
      await page.getByPlaceholder(/设备名称|name/i).fill('E2E验证工单设备');
      await page.getByRole('group').getByRole('combobox').nth(0).click();
      await page.getByRole('option', { name: 'pump' }).click();
      await page.getByRole('dialog').getByRole('button', { name: /保存|save/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    }

    // 回到工单列表创建一个工单
    await page.goto(`${BASE_URL}/work-orders`);
    await page.waitForLoadState('networkidle');

    const uniqueTitle = `E2E验证工单-${Date.now()}`;
    await page.getByRole('button', { name: /新增|创建|create/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await page.getByRole('dialog').getByPlaceholder(/标题|title/i).fill(uniqueTitle);

    // 选择工单类型
    await page.getByRole('dialog').getByRole('combobox').nth(0).click();
    const correctiveOpt = page.getByRole('option', { name: /纠正|corrective/i });
    if (await correctiveOpt.isVisible().catch(() => false)) {
      await correctiveOpt.click();
    }

    // 选择优先级
    await page.getByRole('dialog').getByRole('combobox').nth(1).click();
    const normalOpt = page.getByRole('option', { name: /普通|normal/i });
    if (await normalOpt.isVisible().catch(() => false)) {
      await normalOpt.click();
    }

    // 选择设备
    await page.getByRole('dialog').getByRole('combobox').nth(2).click();
    const deviceOption = page.getByRole('option').first();
    if (await deviceOption.isVisible().catch(() => false)) {
      await deviceOption.click();
    }

    await page.getByRole('dialog').getByPlaceholder(/描述|description/i).fill('E2E验证工单描述');
    await page.getByRole('dialog').getByRole('button', { name: /保存|save/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });

    // 等待列表刷新
    await page.waitForLoadState('networkidle');

    // 使用搜索框搜索刚创建的工单
    await page.getByPlaceholder(/搜索|search/i).fill(uniqueTitle);

    // 验证工单出现在搜索结果中
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 5000 });
  });

  /** 测试用例：查看工单详情 */
  test('查看工单详情', async ({ page }) => {
    await page.goto(`${BASE_URL}/work-orders`);
    await page.waitForLoadState('networkidle');

    // 确保有可点击的工单数据
    const hasNoData = await page.getByText(/暂无数据|no data/i).isVisible().catch(() => false);
    if (hasNoData) {
      // 如果没有工单，先创建一个
      // 先确保有设备
      await page.goto(`${BASE_URL}/devices`);
      await page.waitForLoadState('networkidle');
      const noDevices = await page.getByText(/暂无数据|no data/i).isVisible().catch(() => false);
      if (noDevices) {
        await page.getByRole('button', { name: /新增|创建|create/i }).first().click();
        await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
        await page.getByPlaceholder(/设备编码|devicecode/i).fill('E2E-WO-DTL');
        await page.getByPlaceholder(/设备名称|name/i).fill('E2E详情工单设备');
        await page.getByRole('group').getByRole('combobox').nth(0).click();
        await page.getByRole('option', { name: 'pump' }).click();
        await page.getByRole('dialog').getByRole('button', { name: /保存|save/i }).click();
        await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
      }

      // 创建工单
      await page.goto(`${BASE_URL}/work-orders`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: /新增|创建|create/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page.getByRole('dialog').getByPlaceholder(/标题|title/i).fill('E2E工单详情测试');
      await page.getByRole('dialog').getByRole('combobox').nth(0).click();
      const corrOpt = page.getByRole('option', { name: /纠正|corrective/i });
      if (await corrOpt.isVisible().catch(() => false)) await corrOpt.click();
      await page.getByRole('dialog').getByRole('combobox').nth(1).click();
      const normOpt = page.getByRole('option', { name: /普通|normal/i });
      if (await normOpt.isVisible().catch(() => false)) await normOpt.click();
      await page.getByRole('dialog').getByRole('combobox').nth(2).click();
      const devOpt = page.getByRole('option').first();
      if (await devOpt.isVisible().catch(() => false)) await devOpt.click();
      await page.getByRole('dialog').getByPlaceholder(/描述|description/i).fill('测试工单详情');
      await page.getByRole('dialog').getByRole('button', { name: /保存|save/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
      await page.waitForLoadState('networkidle');
    }

    // 点击第一行工单记录跳转到详情页
    const firstRow = page.getByRole('row').nth(1);
    await firstRow.click();

    // 验证跳转到工单详情页（URL 包含 /work-orders/ 和 UUID）
    await page.waitForURL('**/work-orders/**', { timeout: 5000 });
    await expect(page).toHaveURL(/\/work-orders\/[0-9a-f-]+/);

    // 验证详情页关键元素可见：工单标题、返回按钮
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });
  });
});
