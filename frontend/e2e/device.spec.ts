import { test, expect } from '@playwright/test';
import { login, navigateTo } from './helpers';

test.describe('设备管理流程', () => {
  // 重试一次，应对连续运行时的时序问题
  test.describe.configure({ retries: 1 });

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  /** 测试用例：导航到设备列表页并确认页面加载 */
  test('导航到设备列表页并确认页面加载', async ({ page }) => {
    await navigateTo(page, /设备/i, /devices/);

    await expect(page).toHaveURL(/devices/);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });

    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasNoData = await page.getByText(/暂无数据|no data/i).isVisible().catch(() => false);
    expect(hasTable || hasNoData).toBeTruthy();
  });

  /** 辅助函数：通过设备表单创建设备 */
  async function createDevice(page: import('@playwright/test').Page, code: string, name: string) {
    await page.getByRole('button', { name: /新建/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    const dialog = page.getByRole('dialog');
    await dialog.getByPlaceholder(/设备编码/i).fill(code);
    await dialog.getByPlaceholder(/设备名称/i).fill(name);

    // 设备类型：直接点击 dialog 内的 combobox（无 group 包裹）
    await dialog.getByRole('combobox').click();
    await page.getByRole('option', { name: /pump/i }).click();

    await dialog.getByPlaceholder(/型号/i).fill('E2E-Model');
    await dialog.getByRole('button', { name: /保存/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
  }

  /** 测试用例：创建新设备 */
  test('创建新设备', async ({ page }) => {
    await navigateTo(page, /设备/i, /devices/);
    await createDevice(page, `E2E-DEV-${Date.now()}`, 'E2E测试设备');
  });

  /** 测试用例：搜索设备并验证出现在列表中 */
  test('搜索设备并验证出现在列表中', async ({ page }) => {
    await navigateTo(page, /设备/i, /devices/);

    const uniqueCode = `E2E-SEARCH-${Date.now()}`;
    await createDevice(page, uniqueCode, 'E2E搜索测试设备');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/搜索/i).fill(uniqueCode);
    await expect(page.getByText(uniqueCode)).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('E2E搜索测试设备')).toBeVisible();
  });

  /** 测试用例：查看设备详情 */
  test('查看设备详情', async ({ page }) => {
    await navigateTo(page, /设备/i, /devices/);
    // 始终创建一个新设备，确保有确定的数据可点击
    const code = `E2E-DETAIL-${Date.now()}`;
    await createDevice(page, code, 'E2E详情测试设备');
    await page.waitForLoadState('networkidle');

    // 搜索新创建的设备，精确定位目标行
    const searchInput = page.getByPlaceholder(/搜索/i);
    await searchInput.clear();
    await searchInput.fill(code);
    await expect(page.getByText(code)).toBeVisible({ timeout: 5000 });

    const firstRow = page.getByRole('row').nth(1);
    await firstRow.click();
    await page.waitForURL('**/devices/**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/devices\/[0-9a-f-]+/);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 5000 });
  });

  /** 测试用例：编辑设备（修改名称） */
  test('编辑设备（修改名称）', async ({ page }) => {
    await navigateTo(page, /设备/i, /devices/);

    const uniqueCode = `E2E-EDIT-${Date.now()}`;
    await createDevice(page, uniqueCode, 'E2E编辑前名称');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/搜索/i).fill(uniqueCode);
    await expect(page.getByText('E2E编辑前名称')).toBeVisible({ timeout: 5000 });

    await page.getByRole('row').nth(1).getByRole('button', { name: '' }).nth(1).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });

    const nameInput = page.getByRole('dialog').getByPlaceholder(/设备名称/i);
    await nameInput.clear();
    await nameInput.fill('E2E编辑后名称');
    await page.getByRole('dialog').getByRole('button', { name: /保存/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('E2E编辑后名称')).toBeVisible({ timeout: 5000 });
  });

  /** 测试用例：删除设备（确认删除） */
  test('删除设备（确认删除）', async ({ page }) => {
    await navigateTo(page, /设备/i, /devices/);

    const uniqueCode = `E2E-DEL-${Date.now()}`;
    await createDevice(page, uniqueCode, 'E2E待删除设备');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/搜索/i).fill(uniqueCode);
    await expect(page.getByText('E2E待删除设备')).toBeVisible({ timeout: 5000 });

    page.on('dialog', (dialog) => {
      expect(dialog.type()).toBe('confirm');
      dialog.accept();
    });

    await page.getByRole('row').nth(1).getByRole('button', { name: '' }).nth(2).click();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('E2E待删除设备')).not.toBeVisible({ timeout: 5000 });
  });
});
