import axios from 'axios';
import api from './api';
import { useAuthStore } from '../stores/authStore';
import type { UserInfo } from '../types';

/** 会话恢复请求的超时时间，避免网络断开时登录页无限等待。 */
const SESSION_RESTORE_TIMEOUT_MS = 5000;

/** Cookie 会话恢复结果，expiresIn 仅在刚完成刷新时可用。 */
export interface RestoredSession {
  /** 当前用户信息。 */
  user: UserInfo;
  /** 刷新接口返回的访问令牌有效期（秒）。 */
  expiresIn?: number;
}

/** 判断未知异常是否为认证 Cookie 失效。 */
function isUnauthorizedError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const response = (error as { response?: { status?: unknown } }).response;
  return response?.status === 401;
}

/**
 * 将服务端当前用户响应收敛为前端可安全使用的用户模型。
 *
 * 会话恢复发生在页面刚加载、sessionStorage 为空的时刻；如果服务端返回半截数据，
 * 继续渲染会让租户订阅、权限判断等组件进入“已登录但上下文不完整”的危险状态，
 * 因此宁可按未登录处理，也不接受缺少租户 ID 或身份字段的响应。
 */
function normalizeUserInfo(value: unknown): UserInfo | null {
  if (typeof value !== 'object' || value === null) return null;

  const raw = value as Record<string, unknown>;
  const requiredStrings = ['id', 'tenantId', 'username', 'role', 'createdAt'];
  if (requiredStrings.some((key) => typeof raw[key] !== 'string' || raw[key] === '')) {
    return null;
  }

  const username = raw.username as string;
  return {
    id: raw.id as string,
    tenantId: raw.tenantId as string,
    username,
    displayName: typeof raw.displayName === 'string' && raw.displayName.length > 0
      ? raw.displayName
      : username,
    role: raw.role as string,
    email: typeof raw.email === 'string' ? raw.email : undefined,
    phone: typeof raw.phone === 'string' ? raw.phone : undefined,
    isActive: raw.isActive === true,
    createdAt: raw.createdAt as string,
    mustChangePassword: raw.mustChangePassword === true,
    mfaEnabled: raw.mfaEnabled === true,
  };
}

/** 用当前 HttpOnly Access Cookie 获取用户信息。 */
async function requestCurrentUser(): Promise<UserInfo> {
  const response = await axios.get('/api/v1/auth/me', {
    withCredentials: true,
    timeout: SESSION_RESTORE_TIMEOUT_MS,
  });
  const user = normalizeUserInfo(response.data);
  if (!user) throw new Error('当前用户响应缺少完整身份上下文');
  return user;
}

/**
 * 从浏览器 Cookie 恢复认证状态。
 *
 * 新标签页和浏览器重启后 sessionStorage 不会保留，但 HttpOnly Cookie 仍然存在。
 * 先调用 /auth/me 保持无副作用；仅在 Access Token 已过期且服务端明确返回 401 时，
 * 才使用 refresh_token Cookie 刷新，避免每次打开页面都无谓轮换刷新令牌。
 */
export async function restoreSessionFromCookie(): Promise<RestoredSession | null> {
  try {
    return { user: await requestCurrentUser() };
  } catch (error) {
    // 未登录、网络中断和服务端异常都安全降级为登录页；只有 401 才尝试刷新。
    if (!isUnauthorizedError(error)) return null;
  }

  try {
    const refreshResponse = await axios.post('/api/v1/auth/refresh', {}, {
      withCredentials: true,
      timeout: SESSION_RESTORE_TIMEOUT_MS,
    });
    const data = (refreshResponse.data ?? {}) as Record<string, unknown>;
    const user = normalizeUserInfo(data.userInfo ?? data.UserInfo);
    const expiresIn = typeof data.expiresIn === 'number'
      && Number.isFinite(data.expiresIn)
      && data.expiresIn > 0
      ? data.expiresIn
      : undefined;

    // 机器客户端策略或旧版本响应可能不带 userInfo；刷新 Cookie 后再探活一次，
    // 保证前端最终写入的仍是完整服务端用户对象，而不是猜测字段。
    return user
      ? { user, ...(expiresIn === undefined ? {} : { expiresIn }) }
      : { user: await requestCurrentUser(), ...(expiresIn === undefined ? {} : { expiresIn }) };
  } catch {
    return null;
  }
}

/**
 * 撤销服务端会话并清理浏览器侧认证状态。
 *
 * HttpOnly Cookie 无法由 JavaScript 直接删除，必须先调用后端登出接口让服务端下发
 * 清除 Cookie 的 Set-Cookie。即使网络暂时不可用，也要清理本地状态，避免页面继续
 * 以为用户已登录；下次访问受保护接口时，401 拦截器会再次处理残留 Cookie。
 */
export async function revokeSessionAndClearLocalState(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // 本地状态清理不能依赖网络，保证用户可以离开当前会话。
  } finally {
    useAuthStore.getState().logout();
  }
}
