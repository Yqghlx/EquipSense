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

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

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
    const token = sessionStorage.getItem('token');
    const userStr = sessionStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as UserInfo;
        set({ token, user, isAuthenticated: true });
      } catch {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }
  },
}));
