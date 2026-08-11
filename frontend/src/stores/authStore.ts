/**
 * Zustand 认证状态管理
 *
 * v1.3.0 安全强化（HttpOnly Cookie 完整迁移）：
 *   - access_token / refresh_token 由后端通过 Set-Cookie 设置
 *     （HttpOnly + Secure + SameSite=Strict），JavaScript 完全无法读取
 *   - sessionStorage **不再存储 token**，只存 user 信息（页面刷新后快速恢复）
 *   - isAuthenticated 状态从 sessionStorage 是否有 user 推断
 *   - 401 拦截器捕获过期 / 失效 Cookie，跳转登录页
 *
 * 安全收益：
 *   - XSS 即使能执行任意 JS，也只能操作已登录浏览器的会话，
 *     无法偷走 token 字符串离线使用
 */
import { create } from 'zustand';
import type { UserInfo } from '../types';
import { clearTokenExpiry } from '../lib/tokenExpiry';
import { queryClient } from '../lib/queryClient';

interface AuthState {
  /** 当前登录用户（不含 token，token 在 HttpOnly Cookie 里） */
  user: UserInfo | null;
  /** 是否已认证（根据 user 是否存在推断） */
  isAuthenticated: boolean;
  /** 首屏是否已完成 sessionStorage/Cookie 会话恢复，未完成前路由不应重定向。 */
  isSessionReady: boolean;
  /** 保存认证状态（Cookie 由后端登录响应自动设置，前端只存 user） */
  setAuth: (user: UserInfo) => void;
  /** 清除前端认证状态（Cookie 由后端 /auth/logout 清除） */
  logout: () => void;
  /** 从 sessionStorage 恢复认证状态（页面刷新时调用） */
  loadFromStorage: () => void;
  /** 标记首屏会话恢复完成，允许路由开始做认证判断。 */
  finishSessionRestore: () => void;
}

/**
 * 从 sessionStorage 同步恢复认证状态（模块加载时立即执行）
 *
 * 关键修复：必须在 store 创建时同步调用，而非在 App.tsx 的 useEffect 中调用。
 * 原因：React Router 在首次渲染时就会评估 AuthGuard，若此时 isAuthenticated=false，
 * 会立即重定向到 /login（然后又因已认证跳回 /dashboard），导致刷新或直接访问
 * 任意业务页面 URL 时都落到 /dashboard，懒加载子页面永远无法直接访问。
 */
function loadFromStorageSync(): {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isSessionReady: boolean;
} {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false, isSessionReady: true };
  }
  const userStr = sessionStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr) as UserInfo;
      return { user, isAuthenticated: true, isSessionReady: false };
    } catch {
      sessionStorage.removeItem('user');
    }
  }
  return { user: null, isAuthenticated: false, isSessionReady: false };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...loadFromStorageSync(),

  setAuth: (user) => {
    const currentUser = get().user;
    if (currentUser && (currentUser.id !== user.id || currentUser.tenantId !== user.tenantId)) {
      // 同一 SPA 切换身份时，query key 不能替代缓存清理；先清除旧租户/用户数据再写入新会话。
      queryClient.clear();
    }
    sessionStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true, isSessionReady: true });
  },

  logout: () => {
    sessionStorage.removeItem('user');
    // 退出时同步清空内存查询缓存，避免下一位用户在 staleTime 内看到旧会话数据。
    queryClient.clear();
    // 清除主动刷新用的过期时间戳：登出后不再调度刷新，且避免残留值在异常路径下误导下次会话
    clearTokenExpiry();
    set({ user: null, isAuthenticated: false, isSessionReady: true });
  },

  loadFromStorage: () => {
    // 模块加载时已同步初始化，这里仅做幂等兜底（如外部清空 sessionStorage 后重新恢复）
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr) as UserInfo;
        const currentUser = get().user;
        if (currentUser && (currentUser.id !== user.id || currentUser.tenantId !== user.tenantId)) {
          queryClient.clear();
        }
        set({ user, isAuthenticated: true });
      } catch {
        sessionStorage.removeItem('user');
        if (get().user) queryClient.clear();
        set({ user: null, isAuthenticated: false });
      }
    } else {
      if (get().user) queryClient.clear();
      set({ user: null, isAuthenticated: false });
    }
  },

  finishSessionRestore: () => {
    set({ isSessionReady: true });
  },
}));
