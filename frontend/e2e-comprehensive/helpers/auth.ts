/**
 * 认证相关辅助函数
 *
 * 提供 E2E 测试中常用的登录、获取 Token 等认证操作。
 * 支持五种角色：admin / lead / tech / operator / viewer。
 *
 * v1.3.0 安全强化（HttpOnly Cookie 完整迁移）后：
 *   - access_token / refresh_token 放在 HttpOnly Cookie 中，JavaScript 无法读取
 *   - sessionStorage 只存 user 信息和 token_expires_at_ms（刷新调度时间戳）
 *   - 旧的 sessionStorage.getItem('token') 断言全部失效（永远返回 null）
 *
 * 提供 getAuthState / isLoggedIn / verifyAuthCookie 三个新辅助函数，
 * 让测试改用「user 信息 + /auth/me 探活」验证登录态，而不是读 token 字符串。
 */
import { type Page, type APIResponse } from '@playwright/test';

/** E2E 测试基础 URL — CI 中通过 PLAYWRIGHT_BASE_URL 环境变量覆盖 */
export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:8443';

/**
 * 读取浏览器侧可观察的认证状态
 *
 * v1.3.0 后 sessionStorage 只存：
 *   - user（用户信息 JSON，登录态真实代理）
 *   - token_expires_at_ms（刷新调度时间戳，可选）
 *
 * access_token 已移到 HttpOnly Cookie，无法通过 evaluate 读取，
 * 因此不再返回 token 字段（旧测试断言 sessionStorage.getItem('token') 全部已迁移到本函数）。
 *
 * @param page - Playwright Page 实例
 * @returns user 信息（解析后对象）与 tokenExpiryMs（数字或 null）
 */
export async function getAuthState(
  page: Page,
): Promise<{ user: unknown | null; tokenExpiryMs: number | null }> {
  return page.evaluate(() => {
    const userStr = sessionStorage.getItem('user');
    let user: unknown | null = null;
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch {
        user = null;
      }
    }
    const expiryStr = sessionStorage.getItem('token_expires_at_ms');
    const tokenExpiryMs = expiryStr ? Number(expiryStr) : null;
    return { user, tokenExpiryMs: Number.isFinite(tokenExpiryMs) ? tokenExpiryMs : null };
  });
}

/**
 * 通过 user 信息判断当前是否已登录
 *
 * 替代旧的 `sessionStorage.getItem('token') !== null` 判断。
 * user 存在即视为已登录（authStore.isAuthenticated 就是从 user 推断的）。
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const { user } = await getAuthState(page);
  return user !== null;
}

/**
 * 用 /auth/me 探活，验证 HttpOnly Cookie 中的 access_token 是否真的有效
 *
 * v1.3.0 后无法在 JS 里读 token 字符串做格式断言（/^eyJ/ 之类），
 * 改用「带 Cookie 请求受保护端点，看是否 200」来证明登录态真实有效。
 *
 * @param page - Playwright Page 实例（复用其 request 上下文以共享 Cookie）
 * @returns /auth/me 响应；登录态有效时 ok() 为 true
 */
export async function verifyAuthCookie(page: Page): Promise<APIResponse> {
  return page.request.get(`${BASE_URL}/api/v1/auth/me`);
}

/** 角色到登录凭证的映射 */
const ROLE_CREDENTIALS: Record<string, { username: string; password: string }> = {
  admin: { username: 'admin', password: 'Admin@123' },
  lead: { username: 'lead', password: 'Lead@123' },
  tech: { username: 'tech', password: 'Tech@123' },
  operator: { username: 'operator', password: 'Operator@123' },
  viewer: { username: 'viewer', password: 'Viewer@123' },
};

/**
 * 以指定角色登录并等待仪表盘加载
 *
 * 默认走 UI 表单登录路径（稳定，与真实用户行为一致）。
 * 设了环境变量 E2E_FAST_LOGIN=1 时改走 API 快速登录路径（见 loginAsFast）。
 * 01-auth / 05-auth 等专门测试登录流程的用例应直接用 loginViaUI。
 *
 * @param page - Playwright Page 实例
 * @param role - 角色名称：admin / lead / tech / operator / viewer
 */
export async function loginAs(page: Page, role: string): Promise<void> {
  if (process.env.E2E_FAST_LOGIN === '1') {
    await loginAsFast(page, role);
  } else {
    await loginViaUI(page, role);
  }
}

/**
 * 快速登录路径：API 登录 + addInitScript 注入 sessionStorage('user')
 *
 * 相比 UI 登录（~5s）快约 4-5 秒：跳过表单填写、networkidle 等待、2s 仪表盘预热。
 * 原理：page.request.post 在 page 浏览器上下文执行，后端 Set-Cookie 写入的
 * access_token / refresh_token 自动存入上下文，后续 page.goto 自动带上 Cookie。
 * 配合 addInitScript 注入 sessionStorage('user')，AuthGuard 同步放行。
 *
 * 带兜底：若快速路径未能到达仪表盘（如 Cookie 时序竞争），自动降级到 UI 登录。
 *
 * 启用方式：export E2E_FAST_LOGIN=1（CI 环境默认开启可大幅缩短 E2E 总时长）
 */
export async function loginAsFast(page: Page, role: string = 'admin'): Promise<void> {
  const credentials = ROLE_CREDENTIALS[role];
  if (!credentials) {
    throw new Error(`未知的角色: ${role}，支持的角色: ${Object.keys(ROLE_CREDENTIALS).join(', ')}`);
  }

  // API 登录，Cookie 自动写入上下文
  await loginViaAPI(page, role);

  // 注入 sessionStorage('user')，让 AuthGuard 同步放行
  await page.addInitScript((userJson) => {
    try {
      sessionStorage.setItem('user', userJson);
    } catch {
      // 极少数情况下 sessionStorage 不可用，忽略——Cookie 仍生效
    }
  }, ROLE_USER_JSON[role]);

  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.waitForURL(/dashboard/, { timeout: 30000 }).catch(() => {
    // 快速路径时序竞争时不抛错，下面兜底
  });
  // 兜底：快速路径失败则降级 UI 登录，保证测试稳定性
  if (!/dashboard/.test(page.url())) {
    await loginViaUI(page, role);
  }
}

/**
 * 通过 UI 表单登录（保留给专门测试登录流程的用例使用）
 *
 * @param page - Playwright Page 实例
 * @param role - 角色名称
 */
export async function loginViaUI(page: Page, role: string = 'admin'): Promise<void> {
  const credentials = ROLE_CREDENTIALS[role];
  if (!credentials) {
    throw new Error(`未知的角色: ${role}，支持的角色: ${Object.keys(ROLE_CREDENTIALS).join(', ')}`);
  }

  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder(/用户名|username/i).fill(credentials.username);
  await page.getByPlaceholder(/密码|password/i).fill(credentials.password);
  await page.getByRole('button', { name: /登录|login/i }).click();
  // CI 环境较慢，等待时间设为 30 秒以应对冷启动和网络延迟
  await page.waitForURL(/dashboard/, { timeout: 30000 });
  await page.waitForLoadState('networkidle');
  // 等待仪表盘组件初始化完成（图表、卡片等异步数据加载）
  await page.waitForTimeout(2000);
}

/**
 * 通过 API 登录（不经过 UI 表单）
 *
 * page.request.post 在 page 所属浏览器上下文执行，
 * 后端 Set-Cookie 写入的 access_token / refresh_token 自动存入该上下文，
 * 后续 page.goto 会自动带上这两个 HttpOnly Cookie。
 *
 * 同时把后端返回的 UserInfo 序列化为 JSON，供 addInitScript 注入 sessionStorage。
 *
 * @param page - Playwright Page 实例
 * @param role - 角色名称
 */
async function loginViaAPI(page: Page, role: string): Promise<void> {
  const credentials = ROLE_CREDENTIALS[role];

  // 最多重试 3 次，应对 CI 中的瞬时网络抖动或限流
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const resp = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
        data: { username: credentials.username, password: credentials.password },
      });
      if (!resp.ok()) {
        throw new Error(`登录 API 返回 ${resp.status()}，角色: ${role}`);
      }
      const body = await resp.json();
      if (!body.userInfo && !body.UserInfo) {
        throw new Error(`登录响应中未找到 userInfo，角色: ${role}`);
      }
      // 缓存 user JSON 供后续 addInitScript 注入（避免每次登录都重新解析）
      const userInfo = body.userInfo ?? body.UserInfo;
      ROLE_USER_JSON[role] = JSON.stringify(userInfo);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < 3) {
        await page.waitForTimeout(1000 * attempt);
      }
    }
  }
  throw new Error(`API 登录失败（已重试 3 次），角色: ${role}，原因: ${lastError?.message}`);
}

/** 角色到 sessionStorage('user') JSON 的缓存（首次 loginViaAPI 后填充） */
const ROLE_USER_JSON: Record<string, string> = {};

/**
 * 以管理员身份登录（兼容原有调用方式）
 *
 * @param page - Playwright Page 实例
 */
export async function login(page: Page): Promise<void> {
  await loginAs(page, 'admin');
}

/**
 * 获取管理员认证 Token
 *
 * @param page - Playwright Page 实例
 * @returns JWT Token 字符串
 */
export async function getToken(page: Page): Promise<string> {
  return getTokenForRole(page, 'admin');
}

/**
 * 按角色获取认证 Token
 *
 * @param page - Playwright Page 实例
 * @param role - 角色名称
 * @returns JWT Token 字符串
 */
export async function getTokenForRole(page: Page, role: string): Promise<string> {
  const credentials = ROLE_CREDENTIALS[role];
  if (!credentials) {
    throw new Error(`未知的角色: ${role}，支持的角色: ${Object.keys(ROLE_CREDENTIALS).join(', ')}`);
  }

  // 最多重试 3 次，应对 CI 中的瞬时网络抖动或限流
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const resp = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
        data: { username: credentials.username, password: credentials.password },
      });
      if (!resp.ok()) {
        throw new Error(`登录 API 返回 ${resp.status()}，角色: ${role}`);
      }
      const body = await resp.json();
      const token = body.accessToken || body.token;
      if (!token) {
        throw new Error(`登录响应中未找到 token，角色: ${role}`);
      }
      return token;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // 短暂等待后重试
      if (attempt < 3) {
        await page.waitForTimeout(1000 * attempt);
      }
    }
  }
  throw new Error(`获取 Token 失败（已重试 3 次），角色: ${role}，原因: ${lastError?.message}`);
}
