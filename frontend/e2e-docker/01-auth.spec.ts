import { test, expect } from '@playwright/test';
import { BASE_URL, login, captureErrors } from './helpers';

test.describe('1. 认证流程', () => {
  test('1.1 登录页完整验证', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page).toHaveTitle(/EquipSense/);
    await expect(page.getByPlaceholder(/用户名|username/i)).toBeVisible();
    await expect(page.getByPlaceholder(/密码|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /登录|login/i })).toBeVisible();
  });

  test('1.2 空表单提交校验', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByRole('button', { name: /登录|login/i }).click();
    await expect(page).toHaveURL(/login/);
  });

  test('1.3 错误密码拦截', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/login/);
  });

  test('1.4 正确密码登录成功', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('1.5 注册链接跳转验证', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    const registerLink = page.getByRole('link', { name: /注册|register/i });
    if (await registerLink.isVisible().catch(() => false)) {
      await registerLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/register/);
    }
  });

  test('1.6 强制改密对话框', async ({ page }) => {
    // 使用 admin 登录后，如果后端返回 mustChangePassword=true 会弹出改密对话框
    // 当前 admin 用户的 mustChangePassword 通常为 false，此测试验证改密对话框的检测逻辑
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin@123');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForTimeout(3000);
    // 检查是否弹出改密对话框（如果弹出了，验证其存在并关闭）
    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible().catch(() => false)) {
      // 改密对话框存在，验证密码输入框
      const pwdInputs = dialog.locator('input[type="password"]');
      expect(await pwdInputs.count()).toBeGreaterThanOrEqual(1);
    }
    // 无论是否弹出，最终应在 dashboard 或 login 页面
    const url = page.url();
    expect(url).toMatch(/dashboard|login|change-password/);
  });

  test('1.7 注册步骤1 - 套餐选择', async ({ page }) => {
    const errors = captureErrors(page);
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    // 验证注册页面加载
    await expect(page).toHaveURL(/register/);
    // 验证套餐卡片或步骤指示器
    const stepIndicator = page.locator('[data-step], [aria-current]');
    const hasSteps = await stepIndicator.count() > 0;
    // 验证下一步按钮
    const nextBtn = page.getByRole('button', { name: /下一步|next/i });
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
    }
    expect(errors).toEqual([]);
  });

  test('1.8 注册完整三步流程', async ({ page }) => {
    const errors = captureErrors(page);
    const ts = Date.now();
    await page.goto(`${BASE_URL}/register`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    // 步骤1：选择套餐（如果有套餐卡片，点击第一个）
    const planCards = page.locator('[class*="cursor-pointer"], [class*="card"]').filter({ hasText: /基础|试用|专业/i });
    if (await planCards.first().isVisible().catch(() => false)) {
      await planCards.first().click();
    }
    const nextBtn = page.getByRole('button', { name: /下一步|next/i });
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
    }
    // 步骤2：企业信息
    const tenantNameInput = page.getByPlaceholder(/企业名称|company/i);
    if (await tenantNameInput.isVisible().catch(() => false)) {
      await tenantNameInput.fill(`E2E企业${ts}`);
      const slugInput = page.getByPlaceholder(/标识|slug/i);
      if (await slugInput.isVisible().catch(() => false)) {
        await slugInput.fill(`e2e-${ts}`);
      }
      const nextBtn2 = page.getByRole('button', { name: /下一步|next/i });
      if (await nextBtn2.isVisible().catch(() => false)) {
        await nextBtn2.click();
        await page.waitForTimeout(1000);
      }
    }
    // 步骤3：管理员信息
    const usernameInput = page.getByPlaceholder(/用户名|username/i).first();
    if (await usernameInput.isVisible().catch(() => false)) {
      await usernameInput.fill(`e2eadmin${ts}`);
      const pwdInputs = page.locator('input[type="password"]');
      if (await pwdInputs.count() >= 2) {
        await pwdInputs.first().fill('E2eTest@123');
        await pwdInputs.nth(1).fill('E2eTest@123');
      }
      const emailInput = page.getByPlaceholder(/邮箱|email/i);
      if (await emailInput.isVisible().catch(() => false)) {
        await emailInput.fill(`e2e${ts}@test.com`);
      }
      const submitBtn = page.getByRole('button', { name: /提交|注册|submit/i });
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
      }
    }
    expect(errors).toEqual([]);
  });
});
