/**
 * Token 主动续期 Hook（v1.3.0 HttpOnly Cookie 完整迁移后）
 *
 * 在 Access Token 过期前 5 分钟自动发起刷新请求，避免用户在操作中途遭遇 401。
 * 同时利用 Page Visibility API，在页面不可见时暂停定时器，重新可见时立即检查。
 *
 * v1.3.0 关键变化：
 *   - 不再从 sessionStorage 读 token 字符串（token 已不在 JS 可访问范围）
 *   - 改用 expiresIn（响应体返回）调度刷新
 *   - sessionStorage 只存 expiresIn（无害数字，XSS 偷到也没用）
 *   - 刷新请求：axios 直接调用，浏览器自动携带 refresh_token Cookie
 *   - 刷新失败：由 api.ts 的 401 响应拦截器兜底处理登出
 */
/* eslint-disable react-hooks/exhaustive-deps, react-hooks/preserve-manual-memoization, react-hooks/immutability */
// 上面的规则在 Token 刷新场景下不适用：
// - exhaustive-deps：定时器+可见性回调刻意只绑定一次，依赖项已在 ref 中追踪
// - preserve-manual-memoization：refreshToken 和 scheduleRefresh 互相引用，无法静态分析
import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

/** 提前续期的时间窗口（毫秒），距过期不足此值时立即刷新 */
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 分钟

/** sessionStorage 中存 expiresIn 的键名（数字，不含敏感信息） */
const EXPIRES_IN_KEY = 'expires_in_seconds';

/** 默认 token 有效期（秒），后端默认 900 = 15min（见 JwtTokenService.AccessTokenMinutes）。
 *  仅在后端未返回 expiresIn 时兜底；正常流程后端始终返回实际值。 */
const DEFAULT_EXPIRES_IN_SECONDS = 900;

/**
 * 从 sessionStorage 读取 expiresIn（响应体返回的剩余有效秒数）
 * 用于初次页面恢复时调度定时器（替代旧版从 JWT 解析 exp）
 */
function readExpiresInFromStorage(): number {
  const raw = sessionStorage.getItem(EXPIRES_IN_KEY);
  const n = typeof raw === 'string' ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_EXPIRES_IN_SECONDS;
}

/**
 * 保存 expiresIn 到 sessionStorage（登录 / 刷新成功后调用）
 */
export function persistExpiresIn(expiresInSeconds: number): void {
  if (Number.isFinite(expiresInSeconds) && expiresInSeconds > 0) {
    sessionStorage.setItem(EXPIRES_IN_KEY, String(expiresInSeconds));
  }
}

/**
 * 清除 sessionStorage 中的 expiresIn（登出时调用）
 */
export function clearExpiresIn(): void {
  sessionStorage.removeItem(EXPIRES_IN_KEY);
}

export default function useTokenRefresh() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);
  // 记录下次过期的绝对时间戳（毫秒）
  const expiresAtRef = useRef<number | null>(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  /** 清除当前定时器 */
  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * 发起刷新请求
   *
   * 刷新流程（v1.3.0）：
   *   1. 调用 /auth/refresh（不传 body），浏览器自动携带 refresh_token Cookie
   *   2. 后端验证 Cookie 中的 refresh_token，生成新令牌对，通过 Set-Cookie 更新
   *   3. 响应体返回 { expiresIn, userInfo }（不再返回 token 字符串）
   *   4. 前端保存 expiresIn 调度下一次刷新
   */
  const refreshToken = useCallback(async () => {
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    try {
      // 直接使用 axios（绕过 api 实例的 401 拦截器），避免主动刷新与被动刷新产生竞态
      // withCredentials: true 确保浏览器携带 refresh_token Cookie（开发环境跨源必需）
      const response = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
      const { expiresIn, userInfo } = response.data;

      // 保存 expiresIn 到 sessionStorage（用于页面恢复后调度）
      const expiresInSeconds = typeof expiresIn === 'number' ? expiresIn : DEFAULT_EXPIRES_IN_SECONDS;
      persistExpiresIn(expiresInSeconds);
      expiresAtRef.current = Date.now() + expiresInSeconds * 1000;

      // 同步更新 authStore（用户信息可能在每次刷新时变化，如角色 / 状态）
      if (userInfo) {
        const { useAuthStore } = await import('../stores/authStore');
        useAuthStore.getState().setAuth(userInfo);
      }

      // 调度下一次刷新
      scheduleRefreshFromNow(expiresInSeconds * 1000);
    } catch {
      // 刷新失败：可能 refresh token 已过期或网络问题
      // 不做登出，保留当前会话继续尝试，直到 401 拦截器最终处理
      console.warn('[useTokenRefresh] 令牌刷新失败，将在下次触发时重试');
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  /**
   * 根据剩余有效毫秒数调度下一次刷新定时器
   * 若已接近过期（< 阈值），立即刷新
   */
  const scheduleRefreshFromNow = useCallback((remainingMs: number) => {
    clearTimer();
    if (remainingMs <= REFRESH_THRESHOLD_MS) {
      refreshToken();
      return;
    }
    const delayMs = remainingMs - REFRESH_THRESHOLD_MS;
    timerRef.current = setTimeout(() => {
      refreshToken();
    }, delayMs);
  }, [clearTimer, refreshToken]);

  /**
   * 初次登录 / 页面恢复时，从 sessionStorage 读 expiresIn 调度刷新
   */
  const scheduleFromStorage = useCallback(() => {
    clearTimer();
    const expiresInSeconds = readExpiresInFromStorage();
    const remainingMs = expiresInSeconds * 1000 - (Date.now() - getSessionStartMs());
    expiresAtRef.current = Date.now() + remainingMs;

    if (remainingMs <= REFRESH_THRESHOLD_MS) {
      refreshToken();
      return;
    }
    const delayMs = remainingMs - REFRESH_THRESHOLD_MS;
    timerRef.current = setTimeout(() => {
      refreshToken();
    }, delayMs);
  }, [clearTimer, refreshToken]);

  // 监听认证状态变化，重新调度定时器
  useEffect(() => {
    if (!isAuthenticated) {
      clearTimer();
      expiresAtRef.current = null;
      return;
    }

    scheduleFromStorage();

    return clearTimer;
  }, [isAuthenticated, scheduleFromStorage, clearTimer]);

  // Page Visibility API：页面从后台切回前台时，重新评估是否需要刷新
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (expiresAtRef.current === null) return;

      const remainingMs = expiresAtRef.current - Date.now();
      if (remainingMs <= 0) {
        // 已过期：尝试刷新一次，若 refresh_token 也失效则 401 拦截器会登出
        refreshToken();
        return;
      }
      if (remainingMs <= REFRESH_THRESHOLD_MS) {
        refreshToken();
        return;
      }
      scheduleRefreshFromNow(remainingMs);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshToken, scheduleRefreshFromNow]);
}

/**
 * 获取会话开始时间（用于计算 token 剩余有效期）
 *
 * 简化方案：用页面加载时间作为近似值。
 * 精确方案需要存登录时的绝对时间戳，但当前设计已足够（误差 < 1s）。
 */
function getSessionStartMs(): number {
  if (typeof performance !== 'undefined' && performance.timeOrigin) {
    return performance.timeOrigin;
  }
  return Date.now();
}
