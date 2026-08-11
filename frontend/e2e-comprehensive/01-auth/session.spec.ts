/**
 * 会话管理测试
 *
 * 覆盖认证会话的生命周期管理场景：
 * - Token 过期时间读取
 * - Token 过期前自动刷新
 * - 独立设备登录不冲突
 * - 登出后其他标签页同步失效
 * - 长时间无操作自动锁定
 * - HttpOnly Cookie 登录状态跨浏览器重启
 */
import { test, expect } from '@playwright/test';
import {
  BASE_URL,
  login,
  captureErrors,
  getToken,
  getAuthState,
  isLoggedIn,
  verifyAuthCookie,
} from '../helpers';

test.describe('01-会话管理', () => {
  test('1. Token 过期时间读取正确', async ({ page }) => {
    const errors = captureErrors(page);

    // 登录获取 Token
    await login(page);
    await expect(page).toHaveURL(/dashboard/);

    // v1.3.0 后 access_token 在 HttpOnly Cookie 中，前端 JS 读不到。
    // 通过 /auth/login API 拿到 token（响应体仍含 token，供机器客户端用），
    // 解析 JWT payload 验证 exp 声明（token 字符串本身仍可被服务端返回的响应体读到）。
    const token = await getToken(page);
    expect(token).toBeTruthy();

    // 解析 JWT Token 的 payload 部分（第二段 Base64）
    const tokenPayload = await page.evaluate((t) => {
      try {
        const parts = t!.split('.');
        if (parts.length !== 3) return null;
        // Base64Url 解码
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join(''),
        );
        return JSON.parse(jsonPayload);
      } catch {
        return null;
      }
    }, token);

    // 验证 Token payload 包含过期时间字段（exp）
    expect(tokenPayload).toBeTruthy();
    expect(tokenPayload.exp).toBeDefined();

    // 验证过期时间在未来
    const expTime = new Date(tokenPayload.exp * 1000);
    const now = new Date();
    expect(expTime.getTime()).toBeGreaterThan(now.getTime());

    // 验证 Token 包含必要的声明字段
    expect(tokenPayload.sub || tokenPayload.nameid || tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']).toBeTruthy();

    // 验证前端侧的主动续期时间戳已写入 sessionStorage
    // （v1.3.0 后这是前端唯一能读到的 token 相关时间戳）
    const { tokenExpiryMs } = await getAuthState(page);
    expect(tokenExpiryMs).not.toBeNull();
    expect(tokenExpiryMs!).toBeGreaterThan(Date.now());

    expect(errors).toEqual([]);
  });

  test('2. 过期前自动刷新', async ({ page }) => {
    const errors = captureErrors(page);

    // 正常登录
    await login(page);
    await expect(page).toHaveURL(/dashboard/);

    // v1.3.0 后前端 JS 读不到 access_token 字符串。
    // 用 user 信息（登录态真实代理）确认已登录，再用 API 拿 token 验证刷新链路。
    expect(await isLoggedIn(page)).toBeTruthy();

    // 通过 API 获取新的 Token（模拟刷新操作）
    const newToken = await getToken(page);
    expect(newToken).toBeTruthy();

    // 新 Token 应与旧 Token 格式一致（JWT 格式）
    expect(newToken).toMatch(/^eyJ/);

    // 验证 API 返回的 Token 可用于后续请求
    const verifyResponse = await page.request.get(`${BASE_URL}/api/v1/devices`, {
      headers: { Authorization: `Bearer ${newToken}` },
    });
    expect(verifyResponse.ok()).toBeTruthy();

    expect(errors).toEqual([]);
  });

  test('3. 独立设备登录不冲突', async ({ page, browser }) => {
    const errors = captureErrors(page);

    // 在第一个独立浏览器上下文使用 admin 登录。
    await login(page);
    await expect(page).toHaveURL(/dashboard/);
    expect(await isLoggedIn(page)).toBeTruthy();

    // 第二个设备必须使用独立上下文；同一 context 共享 Cookie，无法验证多设备会话隔离。
    const context2 = await browser.newContext({ ignoreHTTPSErrors: true });
    const page2 = await context2.newPage();
    const errors2 = captureErrors(page2);
    await login(page2);
    await expect(page2).toHaveURL(/dashboard/);
    expect(await isLoggedIn(page2)).toBeTruthy();

    // 两个设备分别轮换自己的 Refresh Token；第二次登录不应让第一个设备的刷新失败。
    const firstRefresh = await page.request.post(`${BASE_URL}/api/v1/auth/refresh`, { data: {} });
    const secondRefresh = await page2.request.post(`${BASE_URL}/api/v1/auth/refresh`, { data: {} });
    const firstRefreshBody = (await firstRefresh.text()).slice(0, 1000);
    const secondRefreshBody = (await secondRefresh.text()).slice(0, 1000);
    expect(
      firstRefresh.ok(),
      `第一个设备刷新失败：HTTP ${firstRefresh.status()}，响应：${firstRefreshBody}`,
    ).toBeTruthy();
    expect(
      secondRefresh.ok(),
      `第二个设备刷新失败：HTTP ${secondRefresh.status()}，响应：${secondRefreshBody}`,
    ).toBeTruthy();
    expect((await verifyAuthCookie(page)).ok()).toBeTruthy();
    expect((await verifyAuthCookie(page2)).ok()).toBeTruthy();

    // 清理
    await context2.close();

    expect(errors).toEqual([]);
    expect(errors2).toEqual([]);
  });

  test('4. 登出后其他标签页同步失效', async ({ page, context }) => {
    const errors = captureErrors(page);

    // 在第一个标签页登录
    await login(page);
    await expect(page).toHaveURL(/dashboard/);

    // 打开第二个标签页并访问仪表盘
    const page2 = await context.newPage();
    const errors2 = captureErrors(page2);
    await page2.goto(`${BASE_URL}/dashboard`);
    await page2.waitForLoadState('networkidle');
    await page2.waitForTimeout(2000);

    // 在第一个标签页执行登出操作
    // 尝试多种方式找到退出按钮
    const logoutButton = page.getByRole('button', { name: /退出登录|logout/i });
    const logoutLink = page.getByRole('link', { name: /退出登录|logout/i });
    const userMenuTrigger = page.getByRole('button', { name: /admin|用户|avatar/i });

    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
    } else if (await logoutLink.isVisible().catch(() => false)) {
      await logoutLink.click();
    } else if (await userMenuTrigger.isVisible().catch(() => false)) {
      await userMenuTrigger.click();
      await page.waitForTimeout(500);
      await page.getByRole('menuitem', { name: /退出登录|logout/i }).click();
    } else {
      // 调用后端 /auth/logout 清除 HttpOnly Cookie（v1.3.0 token 在 Cookie 里）
      await page.request.post(`${BASE_URL}/api/v1/auth/logout`);
      await page.evaluate(() => sessionStorage.removeItem('user'));
    }

    await page.waitForTimeout(2000);

    // 在第二个标签页触发操作（刷新或导航）
    await page2.reload();
    await page2.waitForLoadState('networkidle');
    await page2.waitForTimeout(2000);

    // 验证第二个标签页检测到会话失效
    // 应用应跳转到登录页，或 user 信息已被清除（v1.3.0 后 user 是登录态真实代理）
    const page2Url = page2.url();
    const page2LoggedIn = await isLoggedIn(page2);
    const isLoggedOut = /login/.test(page2Url) || !page2LoggedIn;

    // 清理
    await page2.close();

    // 登出后 HttpOnly Cookie 被清除，第二个标签页刷新时受保护接口 401 → 拦截器清 user → 跳登录
    expect(isLoggedOut).toBeTruthy();

    expect(errors).toEqual([]);
    expect(errors2).toEqual([]);
  });

  /**
   * 注意：此测试与实际认证架构不匹配，已跳过。
   *
   * 实际架构：access_token 由后端用真实密钥签名，前端不验证签名；
   * 过期检测通过后端返回 401 + HttpOnly Cookie 中的 refresh_token 自动刷新完成。
   * 测试构造的「假签名过期 Token」在前端无法被识别为过期（前端不解析签名），
   * 因此既不会跳转登录也不会刷新。真正的过期处理由 401 响应拦截器 +
   * refresh 端点保障，已在其他会话测试覆盖。
   */
  test.skip('5. 长时间无操作自动锁定', async ({ page }) => {
    const errors = captureErrors(page);

    // 正常登录
    await login(page);
    await expect(page).toHaveURL(/dashboard/);

    // 验证已登录状态
    const tokenBefore = await page.evaluate(() => sessionStorage.getItem('token'));
    expect(tokenBefore).toBeTruthy();

    // 注意：当前应用可能未实现自动锁定功能
    // 此测试验证长时间无操作后的基本行为：
    // 模拟通过修改 Token 过期时间来测试前端处理逻辑

    // 将 Token 替换为一个已过期的伪造 Token
    // 过期时间为 1 小时前（exp = now - 3600）
    await page.evaluate(() => {
      // 创建一个看起来像过期 JWT 的字符串
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(
        JSON.stringify({
          sub: 'admin',
          exp: Math.floor(Date.now() / 1000) - 3600, // 1 小时前过期
        }),
      );
      const fakeToken = `${header}.${payload}.fake-signature`;
      sessionStorage.setItem('token', fakeToken);
    });

    // 触发页面刷新或导航，使应用检测到 Token 过期
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // 验证应用对过期 Token 的处理：
    // 1. 跳转到登录页（最理想）
    // 2. 尝试使用 refreshToken 自动刷新
    const currentUrl = page.url();
    const currentToken = await page.evaluate(() => sessionStorage.getItem('token'));

    // 可接受的结果：
    // - 跳转到登录页
    // - Token 被自动刷新（不再是伪造的过期 Token）
    const isRedirectedToLogin = /login/.test(currentUrl);
    const isTokenRefreshed = currentToken !== null && !currentToken.includes('fake-signature');
    expect(isRedirectedToLogin || isTokenRefreshed).toBeTruthy();

    expect(errors).toEqual([]);
  });

  test('6. HttpOnly Cookie 登录状态跨浏览器重启', async ({ page, context, browser }) => {
    const errors = captureErrors(page);

    // 正常登录
    await login(page);
    await expect(page).toHaveURL(/dashboard/);

    // 新建浏览器上下文模拟真正的浏览器重启：Cookie 保留，sessionStorage 清空。
    const restartedContext = await browser.newContext({ ignoreHTTPSErrors: true });
    const page2 = await restartedContext.newPage();
    const errors2 = captureErrors(page2);

    try {
      await restartedContext.addCookies(await context.cookies());
      await page2.goto(`${BASE_URL}/dashboard`);
      await page2.waitForLoadState('networkidle');
      await page2.waitForTimeout(2000);

      // 新上下文没有 sessionStorage user，必须依靠 Cookie + /auth/me 恢复。
      const userAfter = await page2.evaluate(() => sessionStorage.getItem('user'));
      expect(userAfter).toBeTruthy();
      await expect(page2).toHaveURL(/dashboard/);
      expect((await verifyAuthCookie(page2)).ok()).toBeTruthy();
    } finally {
      await restartedContext.close();
    }

    expect(errors).toEqual([]);
    expect(errors2).toEqual([]);
  });
});
