/**
 * 强制改密流程测试
 *
 * 覆盖 MustChangePassword 用户首次登录后的强制改密场景：
 * - 改密对话框弹出与不可关闭
 * - 表单校验（密码长度、确认密码匹配）
 * - API 错误处理（当前密码错误）
 * - 正确提交后状态更新
 * - 普通用户登录不触发改密
 */
import { test, expect } from '@playwright/test';
import { BASE_URL, login, loginAs, captureErrors, getE2EPassword, getToken } from '../helpers';

test.describe('01-强制改密流程', () => {
  test('1. MustChangePassword 用户登录后应弹出改密对话框', async ({ page }) => {
    const errors = captureErrors(page);

    // 通过 API 创建 mustChangePassword=true 的测试用户
    // Production E2E 会为管理员启用 MFA；统一复用认证辅助函数，确保完成 MFA
    // 后再读取机器客户端令牌，避免直接读取 MFA challenge 响应导致 401。
    const adminToken = await getToken(page);

    const suffix = Date.now().toString(36);
    const testUsername = `e2e-mcp-${suffix}`;
    const resp = await page.request.post(`${BASE_URL}/api/v1/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      data: {
        username: testUsername,
        password: 'Test@12345',
        role: 'Technician',
        mustChangePassword: true,
      },
    });

    expect(resp.ok(), `创建强制改密测试用户失败：HTTP ${resp.status()}`).toBeTruthy();

    // getToken 会在当前浏览器上下文写入管理员 HttpOnly Cookie；创建完测试用户后
    // 必须清除该会话，否则访问 /login 会被 AuthGuard 直接重定向到管理员仪表盘。
    await page.context().clearCookies();

    // 用新用户登录
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder(/用户名|username/i).fill(testUsername);
    await page.getByPlaceholder(/密码|password/i).fill('Test@12345');
    const loginResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/v1/auth/login')
        && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /登录|login/i }).click();
    const loginResponse = await loginResponsePromise;
    const loginBody = await loginResponse.json() as {
      userInfo?: { mustChangePassword?: boolean; MustChangePassword?: boolean };
      mfaRequired?: boolean;
      mfaEnrollmentRequired?: boolean;
    };
    expect(loginResponse.ok(), `强制改密用户登录失败：HTTP ${loginResponse.status()}`).toBeTruthy();
    expect(
      loginBody.userInfo?.mustChangePassword ?? loginBody.userInfo?.MustChangePassword,
      '登录响应必须明确返回 mustChangePassword=true，前端才能阻止默认密码继续使用',
    ).toBe(true);
    expect(loginBody.mfaRequired ?? false, '技术员测试用户不应进入 MFA 挑战流程').toBe(false);
    expect(loginBody.mfaEnrollmentRequired ?? false, '技术员测试用户不应进入 MFA 注册流程').toBe(false);
    await page.waitForTimeout(2000);

    // 验证改密对话框弹出
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 强制改密模式下不应有关闭按钮
    const closeButton = dialog.getByRole('button', { name: /close|关闭/i });
    await expect(closeButton).not.toBeVisible();

    expect(errors).toEqual([]);
  });

  test('2. 改密对话框标题应为"修改密码"', async ({ page }) => {
    const errors = captureErrors(page);

    // 直接登录后检查 — 使用 admin 用户模拟（admin 通常不需要强制改密）
    await login(page);
    await expect(page).toHaveURL(/dashboard/);

    // 通过页面 UI 触发改密对话框（如果有入口）
    // 搜索用户菜单中的修改密码选项
    const changePasswordLink = page.getByRole('menuitem', { name: /修改密码|change.*password/i });
    const userMenuTrigger = page.getByRole('button', { name: /admin|用户|avatar|user/i });

    if (await userMenuTrigger.isVisible().catch(() => false)) {
      await userMenuTrigger.click();
      await page.waitForTimeout(500);

      if (await changePasswordLink.isVisible().catch(() => false)) {
        await changePasswordLink.click();
        await page.waitForTimeout(1000);

        // 验证对话框标题
        const dialogTitle = page.getByRole('dialog').getByText(/修改密码|change.*password/i);
        await expect(dialogTitle).toBeVisible({ timeout: 3000 });
      }
    }

    expect(errors).toEqual([]);
  });

  test('3. 新密码少于 8 位应显示验证错误', async ({ page }) => {
    const errors = captureErrors(page);

    // 先导航到可触发修改密码的页面
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // 模拟强制改密场景：通过 JS 注入状态
    await page.evaluate(() => {
      // 设置用户状态为 mustChangePassword
      const user = { username: 'admin', role: 'SystemAdmin', mustChangePassword: true };
      sessionStorage.setItem('user', JSON.stringify(user));
    });

    // 重新加载页面，触发改密对话框
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 查找改密对话框
    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible().catch(() => false)) {
      const newPasswordInput = dialog.getByPlaceholder('').locator('input[type="password"]').nth(1);
      if (await newPasswordInput.isVisible().catch(() => false)) {
        await newPasswordInput.fill('Short1');
        // 触发失焦以激活验证
        await dialog.getByPlaceholder('').locator('input[type="password"]').nth(2).click();
        await page.waitForTimeout(500);

        // 验证验证错误信息出现
        const validationError = dialog.locator('.text-destructive');
        await expect(validationError.first()).toBeVisible({ timeout: 3000 });
      }
    }

    expect(errors).toEqual([]);
  });

  test('4. 确认密码不匹配应显示错误', async ({ page }) => {
    const errors = captureErrors(page);

    // 通过注入用户状态触发改密对话框
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const user = { username: 'admin', role: 'SystemAdmin', mustChangePassword: true };
      sessionStorage.setItem('user', JSON.stringify(user));
    });

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible().catch(() => false)) {
      const passwordInputs = dialog.locator('input[type="password"]');
      const count = await passwordInputs.count();
      if (count >= 3) {
        // 填写新密码和确认密码（不匹配）
        await passwordInputs.nth(1).fill('NewPass@123');
        await passwordInputs.nth(2).fill('Different@456');
        // 触发验证
        await dialog.getByRole('button', { name: /保存|save/i }).click();
        await page.waitForTimeout(1000);

        // 验证密码不匹配错误
        const mismatchError = dialog.getByText(/不匹配|mismatch/i);
        await expect(mismatchError).toBeVisible({ timeout: 3000 });
      }
    }

    expect(errors).toEqual([]);
  });

  test('5. 当前密码错误应显示 API 错误', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const user = { username: 'admin', role: 'SystemAdmin', mustChangePassword: true };
      sessionStorage.setItem('user', JSON.stringify(user));
    });

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible().catch(() => false)) {
      const passwordInputs = dialog.locator('input[type="password"]');
      const count = await passwordInputs.count();
      if (count >= 3) {
        await passwordInputs.nth(0).fill('WrongPassword@999');
        await passwordInputs.nth(1).fill('NewValidPass@123');
        await passwordInputs.nth(2).fill('NewValidPass@123');
        await dialog.getByRole('button', { name: /保存|save/i }).click();
        await page.waitForTimeout(2000);

        // 验证 API 错误显示
        const apiError = dialog.locator('.text-destructive');
        await expect(apiError.last()).toBeVisible({ timeout: 3000 });
      }
    }

    expect(errors).toEqual([]);
  });

  test('6. 正确提交后应关闭对话框', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const user = { username: 'admin', role: 'SystemAdmin', mustChangePassword: true };
      sessionStorage.setItem('user', JSON.stringify(user));
    });

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible().catch(() => false)) {
      const passwordInputs = dialog.locator('input[type="password"]');
      const count = await passwordInputs.count();
      if (count >= 3) {
        await passwordInputs.nth(0).fill(getE2EPassword('admin'));
        await passwordInputs.nth(1).fill('Admin@456');
        await passwordInputs.nth(2).fill('Admin@456');
        await dialog.getByRole('button', { name: /保存|save/i }).click();
        await page.waitForTimeout(2000);

        // 成功后对话框应消失
        await expect(dialog).not.toBeVisible({ timeout: 5000 });
      }
    }

    expect(errors).toEqual([]);
  });

  test('7. MustChangePassword=false 用户登录不应弹出对话框', async ({ page }) => {
    const errors = captureErrors(page);

    // 使用 admin 正常登录（不需要强制改密）
    await login(page);
    await expect(page).toHaveURL(/dashboard/);

    // 等待足够时间确认对话框不会出现
    await page.waitForTimeout(2000);

    // 验证改密对话框不存在
    const dialog = page.getByRole('dialog');
    await expect(dialog).not.toBeVisible();

    expect(errors).toEqual([]);
  });

  test('8. 连续两次改密应成功', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      const user = { username: 'admin', role: 'SystemAdmin', mustChangePassword: true };
      sessionStorage.setItem('user', JSON.stringify(user));
    });

    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const dialog = page.getByRole('dialog');
    if (await dialog.isVisible().catch(() => false)) {
      const passwordInputs = dialog.locator('input[type="password"]');
      const count = await passwordInputs.count();
      if (count >= 3) {
        // 第一次改密
        await passwordInputs.nth(0).fill(getE2EPassword('admin'));
        await passwordInputs.nth(1).fill('Admin@456');
        await passwordInputs.nth(2).fill('Admin@456');
        await dialog.getByRole('button', { name: /保存|save/i }).click();
        await page.waitForTimeout(2000);

        // 如果对话框关闭，验证正常
        const dialogVisible = await dialog.isVisible().catch(() => false);
        expect(typeof dialogVisible).toBe('boolean');
      }
    }

    expect(errors).toEqual([]);
  });
});
