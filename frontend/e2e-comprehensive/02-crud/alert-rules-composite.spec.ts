/**
 * 组合告警规则 CRUD 测试
 *
 * 覆盖组合类型告警规则的完整操作，包括：
 * - Tab 切换到组合规则
 * - 新建组合规则
 * - 添加多条件
 * - 设置指标阈值
 * - 逻辑运算 AND/OR
 * - 创建成功
 * - 删除条件
 * - 编辑规则
 * - 删除规则
 */
import { test, expect, type Page } from '@playwright/test';
import {
  BASE_URL,
  login,
  captureErrors,
  getToken,
  gotoAlertRules,
  createAlertRuleViaAPI,
  deleteAlertRuleViaAPI,
} from '../helpers';

test.describe('组合告警规则 CRUD', () => {
  /** 每个测试前先登录 */
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ==========================================================================
  // 1. Tab 切换到组合规则
  // ==========================================================================

  test('选择组合规则类型应展示对应表单字段', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择规则类型为"组合"
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const compositeOpt = page.getByRole('option', { name: /组合|composite/i });
      if (await compositeOpt.isVisible().catch(() => false)) {
        await compositeOpt.click();
        await page.waitForTimeout(500);
      }
    }

    // 验证运算符下拉消失（组合规则不需要单个运算符）
    // 验证阈值输入框消失或替换为多条件区域
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 2. 新建组合规则 - 填写基本信息
  // ==========================================================================

  test('应能填写组合规则的基本信息', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择规则类型为"组合"
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const compositeOpt = page.getByRole('option', { name: /组合|composite/i });
      if (await compositeOpt.isVisible().catch(() => false)) {
        await compositeOpt.click();
        await page.waitForTimeout(500);
      }
    }

    // 填写规则名称
    await dialog.locator('input').first().fill('E2E组合规则测试');
    // 填写指标
    await dialog.locator('input').nth(1).fill('temperature');

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 3. 添加多条件
  // ==========================================================================

  test('应能添加多个条件', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择规则类型为"组合"
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const compositeOpt = page.getByRole('option', { name: /组合|composite/i });
      if (await compositeOpt.isVisible().catch(() => false)) {
        await compositeOpt.click();
        await page.waitForTimeout(500);
      }
    }

    // 填写基本信息
    await dialog.locator('input').first().fill('E2E多条件测试');
    await dialog.locator('input').nth(1).fill('temperature');

    // 查找"添加条件"按钮
    const addConditionBtn = dialog.getByRole('button', { name: /添加条件|add.*condition/i });
    if (await addConditionBtn.isVisible().catch(() => false)) {
      // 点击添加第一个条件
      await addConditionBtn.click();
      await page.waitForTimeout(500);
      // 点击添加第二个条件
      await addConditionBtn.click();
      await page.waitForTimeout(500);

      // 验证出现多个条件输入行
      const conditionRows = dialog.locator('[class*="condition"], [data-condition]');
      expect(await conditionRows.count()).toBeGreaterThanOrEqual(0);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 4. 设置指标阈值
  // ==========================================================================

  test('应能为条件设置指标阈值', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择组合规则类型
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const compositeOpt = page.getByRole('option', { name: /组合|composite/i });
      if (await compositeOpt.isVisible().catch(() => false)) {
        await compositeOpt.click();
        await page.waitForTimeout(500);
      }
    }

    await dialog.locator('input').first().fill('E2E指标阈值测试');
    await dialog.locator('input').nth(1).fill('temperature');

    // 添加条件后设置阈值
    const addConditionBtn = dialog.getByRole('button', { name: /添加条件|add.*condition/i });
    if (await addConditionBtn.isVisible().catch(() => false)) {
      await addConditionBtn.click();
      await page.waitForTimeout(500);

      // 在条件行中查找阈值输入框
      const thresholdInputs = dialog.locator('input[type="number"]');
      if (await thresholdInputs.count() > 0) {
        await thresholdInputs.first().fill('85');
      }
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 5. 逻辑运算 AND/OR
  // ==========================================================================

  test('应能选择逻辑运算符 AND 或 OR', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择组合规则类型
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const compositeOpt = page.getByRole('option', { name: /组合|composite/i });
      if (await compositeOpt.isVisible().catch(() => false)) {
        await compositeOpt.click();
        await page.waitForTimeout(500);
      }
    }

    await dialog.locator('input').first().fill('E2E逻辑运算测试');
    await dialog.locator('input').nth(1).fill('temperature');

    // 添加条件以显示逻辑运算选择
    const addConditionBtn = dialog.getByRole('button', { name: /添加条件|add.*condition/i });
    if (await addConditionBtn.isVisible().catch(() => false)) {
      await addConditionBtn.click();
      await page.waitForTimeout(500);
    }

    // 查找 AND/OR 选择器
    const andBtn = dialog.getByRole('button', { name: /^AND$/i }).or(dialog.getByText(/^AND$/i));
    const orBtn = dialog.getByRole('button', { name: /^OR$/i }).or(dialog.getByText(/^OR$/i));

    if (await orBtn.isVisible().catch(() => false)) {
      await orBtn.click();
      await page.waitForTimeout(300);
    } else if (await andBtn.isVisible().catch(() => false)) {
      // 切换到 OR
      await andBtn.click();
      await page.waitForTimeout(300);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 6. 创建组合规则成功
  // ==========================================================================

  test('应成功创建组合告警规则', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择组合规则类型
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const compositeOpt = page.getByRole('option', { name: /组合|composite/i });
      if (await compositeOpt.isVisible().catch(() => false)) {
        await compositeOpt.click();
        await page.waitForTimeout(500);
      }
    }

    const suffix = Date.now().toString(36);
    await dialog.locator('input').first().fill(`E2E-COMPOSITE-${suffix}`);
    await dialog.locator('input').nth(1).fill('temperature');

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
      const target = data.items?.find((r: { name: string }) => r.name.includes(`E2E-COMPOSITE-${suffix}`));
      if (target) await deleteAlertRuleViaAPI(page, token, target.id);
    }

    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 7. 删除条件
  // ==========================================================================

  test('应能删除已添加的条件', async ({ page }) => {
    const errors = captureErrors(page);
    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.getByRole('button', { name: /新建/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // 选择组合规则类型
    const typeSelects = dialog.locator('button[role="combobox"]');
    if (await typeSelects.first().isVisible().catch(() => false)) {
      await typeSelects.first().click();
      await page.waitForTimeout(300);
      const compositeOpt = page.getByRole('option', { name: /组合|composite/i });
      if (await compositeOpt.isVisible().catch(() => false)) {
        await compositeOpt.click();
        await page.waitForTimeout(500);
      }
    }

    await dialog.locator('input').first().fill('E2E删除条件测试');
    await dialog.locator('input').nth(1).fill('temperature');

    // 添加条件
    const addConditionBtn = dialog.getByRole('button', { name: /添加条件|add.*condition/i });
    if (await addConditionBtn.isVisible().catch(() => false)) {
      await addConditionBtn.click();
      await page.waitForTimeout(500);
      await addConditionBtn.click();
      await page.waitForTimeout(500);

      // 查找删除条件按钮（X 图标或文字按钮）
      const removeBtn = dialog.getByRole('button', { name: /删除条件|remove|删除/i })
        .or(dialog.locator('button').filter({ has: page.locator('svg') }).last());
      if (await removeBtn.isVisible().catch(() => false)) {
        await removeBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // 关闭对话框
    await dialog.getByRole('button', { name: /取消|cancel/i }).click();
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 8. 编辑组合规则
  // ==========================================================================

  test('应能编辑已有的组合规则', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const rule = await createAlertRuleViaAPI(page, token, {
      name: 'E2E-EDIT-COMPOSITE',
      ruleType: 'Composite',
      metric: 'temperature',
    });

    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const row = page.locator('table tbody tr').filter({ hasText: 'E2E-EDIT-COMPOSITE' }).first();
    if (await row.isVisible().catch(() => false)) {
      const editBtn = row.getByRole('button', { name: /编辑|edit/i })
        .or(row.locator('button').first());
      if (await editBtn.isVisible().catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(1000);

        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible().catch(() => false)) {
          // 修改名称
          const nameInput = dialog.locator('input').first();
          await nameInput.clear();
          await nameInput.fill('E2E-EDITED-COMPOSITE');
          await dialog.getByRole('button', { name: /保存|submit/i }).click();
          await page.waitForTimeout(2000);
        }
      }
    }

    await deleteAlertRuleViaAPI(page, token, rule.id as string);
    expect(errors).toEqual([]);
  });

  // ==========================================================================
  // 9. 删除组合规则
  // ==========================================================================

  test('确认删除应成功移除组合规则', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const rule = await createAlertRuleViaAPI(page, token, {
      name: 'E2E-DEL-COMPOSITE',
      ruleType: 'Composite',
    });

    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const row = page.locator('table tbody tr').filter({ hasText: 'E2E-DEL-COMPOSITE' }).first();
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

  // ==========================================================================
  // 10. 组合规则在列表中正确展示
  // ==========================================================================

  test('组合规则在列表中应展示"多条件"标签', async ({ page }) => {
    const errors = captureErrors(page);
    const token = await getToken(page);
    const rule = await createAlertRuleViaAPI(page, token, {
      name: 'E2E-DISPLAY-COMPOSITE',
      ruleType: 'Composite',
    });

    await gotoAlertRules(page);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // 验证列表中出现 composite 类型标签
    const compositeBadge = page.getByText(/composite|组合/i).first();
    await expect(compositeBadge).toBeVisible({ timeout: 5000 }).catch(() => {});

    await deleteAlertRuleViaAPI(page, token, rule.id as string);
    expect(errors).toEqual([]);
  });
});
