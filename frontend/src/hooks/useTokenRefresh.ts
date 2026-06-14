/**
 * Token 主动续期 Hook
 *
 * 在 Access Token 过期前 5 分钟自动发起刷新请求，避免用户在操作中途遭遇 401 被强制登出。
 * 同时利用 Page Visibility API，在页面不可见时暂停定时器（浏览器后台标签页不应浪费请求），
 * 重新可见时立即检查是否需要续期。
 *
 * 设计说明（HttpOnly Cookie 迁移后）：
 *   - Token 来源：sessionStorage（关闭标签页即清空，与 Cookie 会话生命周期一致）
 *   - 续期调度：优先使用响应体中的 expiresIn 字段（无需解析 HttpOnly Cookie）
 *   - 刷新请求：直接 axios（绕过 api 实例的 401 拦截器），浏览器自动携带 refresh_token Cookie
 *   - 刷新失败：由 api.ts 的 401 响应拦截器兜底处理登出
 *   - 组件卸载时自动清理定时器，避免内存泄漏
 */
import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

/** 提前续期的时间窗口（毫秒），距过期不足此值时立即刷新 */
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 分钟

/**
 * 从 JWT 字符串中解析 exp（过期时间戳，单位秒）
 * JWT 结构：header.payload.signature，payload 为 base64url 编码的 JSON
 * 不依赖第三方库，仅处理解析成功的情况；解析失败返回 null，由调用方降级处理
 */
function parseJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // base64url → base64：替换 URL 安全字符并补齐 padding
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
    const payload = JSON.parse(atob(base64 + pad));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

export default function useTokenRefresh() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);
  // 记录下次过期的绝对时间戳（毫秒），避免每次依赖读取 sessionStorage
  const expiresAtRef = useRef<number | null>(null);
  // 使用 ref 存储最新 token，避免闭包捕获过期值
  const tokenRef = useRef<string | null>(null);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore.getState().setAuth;
  const logout = useAuthStore.getState().logout;

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
   * 刷新流程：
   *   1. 调用 /auth/refresh（不传 body），浏览器自动携带 refresh_token Cookie
   *   2. 后端验证 Cookie 中的 refresh_token，生成新令牌对，通过 Set-Cookie 更新 access_token Cookie
   *   3. 响应体返回 { accessToken, expiresIn, userInfo }，前端据此更新 sessionStorage 和调度下一次刷新
   */
  const refreshToken = useCallback(async () => {
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    try {
      // 直接使用 axios（绕过 api 实例的 401 拦截器），避免主动刷新与被动刷新产生竞态
      // withCredentials: true 确保浏览器携带 refresh_token Cookie（开发环境跨源必需）
      const response = await axios.post('/api/v1/auth/refresh', {}, { withCredentials: true });
      const { accessToken, expiresIn, userInfo } = response.data;

      // 同步更新 sessionStorage（useTokenRefresh 调度依赖）和 Zustand 状态
      sessionStorage.setItem('token', accessToken);
      setAuth(accessToken, userInfo);

      // 用响应体的 expiresIn 计算下次过期时间（比解析 JWT 更可靠，避免解析失败降级）
      const expiresInSeconds = typeof expiresIn === 'number' ? expiresIn : 86400;
      expiresAtRef.current = Date.now() + expiresInSeconds * 1000;

      // 同步更新 ref，供 visibility 变化回调使用
      tokenRef.current = accessToken;

      // 调度下一次刷新
      scheduleRefreshFromNow(expiresInSeconds * 1000);
    } catch {
      // 刷新失败：可能 refresh token 已过期或网络问题
      // 不做登出，保留当前 token 继续尝试，直到 401 拦截器最终处理
      console.warn('[useTokenRefresh] 令牌刷新失败，将在下次触发时重试');
    } finally {
      isRefreshingRef.current = false;
    }
  }, [setAuth]);

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
   * 根据当前 token 的 JWT exp 字段调度刷新
   * 用于初次登录/页面恢复时（无 expiresIn 响应体可用）
   */
  const scheduleRefreshFromToken = useCallback((token: string) => {
    clearTimer();
    const exp = parseJwtExp(token);
    if (exp === null) return;

    const remainingMs = exp * 1000 - Date.now();
    expiresAtRef.current = exp * 1000;

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
      tokenRef.current = null;
      expiresAtRef.current = null;
      return;
    }

    const token = sessionStorage.getItem('token');
    if (!token) return;

    tokenRef.current = token;
    scheduleRefreshFromToken(token);

    return clearTimer;
  }, [isAuthenticated, scheduleRefreshFromToken, clearTimer]);

  // Page Visibility API：页面从后台切回前台时，重新评估是否需要刷新
  // 后台标签页的 setTimeout 会被浏览器节流（最小间隔 1000ms），
  // 长时间后台后定时器触发时机可能不准确，因此切回前台时主动检查
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;

      // 优先使用已计算的 expiresAt（来自最近一次刷新的 expiresIn），避免重新解析 JWT
      if (expiresAtRef.current !== null) {
        const remainingMs = expiresAtRef.current - Date.now();
        if (remainingMs <= 0) {
          logout();
          return;
        }
        if (remainingMs <= REFRESH_THRESHOLD_MS) {
          refreshToken();
          return;
        }
        scheduleRefreshFromNow(remainingMs);
        return;
      }

      // 降级：从 sessionStorage 解析 JWT（初次加载或刷新后首次可见）
      const token = tokenRef.current ?? sessionStorage.getItem('token');
      if (!token) return;

      const exp = parseJwtExp(token);
      if (exp === null) return;

      const remainingMs = exp * 1000 - Date.now();
      if (remainingMs <= 0) {
        logout();
        return;
      }
      if (remainingMs <= REFRESH_THRESHOLD_MS) {
        refreshToken();
      } else {
        scheduleRefreshFromToken(token);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshToken, scheduleRefreshFromToken, scheduleRefreshFromToken, logout]);
}
