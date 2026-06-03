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

test.describe('设备管理流程', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  /** 测试用例：导航到设备列表页并确认页面加载 */
  test('导航到设备列表页并确认页面加载', async ({ page }) => {
    // 通过侧边栏导航到设备管理
    await page.getByRole('link', { name: /设备/i }).first().click();
    await page.waitForURL('**/devices', { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // 验证 URL 正确
    await expect(page).toHaveURL(/devices/);

    // 验证页面标题可见
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });

    // 验证表格或空状态提示存在
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasNoData = await page.getByText(/暂无数据|no data/i).isVisible().catch(() => false);
    expect(hasTable || hasNoData).toBeTruthy();
  });

  /** 测试用例：创建新设备 */
  test('创建新设备', async ({ page }) => {
    await page.goto(`${BASE_URL}/devices`);
    await page.waitForLoadState('networkidle');

    // 点击新增按钮，打开设备表单对话框
    await page.getByRole('button', { name: /新增|创建|create/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // 生成唯一的设备编码，避免与已有数据冲突
    const uniqueCode = `E2E-DEV-${Date.now()}`;

    // 填写设备编码
    await page.getByPlaceholder(/设备编码|devicecode/i).fill(uniqueCode);

    // 填写设备名称
    await page.getByPlaceholder(/设备名称|name/i).fill('E2E测试设备');

    // 选择设备类型（从 Select 下拉列表中选择 pump）
    await page.getByRole('group').getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: 'pump' }).click();

    // 填写设备型号
    await page.getByPlaceholder(/型号|model/i).fill('E2E-Model-001');

    // 提交表单
    await page.getByRole('dialog').getByRole('button', { name: /保存|save/i }).click();

    // 等待对话框关闭，表示提交成功
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
  });

  /** 测试用例：搜索设备并验证出现在列表中 */
  test('搜索设备并验证出现在列表中', async ({ page }) => {
    await page.goto(`${BASE_URL}/devices`);
    await page.waitForLoadState('networkidle');

    // 先创建一个设备用于搜索测试
    const uniqueCode = `E2E-SEARCH-${Date.now()}`;
    await page.getByRole('button', { name: /新增|创建|create/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/设备编码|devicecode/i).fill(uniqueCode);
    await page.getByPlaceholder(/设备名称|name/i).fill('E2E搜索测试设备');
    await page.getByRole('group').getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: 'pump' }).click();
    await page.getByRole('dialog').getByRole('button', { name: /保存|save/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });

    // 等待列表刷新
    await page.waitForLoadState('networkidle');

    // 在搜索框中输入设备编码进行搜索
    await page.getByPlaceholder(/搜索|search/i).fill(uniqueCode);

    // 验证搜索结果中出现刚创建的设备
    await expect(page.getByText(uniqueCode)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('E2E搜索测试设备')).toBeVisible();
  });

  /** 测试用例：查看设备详情 */
  test('查看设备详情', async ({ page }) => {
    await page.goto(`${BASE_URL}/devices`);
    await page.waitForLoadState('networkidle');

    // 检查是否有设备数据可点击
    const hasNoData = await page.getByText(/暂无数据|no data/i).isVisible().catch(() => false);
    if (hasNoData) {
      // 如果没有数据，先创建一个设备
      const uniqueCode = `E2E-DETAIL-${Date.now()}`;
      await page.getByRole('button', { name: /新增|创建|create/i }).first().click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      await page.getByPlaceholder(/设备编码|devicecode/i).fill(uniqueCode);
      await page.getByPlaceholder(/设备名称|name/i).fill('E2E详情测试设备');
      await page.getByRole('group').getByRole('combobox').nth(0).click();
      await page.getByRole('option', { name: 'pump' }).click();
      await page.getByRole('dialog').getByRole('button', { name: /保存|save/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
      await page.waitForLoadState('networkidle');
    }

    // 点击第一行设备记录跳转到详情页（行可点击）
    const firstRow = page.getByRole('row').nth(1); // 跳过表头行
    await firstRow.click();

    // 验证跳转到设备详情页（URL 包含 /devices/ 和 UUID）
    await page.waitForURL('**/devices/**', { timeout: 5000 });
    await expect(page).toHaveURL(/\/devices\/[0-9a-f-]+/);

    // 验证详情页关键元素可见：设备名称标题、返回按钮
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button').first()).toBeVisible();
  });

  /** 测试用例：编辑设备（修改名称） */
  test('编辑设备（修改名称）', async ({ page }) => {
    await page.goto(`${BASE_URL}/devices`);
    await page.waitForLoadState('networkidle');

    // 先创建一个设备用于编辑测试
    const uniqueCode = `E2E-EDIT-${Date.now()}`;
    await page.getByRole('button', { name: /新增|创建|create/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/设备编码|devicecode/i).fill(uniqueCode);
    await page.getByPlaceholder(/设备名称|name/i).fill('E2E编辑前名称');
    await page.getByRole('group').getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: 'pump' }).click();
    await page.getByRole('dialog').getByRole('button', { name: /保存|save/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // 通过搜索定位到刚创建的设备
    await page.getByPlaceholder(/搜索|search/i).fill(uniqueCode);
    await expect(page.getByText('E2E编辑前名称')).toBeVisible({ timeout: 5000 });

    // 点击编辑按钮（铅笔图标按钮，在操作列中）
    await page.getByRole('row').nth(1).getByRole('button', { name: '' }).nth(1).click();

    // 等待编辑对话框出现
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    // 清空并修改设备名称
    const nameInput = page.getByRole('dialog').getByPlaceholder(/设备名称|name/i);
    await nameInput.clear();
    await nameInput.fill('E2E编辑后名称');

    // 提交修改
    await page.getByRole('dialog').getByRole('button', { name: /保存|save/i }).click();

    // 等待对话框关闭
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });

    // 验证修改后的名称出现在列表中
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('E2E编辑后名称')).toBeVisible({ timeout: 5000 });
  });

  /** 测试用例：删除设备（确认删除） */
  test('删除设备（确认删除）', async ({ page }) => {
    await page.goto(`${BASE_URL}/devices`);
    await page.waitForLoadState('networkidle');

    // 先创建一个设备用于删除测试
    const uniqueCode = `E2E-DEL-${Date.now()}`;
    await page.getByRole('button', { name: /新增|创建|create/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/设备编码|devicecode/i).fill(uniqueCode);
    await page.getByPlaceholder(/设备名称|name/i).fill('E2E待删除设备');
    await page.getByRole('group').getByRole('combobox').nth(0).click();
    await page.getByRole('option', { name: 'pump' }).click();
    await page.getByRole('dialog').getByRole('button', { name: /保存|save/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // 通过搜索定位到刚创建的设备
    await page.getByPlaceholder(/搜索|search/i).fill(uniqueCode);
    await expect(page.getByText('E2E待删除设备')).toBeVisible({ timeout: 5000 });

    // 监听 confirm 对话框并自动确认
    page.on('dialog', (dialog) => {
      expect(dialog.type()).toBe('confirm');
      dialog.accept();
    });

    // 点击删除按钮（垃圾桶图标按钮，在操作列中最后一个按钮）
    await page.getByRole('row').nth(1).getByRole('button', { name: '' }).nth(2).click();

    // 等待列表刷新
    await page.waitForLoadState('networkidle');

    // 验证设备已被删除（列表中不再出现该设备名称）
    await expect(page.getByText('E2E待删除设备')).not.toBeVisible({ timeout: 5000 });
  });
});
