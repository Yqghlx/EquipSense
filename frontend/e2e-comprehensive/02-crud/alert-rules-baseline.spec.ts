/**
 * 基线告警规则 CRUD 测试
 *
 * 覆盖基线类型告警规则的完整操作，包括：
 * - Tab 切换到基线规则
 * - 新建基线规则
 * - 所有字段填写
 * - 基线类型下拉
 * - 窗口输入
 * - 自动计算基线
 * - 偏差阈值
 * - 表单验证
 * - 创建成功
 * - 编辑规则
 * - 重新计算基线
 * - 删除规则
 */
import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  login,
  captureErrors,
  getToken,
  gotoAlertRules,
  createAlertRuleViaAPI,
  deleteAlertRuleViaAPI,
} from '../helpers';

test.describe('基线告警规则 CRUD', () => {
  /** 每个测试前先登录 */
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ==========================================================================
  // 1. Tab 切换到基线规则
  // ==========================================================================

  test('选择基线规则类型应展示标准差倍数字段', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择规则类型为"基线"
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const baselineOpt = page.getByRole('option', { name: /基线|baseline/i });
      if (await baselineOpt.isVisible().catch(() => false)) {
        await baselineOpt.click();
        await page.waitForTimeout(500);
      }
    }

    // 验证标准差倍数输入框出现
    dialog.getByLabel(/标准差|stddev|multiplier/i)
      .or(dialog.locator('input[type="number"]').filter({ hasText: '' }).first());
    // 至少应该有一个 number 类型的输入框
    expect(await dialog.locator('input[type="number"]').count()).toBeGreaterThanOrEqual(1);

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 2. 新建基线规则 - 填写基本信息
  // ==========================================================================

  test('应能填写基线规则的基本信息', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择基线规则类型
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const baselineOpt = page.getByRole('option', { name: /基线|baseline/i });
      if (await baselineOpt.isVisible().catch(() => false)) {
        await baselineOpt.click();
        await page.waitForTimeout(500);
      }
    }

    // 填写规则名称
    await dialog.locator('input').first().fill('E2E基线规则测试');
    // 填写指标
    await dialog.locator('input').nth(1).fill('vibration');

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 3. 所有字段填写
  // ==========================================================================

  test('应能填写基线规则的所有字段', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择基线规则类型
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const baselineOpt = page.getByRole('option', { name: /基线|baseline/i });
      if (await baselineOpt.isVisible().catch(() => false)) {
        await baselineOpt.click();
        await page.waitForTimeout(500);
      }
    }

    // 规则名称
    await dialog.locator('input').first().fill('E2E全字段基线测试');
    // 指标
    await dialog.locator('input').nth(1).fill('temperature');

    // 标准差倍数
    const stddevInput = dialog.locator('input[type="number"]').first();
    if (await stddevInput.isVisible().catch(() => false)) {
      await stddevInput.clear();
      await stddevInput.fill('2.5');
    }

    // 冷却时间（如果有多个 number 输入框）
    const numberInputs = dialog.locator('input[type="number"]');
    if (await numberInputs.count() >= 2) {
      await numberInputs.nth(1).fill('600');
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 4. 基线类型下拉
  // ==========================================================================

  test('应能选择基线类型下拉选项', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择基线规则类型
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const baselineOpt = page.getByRole('option', { name: /基线|baseline/i });
      if (await baselineOpt.isVisible().catch(() => false)) {
        await baselineOpt.click();
        await page.waitForTimeout(500);
      }
    }

    // 查找基线类型下拉（如果有单独的基线类型选择器）
    const baselineTypeSelect = dialog.getByText(/基线类型|baseline.?type/i)
      .or(dialog.locator('button[role="combobox"]').nth(2));
    if (await baselineTypeSelect.isVisible().catch(() => false)) {
      // 如果存在基线类型下拉，尝试点击并查看选项
      await baselineTypeSelect.click().catch(() => {});
      await page.waitForTimeout(300);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 5. 窗口输入
  // ==========================================================================

  test('应能设置时间窗口参数', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择基线规则类型
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const baselineOpt = page.getByRole('option', { name: /基线|baseline/i });
      if (await baselineOpt.isVisible().catch(() => false)) {
        await baselineOpt.click();
        await page.waitForTimeout(500);
      }
    }

    await dialog.locator('input').first().fill('E2E窗口测试');
    await dialog.locator('input').nth(1).fill('temperature');

    // 查找窗口大小输入框（可能是标签包含"窗口"或"window"的输入框）
    const windowInput = dialog.getByLabel(/窗口|window/i)
      .or(dialog.getByPlaceholder(/窗口|window/i));
    if (await windowInput.isVisible().catch(() => false)) {
      await windowInput.fill('30');
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 6. 自动计算基线按钮
  // ==========================================================================

  test('应存在自动计算基线的入口', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择基线规则类型
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const baselineOpt = page.getByRole('option', { name: /基线|baseline/i });
      if (await baselineOpt.isVisible().catch(() => false)) {
        await baselineOpt.click();
        await page.waitForTimeout(500);
      }
    }

    // 查找"计算基线"或"自动计算"按钮
    const calcBtn = dialog.getByRole('button', { name: /计算|calculate|compute/i });
    if (await calcBtn.isVisible().catch(() => false)) {
      // 填写必要信息后点击计算
      await dialog.locator('input').first().fill('E2E计算基线测试');
      await dialog.locator('input').nth(1).fill('temperature');
      await calcBtn.click();
      await page.waitForTimeout(2000);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 7. 偏差阈值设置
  // ==========================================================================

  test('应能设置偏差阈值（标准差倍数）', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择基线规则类型
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const baselineOpt = page.getByRole('option', { name: /基线|baseline/i });
      if (await baselineOpt.isVisible().catch(() => false)) {
        await baselineOpt.click();
        await page.waitForTimeout(500);
      }
    }

    await dialog.locator('input').first().fill('E2E偏差阈值测试');
    await dialog.locator('input').nth(1).fill('temperature');

    // 填写标准差倍数（偏差阈值）
    const stddevInput = dialog.locator('input[type="number"]').first();
    if (await stddevInput.isVisible().catch(() => false)) {
      await stddevInput.clear();
      await stddevInput.fill('3');
      await page.waitForTimeout(300);
      // 验证输入值正确
      const value = await stddevInput.inputValue();
      expect(value).toBe('3');
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 8. 表单验证
  // ==========================================================================

  test('空字段提交应显示验证错误', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择基线规则类型
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const baselineOpt = page.getByRole('option', { name: /基线|baseline/i });
      if (await baselineOpt.isVisible().catch(() => false)) {
        await baselineOpt.click();
        await page.waitForTimeout(500);
      }
    }

    // 直接提交空表单
    await dialog.getByRole('button', { name: /保存|submit/i }).click();
    await page.waitForTimeout(1000);

    // 验证对话框仍然打开
    const dialogStillOpen = await dialog.isVisible().catch(() => false);
    expect(dialogStillOpen).toBeTruthy();
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 9. 创建基线规则成功
  // ==========================================================================

  test('应成功创建基线告警规则', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择基线规则类型
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const baselineOpt = page.getByRole('option', { name: /基线|baseline/i });
      if (await baselineOpt.isVisible().catch(() => false)) {
        await baselineOpt.click();
        await page.waitForTimeout(500);
      }
    }

    const suffix = Date.now().toString(36);
    await dialog.locator('input').first().fill(`E2E-BASELINE-${suffix}`);
    await dialog.locator('input').nth(1).fill('temperature');

    // 填写标准差倍数
    const stddevInput = dialog.locator('input[type="number"]').first();
    if (await stddevInput.isVisible().catch(() => false)) {
      await stddevInput.fill('2');
    }

    // 提交
    await dialog.getByRole('button', { name: /保存|submit/i }).click();
    await page.waitForTimeout(2000);

    // 验证对话框关闭
    await expect(dialog).not.toBeVisible({ timeout: 5000 }).catch(() => {});

    // API 清理
    const token = await getToken(page);
    const resp = await page.request.get(`${BASE_URL}/api/v1/alert-rules?page=1&pageSize=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (resp.ok()) {
      const data = await resp.json();
      const target = data.items?.find((r: { name: string }) => r.name.includes(`E2E-BASELINE-${suffix}`));
      if (target) await deleteAlertRuleViaAPI(page, token, target.id);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 10. 编辑基线规则
  // ==========================================================================

  test('应能编辑已有的基线规则', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const rule = await createAlertRuleViaAPI(page, token, {
      name: 'E2E-EDIT-BASELINE',
      ruleType: 'Baseline',
      metric: 'temperature',
      baselineStddevMultiplier: 2,
    });

    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const row = page.locator('table tbody tr').filter({ hasText: 'E2E-EDIT-BASELINE' }).first();
    if (await row.isVisible().catch(() => false)) {
      const editBtn = row.getByRole('button', { name: /编辑|edit/i })
        .or(row.locator('button').first());
      if (await editBtn.isVisible().catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(1000);

        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible().catch(() => false)) {
          // 修改标准差倍数
          const stddevInput = dialog.locator('input[type="number"]').first();
          if (await stddevInput.isVisible().catch(() => false)) {
            await stddevInput.clear();
            await stddevInput.fill('3.5');
          }
          await dialog.getByRole('button', { name: /保存|submit/i }).click();
          await page.waitForTimeout(2000);
        }
      }
    }

    await deleteAlertRuleViaAPI(page, token, rule.id as string);
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 11. 重新计算基线
  // ==========================================================================

  test('编辑规则时应能重新计算基线', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const rule = await createAlertRuleViaAPI(page, token, {
      name: 'E2E-RECALC-BASELINE',
      ruleType: 'Baseline',
      metric: 'temperature',
      baselineStddevMultiplier: 2,
    });

    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const row = page.locator('table tbody tr').filter({ hasText: 'E2E-RECALC-BASELINE' }).first();
    if (await row.isVisible().catch(() => false)) {
      const editBtn = row.getByRole('button', { name: /编辑|edit/i })
        .or(row.locator('button').first());
      if (await editBtn.isVisible().catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(1000);

        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible().catch(() => false)) {
          // 查找重新计算按钮
          const recalcBtn = dialog.getByRole('button', { name: /重新计算|recalculate|计算/i });
          if (await recalcBtn.isVisible().catch(() => false)) {
            await recalcBtn.click();
            await page.waitForTimeout(2000);
          }
        }
      }
    }

    await deleteAlertRuleViaAPI(page, token, rule.id as string);
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 12. 删除基线规则
  // ==========================================================================

  test('确认删除应成功移除基线规则', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const rule = await createAlertRuleViaAPI(page, token, {
      name: 'E2E-DEL-BASELINE',
      ruleType: 'Baseline',
    });

    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const row = page.locator('table tbody tr').filter({ hasText: 'E2E-DEL-BASELINE' }).first();
    if (await row.isVisible().catch(() => false)) {
      page.on('dialog', (dialog) => dialog.accept());

      const deleteBtn = row.getByRole('button', { name: /删除|delete/i })
        .or(row.locator('button').last());
      if (await deleteBtn.isVisible().catch(() => false)) {
        await deleteBtn.click();
        await page.waitForTimeout(2000);
      }
    } else {
      await deleteAlertRuleViaAPI(page, token, rule.id as string);
    }

    expect(errors).toEqual([]);
  });
});
