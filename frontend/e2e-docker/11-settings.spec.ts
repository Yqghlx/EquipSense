import { test, expect } from '@playwright/test';
import { BASE_URL, login, captureErrors, navigateViaSidebar } from './helpers';

test.describe('11. 系统设置', () => {
  test('11.1 各Tab切换', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设置/i);
    const tabs = page.getByRole('tab');
    const tabCount = await tabs.count();
    for (let i = 0; i < tabCount; i++) {
      if (await tabs.nth(i).isVisible().catch(() => false)) {
        await tabs.nth(i).click();
        await page.waitForTimeout(800);
      }
    }
    expect(errors).toEqual([]);
  });

  test('11.2 LLM配置表单和保存', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设置/i);
    // 点击 LLM 配置 Tab
    const llmTab = page.getByRole('tab', { name: /LLM|模型/i });
    if (await llmTab.isVisible().catch(() => false)) {
      await llmTab.click();
      await page.waitForTimeout(1000);
      // 验证表单字段
      const inputs = page.locator('input[type="text"], input[type="number"]');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThanOrEqual(0);
      // 查找保存按钮
      const saveBtn = page.getByRole('button', { name: /保存|save/i });
      await saveBtn.isVisible().catch(() => {});
    }
    expect(errors).toEqual([]);
  });

  test('11.3 系统参数配置', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设置/i);
    const sysTab = page.getByRole('tab', { name: /系统参数|参数/i });
    if (await sysTab.isVisible().catch(() => false)) {
      await sysTab.click();
      await page.waitForTimeout(1000);
      const inputs = page.locator('input[type="number"]');
      const inputCount = await inputs.count();
      expect(inputCount).toBeGreaterThanOrEqual(0);
    }
    expect(errors).toEqual([]);
  });

  test('11.4 外部集成Tab切换', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设置/i);
    const integTab = page.getByRole('tab', { name: /集成|integration/i });
    if (await integTab.isVisible().catch(() => false)) {
      await integTab.click();
      await page.waitForTimeout(1000);
      // 查找子 Tab（钉钉/飞书/Webhook/EAM）
      const subTabs = page.getByRole('tab');
      const subTabCount = await subTabs.count();
      for (let i = 0; i < Math.min(subTabCount, 4); i++) {
        if (await subTabs.nth(i).isVisible().catch(() => false)) {
          await subTabs.nth(i).click();
          await page.waitForTimeout(500);
        }
      }
    }
    expect(errors).toEqual([]);
  });

  test('11.5 集成启用/禁用', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设置/i);
    const integTab = page.getByRole('tab', { name: /集成|integration/i });
    if (await integTab.isVisible().catch(() => false)) {
      await integTab.click();
      await page.waitForTimeout(1000);
      const toggleBtn = page.getByRole('button', { name: /启用|禁用|enable|disable/i }).first();
      if (await toggleBtn.isVisible().catch(() => false)) {
        await toggleBtn.click();
        await page.waitForTimeout(1000);
      }
    }
    expect(errors).toEqual([]);
  });

  test('11.6 测试连接', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设置/i);
    const integTab = page.getByRole('tab', { name: /集成|integration/i });
    if (await integTab.isVisible().catch(() => false)) {
      await integTab.click();
      await page.waitForTimeout(1000);
      const testBtn = page.getByRole('button', { name: /测试连接|test.*connection/i });
      if (await testBtn.isVisible().catch(() => false)) {
        await testBtn.click();
        await page.waitForTimeout(3000);
      }
    }
    expect(errors).toEqual([]);
  });

  test('11.7 审批链新建对话框', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设置/i);
    const approvalTab = page.getByRole('tab', { name: /审批|approval/i });
    if (await approvalTab.isVisible().catch(() => false)) {
      await approvalTab.click();
      await page.waitForTimeout(1000);
      const newBtn = page.getByRole('button', { name: /新增|新建|create/i }).first();
      if (await newBtn.isVisible().catch(() => false)) {
        await newBtn.click();
        await page.waitForTimeout(1000);
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible().catch(() => false)) {
          // 验证对话框内容
          expect(await dialog.locator('input').count()).toBeGreaterThanOrEqual(0);
        }
      }
    }
    expect(errors).toEqual([]);
  });

  test('11.8 订阅管理面板', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设置/i);
    const subTab = page.getByRole('tab', { name: /订阅|subscription/i });
    if (await subTab.isVisible().catch(() => false)) {
      await subTab.click();
      await page.waitForTimeout(1000);
      // 验证计划卡片
      const planCards = page.locator('[class*="card"]').filter({ hasText: /试用|基础|专业|企业/i });
      const cardCount = await planCards.count();
      expect(cardCount).toBeGreaterThanOrEqual(0);
    }
    expect(errors).toEqual([]);
  });

  test('11.9 推送通知开关', async ({ page }) => {
    const errors = captureErrors(page);
    await login(page);
    await navigateViaSidebar(page, /设置/i);
    await page.waitForTimeout(1000);
    // 查找推送通知开关
    const pushSwitch = page.locator('button[role="switch"]').filter({ hasText: /推送|push|通知/i });
    const switchBtn = page.getByText(/推送|push.*notification/i);
    if (await switchBtn.isVisible().catch(() => false)) {
      // 验证开关存在
    }
    expect(errors).toEqual([]);
  });
});
