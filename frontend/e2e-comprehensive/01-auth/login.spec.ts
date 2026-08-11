/**
 * 登录功能测试
 *
 * 覆盖登录页面的核心交互场景：
 * - 页面加载与元素可见性
 * - 表单校验（空值、错误密码）
 * - 正确登录流程与会话恢复
 * - HttpOnly Cookie 过期自动刷新
 * - 多标签页 Cookie 会话恢复
 * - 登出流程与状态清理
 */
import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  login,
  loginViaUI,
  completeProductionMfaIfShown,
  captureErrors,
  getAuthState,
  verifyAuthCookie,
  getE2EPassword,
} from '../helpers';

test.describe('01-登录功能', () => {
  test('1. 登录页面加载无错误 — 检查 placeholder 和 button 可见', async ({ page }) => {
    const errors = captureErrors(page);

    // 访问登录页面
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // 验证页面标题包含应用名称
    await expect(page).toHaveTitle(/EquipSense/);

    // 验证用户名输入框可见（placeholder 包含"用户名"或"Username"）
    await expect(page.getByPlaceholder(/用户名|username/i)).toBeVisible();

    // 验证密码输入框可见（placeholder 包含"密码"或"Password"）
    await expect(page.getByPlaceholder(/密码|password/i)).toBeVisible();

    // 验证登录按钮可见（按钮文本包含"登录"或"Login"）
    await expect(page.getByRole('button', { name: /登录|login/i })).toBeVisible();

    // 验证注册链接可见
    await expect(page.getByRole('link', { name: /注册|register/i })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('2. 空表单提交拦截 — 直接点登录按钮，验证 URL 不变', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // 不填写任何字段，直接点击登录按钮
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForTimeout(1000);

    // 验证页面仍停留在登录页，URL 未跳转
    await expect(page).toHaveURL(/login/);

    // 验证出现必填项校验提示
    const validationMessage = page.locator('.text-destructive');
    await expect(validationMessage.first()).toBeVisible({ timeout: 3000 });

    expect(errors).toEqual([]);
  });

  test('3. 错误密码拒绝 — 填错误密码，验证 URL 不变', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // 填写正确的用户名但使用错误密码
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('WrongPassword@999');

    // 点击登录按钮
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForTimeout(2000);

    // 验证页面仍停留在登录页
    await expect(page).toHaveURL(/login/);

    // 验证出现错误提示信息（i18n key: auth.loginError）
    const errorText = page.getByText(/用户名或密码错误|invalid username or password/i);
    await expect(errorText).toBeVisible({ timeout: 3000 });

    expect(errors).toEqual([]);
  });

  test('4. 正确登录跳转仪表盘 — 管理员凭据', async ({ page }) => {
    const errors = captureErrors(page);

    // 使用正确的管理员凭证通过 UI 登录（本用例专门验证登录流程，不能用快速路径）
    await loginViaUI(page, 'admin');

    // 验证已跳转到仪表盘页面
    await expect(page).toHaveURL(/dashboard/);

    // 验证仪表盘页面包含关键统计指标（i18n key: dashboard.*）
    const dashboardContent = page.getByText(
      /设备总数|活跃告警|待处理工单|设备可用率|Total Devices|Active Alerts/i,
    );
    await expect(dashboardContent.first()).toBeVisible({ timeout: 5000 });

    expect(errors).toEqual([]);
  });

  test('5. 登录态持久化（HttpOnly Cookie + sessionStorage user）', async ({ page }) => {
    const errors = captureErrors(page);

    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // 登录前：sessionStorage 中没有 user（未登录态）
    const { user: userBefore } = await getAuthState(page);
    expect(userBefore).toBeNull();

    // 执行登录操作
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill(getE2EPassword('admin'));
    await page.getByRole('button', { name: /登录|login/i }).click();
    await completeProductionMfaIfShown(page, 'admin');
    await page.waitForURL(/dashboard/, { timeout: 30000 });
    await page.waitForLoadState('domcontentloaded');

    // v1.3.0 后 access_token 移到 HttpOnly Cookie，sessionStorage 只存 user。
    // 登录成功 → user 信息已写入 sessionStorage。
    const { user: userAfter, tokenExpiryMs } = await getAuthState(page);
    expect(userAfter).toBeTruthy();
    expect((userAfter as { username?: string }).username).toBe('admin');

    // 主动续期时间戳应已写入（用于 useTokenRefresh 调度）
    expect(tokenExpiryMs).not.toBeNull();
    expect(tokenExpiryMs!).toBeGreaterThan(Date.now());

    // access_token 在 HttpOnly Cookie 中，前端 JS 读不到；
    // 用 /auth/me 探活证明 Cookie 确实有效（替代旧的 /^eyJ/ 格式断言）。
    const meResp = await verifyAuthCookie(page);
    expect(meResp.ok()).toBeTruthy();

    expect(errors).toEqual([]);
  });

  test('6. Access Token 过期自动刷新 — HttpOnly Cookie + Refresh Cookie', async ({ page, context }) => {
    const errors = captureErrors(page);

    // 先正常登录
    await login(page);
    await expect(page).toHaveURL(/dashboard/);

    // access_token 是 HttpOnly，测试只能通过清除它模拟过期；refresh_token 保留，
    // 由页面内真实 API 请求触发 401 拦截器完成刷新。
    await context.clearCookies({ name: 'access_token' });

    // 监听刷新请求后访问另一个需要请求数据的业务页面，确保浏览器真正走过
    // 401 → refresh → 重试链路。SignalR 会保持长连接，因此不能等待 networkidle。
    const refreshResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/v1/auth/refresh')
        && response.request().method() === 'POST',
      { timeout: 15000 },
    ).catch(() => null);
    await page.goto(`${BASE_URL}/devices`, { waitUntil: 'domcontentloaded' });
    const refreshResponse = await refreshResponsePromise;
    expect(refreshResponse?.ok()).toBeTruthy();

    // 刷新成功后 Cookie 会被后端重新写入，/auth/me 应恢复为 200，且前端仍在业务页。
    await expect(page).toHaveURL(/devices/);
    expect((await verifyAuthCookie(page)).ok()).toBeTruthy();
    expect((await getAuthState(page)).user).toBeTruthy();

    expect(errors).toEqual([]);
  });

  test('7. 多标签页登录状态同步 — 新标签页通过 Cookie 恢复', async ({ page, context }) => {
    const errors = captureErrors(page);

    // 在第一个标签页登录
    await login(page);
    await expect(page).toHaveURL(/dashboard/);

    // 打开第二个标签页
    const page2 = await context.newPage();
    const errors2 = captureErrors(page2);

    // 在第二个标签页访问应用（应自动恢复登录状态）
    await page2.goto(`${BASE_URL}/dashboard`);
    await page2.waitForLoadState('networkidle');
    await page2.waitForTimeout(2000);

    // sessionStorage 不跨标签页共享；应用应使用共享的 HttpOnly Cookie 调用 /auth/me 恢复用户。
    const { user: user2 } = await getAuthState(page2);
    expect(user2).toBeTruthy();
    expect((await verifyAuthCookie(page2)).ok()).toBeTruthy();

    // 清理：关闭第二个标签页
    await page2.close();

    expect(errors).toEqual([]);
    expect(errors2).toEqual([]);
  });

  test('8. 登出清除登录态并跳转登录页', async ({ page }) => {
    const errors = captureErrors(page);

    // 先登录
    await login(page);
    await expect(page).toHaveURL(/dashboard/);

    // 验证已登录状态（user 信息存在）
    const { user: userBefore } = await getAuthState(page);
    expect(userBefore).toBeTruthy();

    // 找到并点击退出登录按钮
    // 退出按钮可能在用户菜单下拉框中，先尝试找到用户头像/菜单触发器
    const logoutButton = page.getByRole('button', { name: /退出登录|logout/i });
    const logoutLink = page.getByRole('link', { name: /退出登录|logout/i });
    const userMenuTrigger = page.getByRole('button', { name: /admin|用户|avatar/i });

    // 尝试多种方式找到退出按钮
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
    } else if (await logoutLink.isVisible().catch(() => false)) {
      await logoutLink.click();
    } else if (await userMenuTrigger.isVisible().catch(() => false)) {
      // 先打开用户菜单
      await userMenuTrigger.click();
      await page.waitForTimeout(500);
      // 然后点击退出
      await page.getByRole('menuitem', { name: /退出登录|logout/i }).click();
    } else {
      // 最后手段：调用后端 /auth/logout 清除 HttpOnly Cookie + 清前端状态
      await page.request.post(`${BASE_URL}/api/v1/auth/logout`);
      await page.evaluate(() => sessionStorage.removeItem('user'));
      await page.goto(`${BASE_URL}/login`);
    }

    await page.waitForTimeout(2000);

    // 验证已跳转回登录页
    await expect(page).toHaveURL(/login/);

    // v1.3.0 后 user 是登录态真实代理，登出应清除 user（token 本就不在 JS 可见范围）
    const { user: userAfter } = await getAuthState(page);
    expect(userAfter).toBeNull();

    // HttpOnly Cookie 应被后端 /auth/logout 清除，/auth/me 探活应失败（401）
    const meResp = await verifyAuthCookie(page);
    expect(meResp.status()).toBe(401);

    expect(errors).toEqual([]);
  });
});
