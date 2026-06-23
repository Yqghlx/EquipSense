/**
 * 令牌过期时间戳的持久化辅助（与 useTokenRefresh、authStore、LoginPage 共享）。
 *
 * 设计要点：sessionStorage 存【绝对过期时间戳】（毫秒），而非 expiresIn 时长。
 * 存时长 + 用页面加载时间近似"签发时间"是错的——刷新后页面加载时刻 ≠ 令牌签发时刻，
 * 会把"已用掉大半的令牌"误判为"刚签发的满额令牌"，主动刷新被排到真实过期之后，
 * 在过期到下次刷新的窗口内所有请求吃 401。存绝对时间戳后用 Date.now() 即得真实剩余。
 *
 * 独立成模块而非放在 useTokenRefresh：authStore.logout() 也需清除它，若从 hook 文件
 * 导入会与 useTokenRefresh 反向导入 authStore 形成循环依赖，故抽出到此处解耦。
 */

/** sessionStorage 中存令牌【绝对过期时间戳】的键名（毫秒数字，不含敏感信息） */
export const TOKEN_EXPIRES_AT_KEY = 'token_expires_at_ms';

/** 默认 token 有效期（秒），后端默认 900 = 15min（见 JwtTokenService.AccessTokenMinutes）。
 *  仅在 sessionStorage 无过期记录时兜底；正常流程登录/刷新都会持久化实际值。 */
export const DEFAULT_EXPIRES_IN_SECONDS = 900;

/**
 * 读取令牌剩余有效毫秒数（基于持久化的绝对过期时间戳）。
 * @returns 剩余毫秒（已过期为负数）；无合法记录返回 null
 */
export function readRemainingMs(): number | null {
  const raw = sessionStorage.getItem(TOKEN_EXPIRES_AT_KEY);
  const expiryMs = typeof raw === 'string' ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(expiryMs)) return null;
  return expiryMs - Date.now();
}

/**
 * 持久化令牌过期时间戳（登录 / 刷新成功后调用）。
 * 存 Date.now() + expiresInSeconds*1000，使刷新后用 Date.now() 即可算出真实剩余时间。
 * @param expiresInSeconds 后端返回的有效期；缺省/非法时回退默认值（兜底旧版或异常情况）
 */
export function persistTokenExpiry(expiresInSeconds?: number): void {
  const seconds = Number.isFinite(expiresInSeconds) && (expiresInSeconds as number) > 0
    ? (expiresInSeconds as number)
    : DEFAULT_EXPIRES_IN_SECONDS;
  sessionStorage.setItem(TOKEN_EXPIRES_AT_KEY, String(Date.now() + seconds * 1000));
}

/**
 * 清除 sessionStorage 中的过期时间戳（登出时调用）
 */
export function clearTokenExpiry(): void {
  sessionStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
}
