/**
 * 密码重置流程端到端测试
 *
 * 覆盖本轮新增的密码自助重置功能：
 * - 忘记密码页面可访问，提交邮箱后显示成功提示（防枚举）
 * - 重置密码页面：无效 token 显示错误，缺 token 显示提示
 * - 页面路由可达性（/forgot-password、/reset-password）
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, captureErrors } from '../helpers';

test.describe('05-密码重置流程', () => {
  test('1. 忘记密码页面可访问并提交邮箱', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/forgot-password`);
    await page.waitForLoadState('networkidle');

    // 页面应显示邮箱输入框
    const emailInput = page.getByLabel(/邮箱|email/i).first();
    await expect(emailInput).toBeVisible();

    // 填入邮箱并提交
    await emailInput.fill('admin@equipsense.test');
    await page.getByRole('button', { name: /发送|send|reset/i }).click();
    await page.waitForTimeout(1500);

    // 无论邮箱是否存在都应显示成功提示（防枚举）
    await expect(page.getByText(/已发送|sent|检查收件箱/i)).toBeVisible({ timeout: 5000 });

    expect(errors.get()).toEqual([]);
  });

  test('2. 重置密码页面：缺 token 显示提示', async ({ page }) => {
    const errors = captureErrors(page);

    // 无 token 访问重置页面应提示无效
    await page.goto(`${BASE_URL}/reset-password`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/无效|invalid|缺少|missing/i)).toBeVisible({ timeout: 5000 });

    expect(errors.get()).toEqual([]);
  });

  test('3. 重置密码页面：无效 token 提交显示错误', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/reset-password?token=invalid-token-12345`);
    await page.waitForLoadState('networkidle');

    // 输入新密码
    const pwdInputs = page.getByLabel(/新密码|new.?password/i);
    await pwdInputs.nth(0).fill('NewPassword@2026');
    await pwdInputs.nth(1).fill('NewPassword@2026');

    await page.getByRole('button', { name: /重置|reset/i }).click();
    await page.waitForTimeout(2000);

    // 无效 token 应显示错误提示
    await expect(page.getByText(/失败|失败|过期|expired|invalid/i)).toBeVisible({ timeout: 5000 });

    expect(errors.get()).toEqual([]);
  });

  test('4. 登录页有忘记密码链接', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    const forgotLink = page.getByRole('link', { name: /忘记密码|forgot/i });
    await expect(forgotLink).toBeVisible();
    await expect(forgotLink).toHaveAttribute('href', '/forgot-password');
  });
});
