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
import { createHmac } from 'node:crypto';
import { type Page, type APIResponse } from '@playwright/test';
import { getE2EPassword, getE2ETotpSecret, type E2ERole } from './credentials';

/** E2E 测试基础 URL — CI 中通过 PLAYWRIGHT_BASE_URL 环境变量覆盖 */
export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'https://localhost:8443';

/**
 * 后端直连地址。
 *
 * 本地开发时 BASE_URL 指向 Vite（5173），/health 和 /swagger 不会被 Vite 代理；
 * 这两个探针必须直连 ASP.NET Core（8080），否则静态 index.html 会伪装成健康响应。
 * 生产 Docker/Nginx 环境默认同源，仍使用 BASE_URL。
 */
export const BACKEND_URL = process.env.PLAYWRIGHT_API_BASE_URL
  || (BASE_URL.replace(/\/$/, '').match(/^(https?:\/\/)(localhost|127\.0\.0\.1):5173$/)
    ? BASE_URL.replace(/:5173\/?$/, ':8080')
    : BASE_URL);

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
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await page.evaluate(() => {
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
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt === 3 || !message.includes('Execution context was destroyed')) {
        throw error;
      }

      // 登录后的 AuthGuard 可能正在完成一次短暂路由切换；等一个事件循环再读取，
      // 避免把正常的页面导航竞态误报为登录态丢失。
      await page.waitForTimeout(attempt * 100);
    }
  }

  throw new Error('读取浏览器认证状态失败');
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

/**
 * 获取当前已认证用户 ID。
 *
 * 工单派工等 E2E 操作必须使用服务端真实存在的用户，不能依赖会随数据库重建变化的硬编码 UUID。
 *
 * @param page - Playwright Page 实例（复用其认证 Cookie）
 * @returns 当前用户 UUID
 */
export async function getCurrentUserId(page: Page): Promise<string> {
  const response = await verifyAuthCookie(page);
  if (!response.ok()) {
    throw new Error(`获取当前用户失败：HTTP ${response.status()}`);
  }

  const body = await response.json() as Record<string, unknown>;
  const id = body.id ?? body.Id;
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('当前用户响应中缺少有效 ID');
  }

  return id;
}

/** 角色到登录凭证的映射 */
const ROLE_CREDENTIALS: Record<string, { username: string; password: string }> = {
  admin: { username: 'admin', password: getE2EPassword('admin') },
  lead: { username: 'lead', password: getE2EPassword('lead') },
  tech: { username: 'tech', password: getE2EPassword('tech') },
  operator: { username: 'operator', password: getE2EPassword('operator') },
  viewer: { username: 'viewer', password: getE2EPassword('viewer') },
};

/**
 * 解码隔离 Production E2E 使用的 Base32 TOTP 密钥。
 * 采用 Node 内置能力，避免为验收脚本增加第三方依赖和供应链风险。
 */
function decodeBase32Secret(secret: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const normalized = secret.toUpperCase().replace(/=|\s/g, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bitCount = 0;

  for (const character of normalized) {
    const value = alphabet.indexOf(character);
    if (value < 0) {
      throw new Error('Production E2E 的 TOTP 密钥格式无效');
    }

    buffer = (buffer << 5) | value;
    bitCount += 5;
    if (bitCount >= 8) {
      bitCount -= 8;
      bytes.push((buffer >> bitCount) & 0xff);
      buffer &= bitCount === 0 ? 0 : (1 << bitCount) - 1;
    }
  }

  return Buffer.from(bytes);
}

/**
 * 生成当前 6 位 TOTP 验证码，供 Production 隔离验收完成真实 MFA 二次验证。
 */
function generateTotpCode(secret: string, timestamp = Date.now()): string {
  const counter = BigInt(Math.floor(timestamp / 1000 / 30));
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(counter);
  const digest = createHmac('sha1', decodeBase32Secret(secret)).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binaryCode = ((digest[offset] & 0x7f) << 24)
    | (digest[offset + 1] << 16)
    | (digest[offset + 2] << 8)
    | digest[offset + 3];
  return String(binaryCode % 1_000_000).padStart(6, '0');
}

/**
 * 使用指定账号执行一次 API 登录，并在需要时完成 TOTP 二次验证。
 *
 * 第二租户隔离测试账户不属于常规五角色，因此单独接收账号和 TOTP 密钥；
 * 这样可以复用同一套 MFA 流程，不会为了测试而放宽生产认证策略。
 */
async function loginApiOnceWithCredentials(
  page: Page,
  username: string,
  password: string,
  accountLabel: string,
  totpSecret?: string,
): Promise<Record<string, unknown>> {
  const response = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
    data: { username, password },
  });
  if (!response.ok()) {
    throw new Error(`登录 API 返回 ${response.status()}，账号: ${accountLabel}`);
  }

  let body = await response.json() as Record<string, unknown>;
  if (body.mfaEnrollmentRequired === true || body.MfaEnrollmentRequired === true) {
    throw new Error(`账号 ${accountLabel} 尚未完成 MFA 注册，请先执行 Production E2E MFA 初始化`);
  }

  if (body.mfaRequired === true || body.MfaRequired === true) {
    const challengeToken = body.mfaChallengeToken ?? body.MfaChallengeToken;
    if (typeof challengeToken !== 'string' || !totpSecret) {
      throw new Error(`账号 ${accountLabel} 需要 MFA，但未提供隔离验收 TOTP 密钥`);
    }

    const mfaResponse = await page.request.post(`${BASE_URL}/api/v1/auth/mfa/verify`, {
      data: {
        challengeToken,
        totpCode: generateTotpCode(totpSecret),
      },
    });
    if (!mfaResponse.ok()) {
      throw new Error(`MFA 验证 API 返回 ${mfaResponse.status()}，账号: ${accountLabel}`);
    }
    body = await mfaResponse.json() as Record<string, unknown>;
  }

  if (!body.userInfo && !body.UserInfo) {
    throw new Error(`登录响应中未找到 userInfo，账号: ${accountLabel}`);
  }
  return body;
}

/**
 * 带短暂重试的登录请求，覆盖 CI 冷启动和 TOTP 时间窗口边界。
 */
async function loginApiWithRetry(page: Page, role: string): Promise<Record<string, unknown>> {
  const credentials = ROLE_CREDENTIALS[role];
  return loginApiWithCredentialsWithRetry(
    page,
    credentials.username,
    credentials.password,
    role,
    getE2ETotpSecret(role as E2ERole),
  );
}

/**
 * 使用指定账号执行带重试的 API 登录，覆盖冷启动和 TOTP 时间窗口边界。
 */
async function loginApiWithCredentialsWithRetry(
  page: Page,
  username: string,
  password: string,
  accountLabel: string,
  totpSecret?: string,
): Promise<Record<string, unknown>> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await loginApiOnceWithCredentials(
        page,
        username,
        password,
        accountLabel,
        totpSecret,
      );
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < 3) {
        await page.waitForTimeout(1000 * attempt);
      }
    }
  }
  throw new Error(`API 登录失败（已重试 3 次），账号: ${accountLabel}，原因: ${lastError?.message}`);
}

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

  // 注入 sessionStorage('user') 和主动刷新时间戳，让 AuthGuard 与刷新调度都保持
  // 与真实 UI 登录路径一致。
  await page.addInitScript(({ userJson, tokenExpiryMs }) => {
    try {
      sessionStorage.setItem('user', userJson);
      sessionStorage.setItem('token_expires_at_ms', String(tokenExpiryMs));
    } catch {
      // 极少数情况下 sessionStorage 不可用，忽略——Cookie 仍生效
    }
  }, { userJson: ROLE_USER_JSON[role], tokenExpiryMs: ROLE_TOKEN_EXPIRY_MS[role] });

  // SignalR 和刷新调度属于长期连接，不能用 networkidle 作为页面就绪条件。
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
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

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder(/用户名|username/i).fill(credentials.username);
  await page.getByPlaceholder(/密码|password/i).fill(credentials.password);
  await page.getByRole('button', { name: /登录|login/i }).click();

  await completeProductionMfaIfShown(page, role);

  // CI 环境较慢，等待时间设为 30 秒以应对冷启动和网络延迟
  await page.waitForURL(/dashboard/, { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  // 等待仪表盘组件初始化完成（图表、卡片等异步数据加载）
  await page.waitForTimeout(2000);
}

/**
 * 如果当前页面展示 MFA 验证界面，则使用隔离验收脚本提供的 TOTP 完成验证。
 *
 * 只在 Production E2E 中启用自动填码；普通开发测试不会依赖也不会伪造 MFA 密钥。
 */
export async function completeProductionMfaIfShown(page: Page, role: string): Promise<void> {
  if (process.env.E2E_PRODUCTION !== '1') {
    return;
  }

  const totpInput = page.locator('#totpCode');
  // React 会在密码接口返回后才挂载 MFA 表单，不能用不等待 DOM 的 isVisible 判断。
  // waitFor 能覆盖这段状态切换，同时在普通登录路径下按超时快速返回。
  const mfaVisible = await totpInput
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (mfaVisible) {
    const totpSecret = getE2ETotpSecret(role as E2ERole);
    if (!totpSecret) {
      throw new Error(`角色 ${role} 的 UI 登录需要 MFA，但未提供隔离验收 TOTP 密钥`);
    }
    await totpInput.fill(generateTotpCode(totpSecret));
    await page.getByRole('button', { name: /验证|verify/i }).click();
  }
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
  const body = await loginApiWithRetry(page, role);
  // 缓存 user JSON 供后续 addInitScript 注入（避免每次登录都重新解析）
  const userInfo = body.userInfo ?? body.UserInfo;
  ROLE_USER_JSON[role] = JSON.stringify(userInfo);
  const expiresIn = body.expiresIn ?? body.ExpiresIn;
  const expiresInSeconds = typeof expiresIn === 'number' && expiresIn > 0 ? expiresIn : 900;
  ROLE_TOKEN_EXPIRY_MS[role] = Date.now() + expiresInSeconds * 1000;
}

/** 角色到 sessionStorage('user') JSON 的缓存（首次 loginViaAPI 后填充） */
const ROLE_USER_JSON: Record<string, string> = {};

/** 角色到 sessionStorage 主动刷新时间戳的缓存（快速登录必须与真实登录保持一致） */
const ROLE_TOKEN_EXPIRY_MS: Record<string, number> = {};

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
  if (!ROLE_CREDENTIALS[role]) {
    throw new Error(`未知的角色: ${role}，支持的角色: ${Object.keys(ROLE_CREDENTIALS).join(', ')}`);
  }

  const body = await loginApiWithRetry(page, role);
  const token = body.accessToken ?? body.token;
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error(`登录响应中未找到 token，角色: ${role}`);
  }
  return token;
}

/**
 * 使用指定账号获取认证 Token，支持隔离 Production E2E 中的 MFA 账号。
 *
 * @param page - Playwright Page 实例
 * @param username - 登录用户名
 * @param password - 登录密码
 * @param totpSecret - 可选的 TOTP 密钥；仅在服务端要求 MFA 时使用
 * @returns JWT Token 字符串
 */
export async function getTokenForCredentials(
  page: Page,
  username: string,
  password: string,
  totpSecret?: string,
): Promise<string> {
  const body = await loginApiWithCredentialsWithRetry(
    page,
    username,
    password,
    username,
    totpSecret,
  );
  const token = body.accessToken ?? body.token;
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error(`登录响应中未找到 token，账号: ${username}`);
  }
  return token;
}
