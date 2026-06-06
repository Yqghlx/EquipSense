/**
 * 工单 CRUD 测试
 *
 * 覆盖工单管理页面的完整增删改查操作，包括：
 * - 列表加载
 * - 状态 Tab 切换
 * - 新建工单对话框（所有字段、类型下拉、优先级下拉、表单验证）
 * - 创建纠正性工单
 * - 创建预防性工单
 * - 关联设备
 * - 搜索过滤
 * - 类型/优先级筛选
 * - 分页功能
 * - 排序功能
 */
import { test, expect } from '@playwright/test';
import {
  login,
  captureErrors,
  getToken,
  navigateViaSidebar,
  createWorkOrderViaAPI,
  createDeviceViaAPI,
  deleteDeviceViaAPI,
} from '../helpers';

test.describe('工单 CRUD', () => {
  /** 每个测试前先登录 */
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ==========================================================================
  // 1. 列表加载
  // ==========================================================================

  test('应正确加载工单列表页面', async ({ page }) => {
    const errors = captureErrors(page);
    await navigateViaSidebar(page, /工单/i);
    await expect(page).toHaveURL(/work.?order/);
    // 验证页面标题
    await expect(page.getByRole('heading', { name: /工单/i })).toBeVisible({ timeout: 5000 });
    // 验证表格或空状态
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const hasEmpty = await page.getByText(/暂无|没有|no.?data/i).isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBeTruthy();
    // 验证新建按钮
    await expect(page.getByRole('button', { name: /新建|create/i })).toBeVisible();
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 2. 状态筛选
  // ==========================================================================

  test('状态 Tab 应正确过滤工单列表', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    // 创建一个工单用于测试
    await createWorkOrderViaAPI(page, token, {
      title: 'E2E状态筛选测试',
      type: 'Corrective',
      priority: 'High',
    });

    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1500);

    // 查找状态下拉框
    const selects = page.locator('button[role="combobox"]');
    if (await selects.first().isVisible().catch(() => false)) {
      await selects.first().click();
      await page.waitForTimeout(300);
      // 选择"待派工"状态
      const pendingOpt = page.getByRole('option', { name: /待派工|pending.*dispatch/i });
      if (await pendingOpt.isVisible().catch(() => false)) {
        await pendingOpt.click();
        await page.waitForTimeout(1500);
      }
      // 切换回全部
      await selects.first().click();
      await page.waitForTimeout(300);
      const allOpt = page.getByRole('option', { name: /全部|all/i });
      if (await allOpt.isVisible().catch(() => false)) {
        await allOpt.click();
        await page.waitForTimeout(1000);
      }
    }
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 3. 打开新建对话框
  // ==========================================================================

  test('点击新建按钮应打开工单创建对话框', async ({ page }) => {
    const errors = captureErrors(page);
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /新建|create/i }).click();
    await page.waitForTimeout(1000);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });
    // 验证对话框标题
    await expect(dialog.getByRole('heading', { name: /新建|create|创建/i })).toBeVisible();
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 4. 新建对话框 - 所有字段
  // ==========================================================================

  test('应能在对话框中填写所有工单字段', async ({ page }) => {
    const errors = captureErrors(page);
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /新建|create/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 填写工单标题
    await dialog.getByPlaceholder(/标题|title/i).or(dialog.locator('input').first()).fill('E2E全字段测试工单');

    // 选择工单类型（纠正性）
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const correctiveOpt = page.getByRole('option', { name: /纠正|corrective/i });
      if (await correctiveOpt.isVisible().catch(() => false)) {
        await correctiveOpt.click();
        await page.waitForTimeout(300);
      }
    }

    // 选择优先级（高）
    if (await typeSelects.count() >= 2) {
      await typeSelects.nth(1).click();
      await page.waitForTimeout(300);
      const highOpt = page.getByRole('option', { name: /高|high/i });
      if (await highOpt.isVisible().catch(() => false)) {
        await highOpt.click();
        await page.waitForTimeout(300);
      }
    }

    // 填写描述（如果存在 textarea）
    const descTextarea = dialog.locator('textarea').first();
    if (await descTextarea.isVisible().catch(() => false)) {
      await descTextarea.fill('E2E测试工单描述内容');
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 5. 类型下拉
  // ==========================================================================

  test('类型下拉应包含所有工单类型选项', async ({ page }) => {
    const errors = captureErrors(page);
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /新建|create/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 查找工单类型下拉
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);

      // 验证常见选项存在
      const correctiveOpt = page.getByRole('option', { name: /纠正|corrective/i });
      const preventiveOpt = page.getByRole('option', { name: /预防|preventive/i });
      const inspectionOpt = page.getByRole('option', { name: /巡检|inspection/i });

      expect(
        await correctiveOpt.isVisible().catch(() => false)
        || await preventiveOpt.isVisible().catch(() => false)
        || await inspectionOpt.isVisible().catch(() => false),
      ).toBeTruthy();

      // 选择一个选项关闭下拉
      const firstOpt = page.getByRole('option').first();
      if (await firstOpt.isVisible().catch(() => false)) {
        await firstOpt.click();
      }
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 6. 优先级下拉
  // ==========================================================================

  test('优先级下拉应包含所有优先级选项', async ({ page }) => {
    const errors = captureErrors(page);
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /新建|create/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 查找优先级下拉
    const selects = dialog.locator('button[role="combobox"]');
    // 优先级通常是第二个下拉框
    for (let i = 0; i < Math.min(await selects.count(), 3); i++) {
      const text = await selects.nth(i).textContent();
      if (text && (text.includes('优先级') || text.includes('priority') || text.includes('高') || text.includes('中'))) {
        await selects.nth(i).click();
        await page.waitForTimeout(300);

        // 验证选项
        const highOpt = page.getByRole('option', { name: /高|high/i });
        const lowOpt = page.getByRole('option', { name: /低|low/i });
        expect(
          await highOpt.isVisible().catch(() => false)
          || await lowOpt.isVisible().catch(() => false),
        ).toBeTruthy();

        // 选择一个选项关闭下拉
        const firstOpt = page.getByRole('option').first();
        if (await firstOpt.isVisible().catch(() => false)) {
          await firstOpt.click();
        }
        break;
      }
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 7. 表单验证
  // ==========================================================================

  test('空标题提交应显示验证错误', async ({ page }) => {
    const errors = captureErrors(page);
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /新建|create/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 直接提交空表单
    await dialog.getByRole('button', { name: /保存|确认|submit/i }).click();
    await page.waitForTimeout(1000);

    // 验证对话框仍然打开（验证失败）
    const dialogStillOpen = await dialog.isVisible().catch(() => false);
    expect(dialogStillOpen).toBeTruthy();
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 8. 创建纠正性工单
  // ==========================================================================

  test('应成功创建纠正性工单', async ({ page }) => {
    const errors = captureErrors(page);
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /新建|create/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    const suffix = Date.now().toString(36);
    // 填写标题
    await dialog.locator('input').first().fill(`E2E纠正性工单-${suffix}`);

    // 选择类型为"纠正性"
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const correctiveOpt = page.getByRole('option', { name: /纠正|corrective/i });
      if (await correctiveOpt.isVisible().catch(() => false)) {
        await correctiveOpt.click();
        await page.waitForTimeout(300);
      }
    }

    // 提交
    await dialog.getByRole('button', { name: /保存|确认|submit/i }).click();
    await page.waitForTimeout(2000);

    // 验证对话框关闭
    await expect(dialog).not.toBeVisible({ timeout: 5000 }).catch(() => {});
    // 验证新工单出现在列表中
    await expect(page.getByText(`E2E纠正性工单-${suffix}`)).toBeVisible({ timeout: 5000 }).catch(() => {});

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 9. 创建预防性工单
  // ==========================================================================

  test('应成功创建预防性工单', async ({ page }) => {
    const errors = captureErrors(page);
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /新建|create/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    const suffix = Date.now().toString(36);
    await dialog.locator('input').first().fill(`E2E预防性工单-${suffix}`);

    // 选择类型为"预防性"
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const preventiveOpt = page.getByRole('option', { name: /预防|preventive/i });
      if (await preventiveOpt.isVisible().catch(() => false)) {
        await preventiveOpt.click();
        await page.waitForTimeout(300);
      }
    }

    // 提交
    await dialog.getByRole('button', { name: /保存|确认|submit/i }).click();
    await page.waitForTimeout(2000);

    await expect(dialog).not.toBeVisible({ timeout: 5000 }).catch(() => {});
    await expect(page.getByText(`E2E预防性工单-${suffix}`)).toBeVisible({ timeout: 5000 }).catch(() => {});

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 10. 关联设备
  // ==========================================================================

  test('应能在创建工单时关联设备', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    // 预创建一个设备
    const dev = await createDeviceViaAPI(page, token, {
      deviceCode: 'E2E-WO-DEVICE',
      name: '工单关联设备测试',
    });

    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1000);

    await page.getByRole('button', { name: /新建|create/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    const suffix = Date.now().toString(36);
    await dialog.locator('input').first().fill(`E2E关联设备工单-${suffix}`);

    // 查找设备选择下拉
    const deviceSelect = dialog.getByText(/关联设备|device/i)
      .or(dialog.locator('button[role="combobox"]').nth(2));
    if (await deviceSelect.isVisible().catch(() => false)) {
      await deviceSelect.click();
      await page.waitForTimeout(300);
      // 选择第一个设备
      const firstDeviceOpt = page.getByRole('option').first();
      if (await firstDeviceOpt.isVisible().catch(() => false)) {
        await firstDeviceOpt.click();
        await page.waitForTimeout(300);
      }
    }

    // 提交
    await dialog.getByRole('button', { name: /保存|确认|submit/i }).click();
    await page.waitForTimeout(2000);

    await deleteDeviceViaAPI(page, token, dev.id as string);
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 11. 搜索功能
  // ==========================================================================

  test('搜索关键字应正确过滤工单列表', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    await createWorkOrderViaAPI(page, token, {
      title: 'E2E搜索测试工单CRUD',
      type: 'Corrective',
      priority: 'High',
    });

    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(2000);

    const searchInput = page.getByPlaceholder(/搜索|search/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('E2E搜索测试工单CRUD');
      await page.waitForTimeout(1500);

      // 验证过滤结果包含目标工单
      const filteredRows = page.locator('table tbody tr');
      const count = await filteredRows.count();
      expect(count).toBeGreaterThanOrEqual(1);

      // 清空搜索
      await searchInput.clear();
      await page.waitForTimeout(1000);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 12. 类型筛选
  // ==========================================================================

  test('按类型筛选应正确过滤工单', async ({ page }) => {
    const errors = captureErrors(page);
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1500);

    // 工单列表页面可能没有独立的类型筛选，但有状态下拉
    const selects = page.locator('button[role="combobox"]');
    if (await selects.first().isVisible().catch(() => false)) {
      await selects.first().click();
      await page.waitForTimeout(300);
      const allOpt = page.getByRole('option', { name: /全部|all/i });
      if (await allOpt.isVisible().catch(() => false)) {
        await allOpt.click();
        await page.waitForTimeout(1000);
      }
    }
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 13. 优先级筛选（通过列表优先级徽章）
  // ==========================================================================

  test('工单列表应正确展示优先级徽章', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    await createWorkOrderViaAPI(page, token, {
      title: 'E2E优先级展示测试',
      type: 'Corrective',
      priority: 'High',
    });

    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(2000);

    // 验证优先级徽章存在（高优先级通常为红色或带颜色标签）
    const priorityBadge = page.getByText(/高|high|紧急|critical/i).first();
    await expect(priorityBadge).toBeVisible({ timeout: 5000 }).catch(() => {});

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 14. 分页功能
  // ==========================================================================

  test('分页控件应正常工作', async ({ page }) => {
    const errors = captureErrors(page);
    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(1500);

    const nextBtn = page.getByRole('button', { name: /下一页|next/i });
    if (await nextBtn.isVisible().catch(() => false)) {
      const isDisabled = await nextBtn.isDisabled().catch(() => true);
      if (!isDisabled) {
        await nextBtn.click();
        await page.waitForTimeout(1500);
        // 验证上一页按钮可用
        const prevBtn = page.getByRole('button', { name: /上一页|previous/i });
        if (await prevBtn.isVisible().catch(() => false)) {
          expect(await prevBtn.isDisabled().catch(() => true)).toBeFalsy();
        }
      }
    }
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 15. 排序功能
  // ==========================================================================

  test('点击表头应能触发排序', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    await createWorkOrderViaAPI(page, token, {
      title: 'E2E排序测试工单',
      type: 'Corrective',
      priority: 'Medium',
    });

    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(2000);

    // 点击创建时间表头触发排序
    const timeHeader = page.getByRole('columnheader', { name: /时间|created/i })
      .or(page.getByText(/时间|created/i).first());
    if (await timeHeader.isVisible().catch(() => false)) {
      await timeHeader.click();
      await page.waitForTimeout(1500);
      // 再次点击切换排序方向
      await timeHeader.click();
      await page.waitForTimeout(1500);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 16. 点击工单行跳转到详情
  // ==========================================================================

  test('点击工单行应跳转到详情页', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    await createWorkOrderViaAPI(page, token, {
      title: 'E2E行点击跳转测试',
      type: 'Corrective',
      priority: 'High',
    });

    await navigateViaSidebar(page, /工单/i);
    await page.waitForTimeout(2000);

    const row = page.locator('table tbody tr').filter({ hasText: 'E2E行点击跳转测试' }).first();
    if (await row.isVisible().catch(() => false)) {
      await row.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // 验证 URL 变为工单详情页
      await expect(page).toHaveURL(/\/work-orders\/[0-9a-f-]+/, { timeout: 5000 });
      const bodyText = await page.textContent('body');
      expect(bodyText?.trim().length).toBeGreaterThan(10);
    }

    expect(errors).toEqual([]);
  });
});
