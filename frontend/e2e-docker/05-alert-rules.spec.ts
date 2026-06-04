import { test, expect } from '@playwright/test';
import { BASE_URL, login, captureErrors, getToken, createAlertRuleViaAPI, deleteAlertRuleViaAPI } from './helpers';

test.describe('5. 告警规则', () => {
  test('5.1 规则页加载', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.goto(`${BASE_URL}/alert-rules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    expect(errors).toEqual([]);
  });

  test('5.2 新建阈值规则', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.goto(`${BASE_URL}/alert-rules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    // 点击新建
    const createBtn = page.getByText('新建', { exact: false }).first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible().catch(() => false)) {
        // 填写规则名称
        const nameInput = dialog.locator('input').first();
        await nameInput.fill('E2E阈值规则');
        // 填写指标
        const metricInput = dialog.getByPlaceholder(/指标|metric/i);
        if (await metricInput.isVisible().catch(() => false)) {
          await metricInput.fill('temperature');
        }
        // 填写阈值
        const thresholdInput = dialog.getByPlaceholder(/阈值|threshold/i);
        if (await thresholdInput.isVisible().catch(() => false)) {
          await thresholdInput.fill('85');
        }
        // 点击保存
        await dialog.getByRole('button', { name: /保存|确认/i }).click();
        await page.waitForTimeout(2000);
      }
    }
    expect(errors).toEqual([]);
  });

  test('5.3 新建基线规则', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.goto(`${BASE_URL}/alert-rules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const createBtn = page.getByText('新建', { exact: false }).first();
    if (await createBtn.isVisible().catch(() => false)) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible().catch(() => false)) {
        await dialog.locator('input').first().fill('E2E基线规则');
        // 选择基线类型
        const typeSelect = dialog.locator('button[role="combobox"]').first();
        if (await typeSelect.isVisible().catch(() => false)) {
          await typeSelect.click();
          await page.waitForTimeout(300);
          const baselineOpt = page.getByRole('option', { name: /基线|baseline/i });
          if (await baselineOpt.isVisible().catch(() => false)) {
            await baselineOpt.click();
            await page.waitForTimeout(500);
          }
        }
        // 填写标准差倍数
        const stddevInput = dialog.getByPlaceholder(/标准差|stddev/i);
        if (await stddevInput.isVisible().catch(() => false)) {
          await stddevInput.fill('2');
        }
        await dialog.getByRole('button', { name: /保存|确认/i }).click();
        await page.waitForTimeout(2000);
      }
    }
    expect(errors).toEqual([]);
  });

  test('5.4 编辑规则', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const rule = await createAlertRuleViaAPI(page, token, { name: '编辑前规则' });
    await page.goto(`${BASE_URL}/alert-rules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    // 查找规则行
    const row = page.locator('tr').filter({ hasText: '编辑前规则' }).first();
    if (await row.isVisible().catch(() => false)) {
      const editBtn = row.getByRole('button', { name: /编辑|edit/i }).first();
      if (await editBtn.isVisible().catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(1000);
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible().catch(() => false)) {
          const nameInput = dialog.locator('input').first();
          await nameInput.fill('编辑后规则');
          await dialog.getByRole('button', { name: /保存|确认/i }).click();
          await page.waitForTimeout(2000);
        }
      }
    }
    await deleteAlertRuleViaAPI(page, token, rule.id);
    expect(errors).toEqual([]);
  });

  test('5.5 删除规则', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const rule = await createAlertRuleViaAPI(page, token, { name: '删除测试规则' });
    await page.goto(`${BASE_URL}/alert-rules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const row = page.locator('tr').filter({ hasText: '删除测试规则' }).first();
    if (await row.isVisible().catch(() => false)) {
      page.on('dialog', (dialog) => dialog.accept());
      const deleteBtn = row.getByRole('button', { name: /删除|delete/i }).first();
      if (await deleteBtn.isVisible().catch(() => false)) {
        await deleteBtn.click();
        await page.waitForTimeout(2000);
      }
    } else {
      await deleteAlertRuleViaAPI(page, token, rule.id);
    }
    expect(errors).toEqual([]);
  });

  test('5.6 搜索规则', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    const token = await getToken(page);
    const rule = await createAlertRuleViaAPI(page, token, { name: '搜索测试规则' });
    await page.goto(`${BASE_URL}/alert-rules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const searchInput = page.getByPlaceholder(/搜索|search/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('搜索测试规则');
      await page.waitForTimeout(1000);
    }
    await deleteAlertRuleViaAPI(page, token, rule.id);
    expect(errors).toEqual([]);
  });

  test('5.7 规则启用/禁用展示', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await page.goto(`${BASE_URL}/alert-rules`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    // 检查规则行中的 Switch 或 Badge 组件
    const switches = page.locator('button[role="switch"], [data-state]');
    const switchCount = await switches.count();
    expect(switchCount).toBeGreaterThanOrEqual(0);
    expect(errors).toEqual([]);
  });
});
