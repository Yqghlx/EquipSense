import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../authStore';
import type { UserInfo } from '../../types';

/**
 * authStore 测试（v1.3.0 HttpOnly Cookie 迁移后）
 *
 * 关键变化：
 *   - store 不再持有 token 字段（token 完全在 HttpOnly Cookie 里）
 *   - sessionStorage 只存 user，不再存 token
 *   - setAuth 签名从 (token, user) 简化为 (user)
 */

/** 模拟的 sessionStorage（jsdom 已提供，但每个测试前需清空） */
beforeEach(() => {
  sessionStorage.clear();
  // 重置 store 到初始状态
  useAuthStore.setState({
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

    it('初始状态下不持有 token 字段（HttpOnly Cookie 模式）', () => {
      const state = useAuthStore.getState();
      // token 字段不应再存在于 store（已移除）
      expect('token' in state).toBe(false);
    });
  });

  describe('setAuth（登录）', () => {
    it('调用 setAuth 后应设置用户信息并标记为已认证', () => {
      const { setAuth } = useAuthStore.getState();
      setAuth(mockUser);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('调用 setAuth 后应将用户信息保存到 sessionStorage（不含 token）', () => {
      const { setAuth } = useAuthStore.getState();
      setAuth(mockUser);

      expect(sessionStorage.getItem('user')).toBe(JSON.stringify(mockUser));
      // 关键：sessionStorage 不应存 token（XSS 防护）
      expect(sessionStorage.getItem('token')).toBeNull();
    });
  });

  describe('logout（登出）', () => {
    it('调用 logout 后应清除用户信息并标记为未认证', () => {
      // 先登录
      useAuthStore.getState().setAuth(mockUser);

      // 登出
      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('调用 logout 后应清除 sessionStorage 中的用户信息', () => {
      // 先登录
      useAuthStore.getState().setAuth(mockUser);

      // 登出
      useAuthStore.getState().logout();

      expect(sessionStorage.getItem('user')).toBeNull();
    });
  });

  describe('loadFromStorage（从存储恢复）', () => {
    it('sessionStorage 中有有效用户数据时应恢复认证状态', () => {
      // 先存入有效数据（只存 user，不存 token）
      sessionStorage.setItem('user', JSON.stringify(mockUser));

      useAuthStore.getState().loadFromStorage();

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('sessionStorage 中无数据时应保持未认证状态', () => {
      useAuthStore.getState().loadFromStorage();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('sessionStorage 中用户信息损坏时应清除无效数据', () => {
      sessionStorage.setItem('user', 'invalid-json{{{');

      useAuthStore.getState().loadFromStorage();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(sessionStorage.getItem('user')).toBeNull();
    });
  });
});
