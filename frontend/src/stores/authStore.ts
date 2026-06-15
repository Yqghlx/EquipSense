/**
 * Zustand 认证状态管理
 *
 * Token 存储策略（HttpOnly Cookie 迁移后）：
 *   - access_token / refresh_token 由后端通过 Set-Cookie 设置（HttpOnly + Secure + SameSite）
 *     浏览器在每次请求时自动携带，JavaScript 无法读取 refresh_token（防 XSS 窃取）
 *   - sessionStorage 仅存储 access_token（供 useTokenRefresh Hook 解析 exp 调度定时器）
 *     和 user 信息（供 Zustand 页面刷新后快速恢复，无需额外网络请求）
 *   - sessionStorage 关闭标签页即清空，与 Cookie 会话生命周期保持一致
 */
import { create } from 'zustand';
import type { UserInfo } from '../types';

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  /** 保存认证信息到 Zustand 状态 + sessionStorage（Cookie 由后端登录响应自动设置） */
  setAuth: (token: string, user: UserInfo) => void;
  /** 清除认证状态 + sessionStorage（Cookie 由后端 /auth/logout 清除） */
  logout: () => void;
  /** 从 sessionStorage 恢复认证状态（页面刷新时调用） */
  loadFromStorage: () => void;
}

/**
 * 从 sessionStorage 同步恢复认证状态（模块加载时立即执行）
 *
 * 关键修复：必须在 store 创建时同步调用，而非在 App.tsx 的 useEffect 中调用。
 * 原因：React Router 在首次渲染时就会评估 AuthGuard，若此时 isAuthenticated=false，
 * 会立即重定向到 /login（然后又因已认证跳回 /dashboard），导致刷新或直接访问
 * 任意业务页面 URL 时都落到 /dashboard，懒加载子页面永远无法直接访问。
 */
function loadFromStorageSync(): { token: string | null; user: UserInfo | null; isAuthenticated: boolean } {
  if (typeof window === 'undefined') return { token: null, user: null, isAuthenticated: false };
  const token = sessionStorage.getItem('token');
  const userStr = sessionStorage.getItem('user');
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr) as UserInfo;
      return { token, user, isAuthenticated: true };
    } catch {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
  }
  return { token: null, user: null, isAuthenticated: false };
}

export const useAuthStore = create<AuthState>((set) => ({
  ...loadFromStorageSync(),

  setAuth: (token, user) => {
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    // 模块加载时已同步初始化，这里仅做幂等兜底（如外部清空 sessionStorage 后重新恢复）
    const token = sessionStorage.getItem('token');
    const userStr = sessionStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as UserInfo;
        set({ token, user, isAuthenticated: true });
      } catch {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        set({ token: null, user: null, isAuthenticated: false });
      }
    } else {
      set({ token: null, user: null, isAuthenticated: false });
    }
  },
}));
