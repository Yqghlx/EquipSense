import { create } from 'zustand';
import type { UserInfo } from '../types';

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserInfo) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  /** 保存认证信息到状态和 localStorage */
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  /** 清除认证信息并移除 localStorage 缓存 */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    set({ token: null, user: null, isAuthenticated: false });
  },

  /** 从 localStorage 恢复认证状态（页面刷新时调用） */
  loadFromStorage: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as UserInfo;
        set({ token, user, isAuthenticated: true });
      } catch {
        // 解析失败时清除无效数据
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  },
}));
