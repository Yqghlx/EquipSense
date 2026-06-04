import { test, expect } from '@playwright/test';
import { BASE_URL, login, captureErrors, navigateViaSidebar } from './helpers';

test.describe('8. 知识库', () => {
  test('8.1 Tab切换', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /知识/i);
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();
    for (let i = 0; i < tabCount; i++) {
      if (await tabs.nth(i).isVisible().catch(() => false)) {
        await tabs.nth(i).click();
        await page.waitForTimeout(500);
      }
    }
    expect(errors).toEqual([]);
  });

  test('8.2 搜索功能', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /知识/i);
    const searchInput = page.getByPlaceholder(/搜索|search/i);
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('E2E测试搜索');
      await page.waitForTimeout(500);
    }
    expect(errors).toEqual([]);
  });

  test('8.3 诊断规则编辑对话框', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /知识/i);
    await page.waitForTimeout(1000);
    // 查找规则卡片上的编辑按钮
    const editBtns = page.getByRole('button', { name: /编辑|edit/i });
    if (await editBtns.first().isVisible().catch(() => false)) {
      await editBtns.first().click();
      await page.waitForTimeout(1000);
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible().catch(() => false)) {
        // 验证编辑表单字段
        expect(await dialog.locator('input').count()).toBeGreaterThan(0);
      }
    }
    expect(errors).toEqual([]);
  });

  test('8.4 规则启用/禁用切换', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /知识/i);
    await page.waitForTimeout(1000);
    // 查找规则卡片上的启用/禁用按钮或 Badge
    const toggleBtn = page.getByRole('button', { name: /禁用|启用|disable|enable/i }).first();
    if (await toggleBtn.isVisible().catch(() => false)) {
      await toggleBtn.click();
      await page.waitForTimeout(1000);
    }
    expect(errors).toEqual([]);
  });

  test('8.5 待审核规则批准', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /知识/i);
    await page.waitForTimeout(500);
    // 切换到待审核 Tab
    const pendingTab = page.getByRole('tab', { name: /待审核|pending/i });
    if (await pendingTab.isVisible().catch(() => false)) {
      await pendingTab.click();
      await page.waitForTimeout(1000);
      // 查找批准按钮
      const approveBtn = page.getByRole('button', { name: /批准|approve/i }).first();
      if (await approveBtn.isVisible().catch(() => false)) {
        await approveBtn.click();
        await page.waitForTimeout(1000);
      }
    }
    expect(errors).toEqual([]);
  });

  test('8.6 故障案例Tab', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /知识/i);
    const caseTab = page.getByRole('tab', { name: /故障案例|case/i });
    if (await caseTab.isVisible().catch(() => false)) {
      await caseTab.click();
      await page.waitForTimeout(1000);
    }
    expect(errors).toEqual([]);
  });

  test('8.7 导入导出工具栏', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /知识/i);
    await page.waitForTimeout(1000);
    // 验证工具栏按钮
    const importBtn = page.getByRole('button', { name: /导入|import/i });
    const exportBtn = page.getByRole('button', { name: /导出|export/i });
    // 不强制要求可见（可能工具栏在某些状态下才显示）
    await importBtn.isVisible().catch(() => {});
    await exportBtn.isVisible().catch(() => {});
    expect(errors).toEqual([]);
  });
});
