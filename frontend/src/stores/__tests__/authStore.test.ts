import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';
import type { UserInfo } from '../../types';

/** 模拟的 sessionStorage（jsdom 已提供，但每个测试前需清空） */
beforeEach(() => {
  sessionStorage.clear();
  // 重置 store 到初始状态
  useAuthStore.setState({
    token: null,
    user: null,
    isAuthenticated: false,
  });
});

const mockUser: UserInfo = {
  id: 'user-001',
  username: 'admin',
  displayName: '系统管理员',
  role: 'SystemAdmin',
  email: 'admin@example.com',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  mustChangePassword: false,
  mfaEnabled: false,
};

describe('authStore', () => {
  describe('初始状态', () => {
    it('初始状态下未认证', () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });

    it('初始状态下用户信息为空', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });

    it('初始状态下令牌为空', () => {
      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
    });
  });

  describe('setAuth（登录）', () => {
    it('调用 setAuth 后应设置令牌、用户信息并标记为已认证', () => {
      const { setAuth } = useAuthStore.getState();
      setAuth('jwt-token-abc', mockUser);

      const state = useAuthStore.getState();
      expect(state.token).toBe('jwt-token-abc');
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('调用 setAuth 后应将令牌和用户信息保存到 sessionStorage', () => {
      const { setAuth } = useAuthStore.getState();
      setAuth('jwt-token-abc', mockUser);

      expect(sessionStorage.getItem('token')).toBe('jwt-token-abc');
      expect(sessionStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });
  });

  describe('logout（登出）', () => {
    it('调用 logout 后应清除令牌、用户信息并标记为未认证', () => {
      // 先登录
      useAuthStore.getState().setAuth('jwt-token-abc', mockUser);

      // 登出
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('调用 logout 后应清除 sessionStorage 中的认证信息', () => {
      // 先登录
      useAuthStore.getState().setAuth('jwt-token-abc', mockUser);

      // 登出
      useAuthStore.getState().logout();

      expect(sessionStorage.getItem('token')).toBeNull();
      expect(sessionStorage.getItem('user')).toBeNull();
    });
  });

  describe('loadFromStorage（从存储恢复）', () => {
    it('sessionStorage 中有有效数据时应恢复认证状态', () => {
      // 先存入有效数据
      sessionStorage.setItem('token', 'restored-token');
      sessionStorage.setItem('user', JSON.stringify(mockUser));

      useAuthStore.getState().loadFromStorage();

      const state = useAuthStore.getState();
      expect(state.token).toBe('restored-token');
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('sessionStorage 中无数据时应保持未认证状态', () => {
      useAuthStore.getState().loadFromStorage();

      const state = useAuthStore.getState();
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('sessionStorage 中用户信息损坏时应清除无效数据', () => {
      sessionStorage.setItem('token', 'some-token');
      sessionStorage.setItem('user', 'invalid-json{{{');

      useAuthStore.getState().loadFromStorage();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(sessionStorage.getItem('token')).toBeNull();
      expect(sessionStorage.getItem('user')).toBeNull();
    });
  });
});
