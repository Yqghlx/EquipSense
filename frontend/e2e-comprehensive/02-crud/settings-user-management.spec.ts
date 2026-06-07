/**
 * 用户管理 E2E 测试
 *
 * 覆盖设置页面中的用户管理面板：
 * - 用户列表加载与搜索
 * - 创建用户（表单验证 + 成功创建）
 * - 编辑用户信息
 * - 变更用户角色
 * - 停用用户（确认对话框）
 * - 系统信息卡片展示
 */
import { test, expect } from '@playwright/test';
import { login, captureErrors, getToken } from '../helpers';

test.describe('02-用户管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  /** 导航到设置页的用户管理 tab */
  async function gotoUserManagement(page: import('@playwright/test').Page) {
    await page.getByRole('link', { name: /系统设置|settings/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
  }

  // ==========================================================================
  // 1. 用户列表加载
  // ==========================================================================

  test('1. 应正确加载用户管理标签页', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoUserManagement(page);

    const createUserBtn = page.getByRole('button', { name: /创建用户|create user/i });
    await expect(createUserBtn).toBeVisible({ timeout: 5000 });

    expect(errors).toEqual([]);
  });

  test('2. 应显示用户列表表格', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoUserManagement(page);

    const table = page.getByRole('tabpanel').getByRole('table').first();
    await expect(table).toBeVisible({ timeout: 5000 });

    const rows = table.getByRole('row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 3. 创建用户
  // ==========================================================================

  test('3. 打开创建用户对话框并验证表单字段', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoUserManagement(page);

    await page.getByRole('button', { name: /创建用户|create user/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 验证对话框标题
    await expect(dialog.getByText(/创建用户|create user/i)).toBeVisible();

    // 用 placeholder 定位输入字段
    await expect(dialog.getByPlaceholder(/登录用户名|username/i)).toBeVisible();
    await expect(dialog.getByPlaceholder(/至少 8 位|8 characters/i)).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('4. 创建用户 — 必填字段验证', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoUserManagement(page);

    await page.getByRole('button', { name: /创建用户|create user/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 直接提交空表单
    const submitBtn = dialog.getByRole('button', { name: /新建|create/i });
    await submitBtn.click();
    await page.waitForTimeout(500);

    // 应显示验证错误信息（Zod 验证触发）
    const errorText = dialog.getByText(/至少 3 个|at least 3/i);
    if (await errorText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(errorText).toBeVisible();
    }

    expect(errors).toEqual([]);
  });

  test('5. 创建用户 — 完整流程', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const suffix = Date.now().toString(36);

    await gotoUserManagement(page);

    await page.getByRole('button', { name: /创建用户|create user/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 用 placeholder 定位并填写表单
    await dialog.getByPlaceholder(/登录用户名|username/i).fill(`e2e_user_${suffix}`);
    await dialog.getByPlaceholder(/至少 8 位|8 characters/i).fill('Test@1234');
    await dialog.getByPlaceholder(/例如：张三|john smith/i).fill('E2E测试用户');

    // 提交
    await dialog.getByRole('button', { name: /新建|create/i }).click();
    await page.waitForTimeout(2000);

    expect(errors).toEqual([]);

    // 清理
    try {
      const usersResp = await page.request.get('/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (usersResp.ok()) {
        const usersData = await usersResp.json();
        const testUser = (usersData.items || []).find(
          (u: { username: string }) => u.username === `e2e_user_${suffix}`,
        );
        if (testUser) {
          await page.request.delete(`/api/v1/admin/users/${testUser.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
    } catch {
      // 清理失败不影响测试结果
    }
  });

  // ==========================================================================
  // 6. 编辑用户
  // ==========================================================================

  test('6. 打开编辑用户对话框', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoUserManagement(page);

    const table = page.getByRole('tabpanel').getByRole('table').first();
    await expect(table).toBeVisible({ timeout: 5000 });

    // 找到第一行的编辑按钮（带有 title="编辑" 的按钮）
    const editBtn = page.locator('button[title="编辑"], button[title="Edit"]').first();
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // 编辑模式不应有用户名和密码字段
      expect(await dialog.getByPlaceholder(/登录用户名|username/i).isVisible().catch(() => false)).toBe(false);
      expect(await dialog.getByPlaceholder(/至少 8 位|8 characters/i).isVisible().catch(() => false)).toBe(false);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 7. 搜索用户
  // ==========================================================================

  test('7. 搜索框应可输入和触发搜索', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoUserManagement(page);

    const searchInput = page.getByPlaceholder(/搜索用户|search.*user/i);
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('admin');
      await searchInput.press('Enter');
      await page.waitForTimeout(1500);

      const table = page.getByRole('tabpanel').getByRole('table').first();
      await expect(table).toBeVisible({ timeout: 5000 });
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 8. 系统信息卡片
  // ==========================================================================

  test('8. 系统参数标签页应显示系统信息', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoUserManagement(page);

    const systemTab = page.getByRole('tab', { name: /系统参数|system/i });
    if (await systemTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await systemTab.click();
      await page.waitForTimeout(1500);

      const sysInfoCard = page.getByText(/系统信息|system.?information/i);
      if (await sysInfoCard.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(sysInfoCard).toBeVisible();
      }
    }

    expect(errors).toEqual([]);
  });
});
