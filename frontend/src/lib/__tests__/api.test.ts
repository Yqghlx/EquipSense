import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../../stores/authStore';

/**
 * API 客户端（src/lib/api.ts）响应拦截器测试
 *
 * 覆盖安全关键路径（这些路径出错会导致用户卡死或安全风险）：
 *   1. 401（access_token 过期）— 用 refresh_token 刷新后重发原始请求
 *   2. 登录/刷新请求本身 401 — 不重试（避免无限循环 → DoS）
 *   3. 已重试过的 401（_retry=true）— 不再刷新（避免无限循环）
 *   4. 未登录状态 401（sessionStorage 无 user）— 清除会话并跳转登录页
 *   5. 刷新失败 — 清除会话并跳转登录页
 *   6. 非 401 错误 — 原样传播
 *
 * 未覆盖（由 E2E 覆盖）：友好错误提示（showGlobalError → toast）。
 *   原因：vi.mock('axios') 会导致 api.ts 在隔离模块图中求值，其
 *   notificationStore 导入与测试文件的导入实例不同，push 副作用无法跨图
 *   观测。这是 Vitest mock 模块图的已知限制，强行测试会引入脆弱断言。
 *   toast 提示是 UX 优化（非安全/正确性关键），由 e2e-comprehensive/ 验证。
 *
 * 测试策略：
 *   - vi.hoisted 提升 mock 状态，确保 vi.mock 工厂内可引用
 *   - mock axios：create 返回捕获拦截器的实例；post 用于刷新端点；api(cfg) 用于重试
 *   - authStore 真实副作用断言（刷新成功后 user 被更新）
 */

const hoisted = vi.hoisted(() => ({
  interceptorRejected: null as null | ((e: unknown) => unknown),
  apiInstance: null as null | ((cfg: unknown) => unknown),
  axiosPost: null as null | ((url: string, body?: unknown, opts?: unknown) => unknown),
}));

vi.mock('axios', () => ({
  default: Object.assign(
    (cfg: unknown) => hoisted.apiInstance!(cfg),
    {
      create: () => {
        const inst = (cfg: unknown) => hoisted.apiInstance!(cfg);
        inst.interceptors = {
          response: {
            use: (_fulfilled: unknown, rejected: unknown) => {
              hoisted.interceptorRejected = rejected as never;
            },
          },
        };
        hoisted.apiInstance = inst as never;
        return inst;
      },
      post: (url: string, body?: unknown, opts?: unknown) =>
        hoisted.axiosPost!(url, body, opts),
    },
  ),
}));

// 导入触发 api.ts 模块求值 → 注册响应拦截器到 hoisted.interceptorRejected。
// 模块导出本身在测试中不直接调用（拦截器通过 hoisted 状态触发）。
import api from '../api';
void api;

async function triggerRejected(error: unknown) {
  return hoisted.interceptorRejected!(error);
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  useAuthStore.setState({ user: null, isAuthenticated: false });
});

describe('api 响应拦截器', () => {
  describe('错误传播（reject）', () => {
    it('非 401 错误应原样 reject（不尝试刷新）', async () => {
      const error = { response: { status: 403, data: {} }, config: {} };
      await expect(triggerRejected(error)).rejects.toEqual(error);
    });

    it('已重试过的 401（_retry=true）应直接 reject，不再刷新（防无限循环）', async () => {
      const error = {
        response: { status: 401, data: {} },
        config: { _retry: true, url: '/devices' },
      };
      await expect(triggerRejected(error)).rejects.toEqual(error);
    });

    it('登录请求 401 应直接 reject（避免无限循环 → DoS）', async () => {
      const error = { response: { status: 401, data: {} }, config: { url: '/auth/login' } };
      await expect(triggerRejected(error)).rejects.toEqual(error);
    });

    it('刷新请求 401 应直接 reject（避免无限循环 → DoS）', async () => {
      const error = { response: { status: 401, data: {} }, config: { url: '/auth/refresh' } };
      await expect(triggerRejected(error)).rejects.toEqual(error);
    });
  });

  describe('401 未登录处理', () => {
    it('sessionStorage 无 user 时应清除会话并跳转登录页', async () => {
      let assignedHref = '';
      const origLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: new URL('http://localhost/'),
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window.location, 'href', {
        set: (v: string) => { assignedHref = v; },
        get: () => origLocation.href,
        configurable: true,
      });

      const error = { response: { status: 401, data: {} }, config: { url: '/devices' } };
      await expect(triggerRejected(error)).rejects.toEqual(error);
      expect(assignedHref).toBe('/login');
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('401 刷新重试流程', () => {
    it('有 user 且刷新成功时应更新 authStore 并重发原始请求', async () => {
      sessionStorage.setItem('user', JSON.stringify({ username: 'admin' }));

      hoisted.axiosPost = vi.fn().mockResolvedValue({
        data: { userInfo: { username: 'admin', role: 'SystemAdmin' } },
      });
      hoisted.apiInstance = vi.fn().mockResolvedValue({ data: 'retried' });

      const error = { response: { status: 401, data: {} }, config: { url: '/devices' } };
      const result = await triggerRejected(error);

      expect(useAuthStore.getState().user).toEqual({ username: 'admin', role: 'SystemAdmin' });
      expect(hoisted.axiosPost).toHaveBeenCalledWith('/api/v1/auth/refresh', {}, { withCredentials: true });
      expect(result).toEqual({ data: 'retried' });
    });

    it('刷新失败时应清除会话并跳转登录页，并 reject', async () => {
      const user = { username: 'admin', role: 'SystemAdmin' };
      sessionStorage.setItem('user', JSON.stringify(user));
      useAuthStore.setState({ user: user as never, isAuthenticated: true });
      hoisted.axiosPost = vi.fn().mockRejectedValue(new Error('refresh expired'));

      let assignedHref = '';
      const origLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: new URL('http://localhost/'),
        writable: true,
        configurable: true,
      });
      Object.defineProperty(window.location, 'href', {
        set: (v: string) => { assignedHref = v; },
        get: () => origLocation.href,
        configurable: true,
      });

      const error = { response: { status: 401, data: {} }, config: { url: '/devices' } };
      await expect(triggerRejected(error)).rejects.toThrow('refresh expired');
      expect(assignedHref).toBe('/login');
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('刷新成功但无 userInfo 时不应更新 authStore', async () => {
      sessionStorage.setItem('user', JSON.stringify({ username: 'admin' }));
      hoisted.axiosPost = vi.fn().mockResolvedValue({ data: {} });
      hoisted.apiInstance = vi.fn().mockResolvedValue({ data: 'ok' });

      const error = { response: { status: 401, data: {} }, config: { url: '/devices' } };
      await triggerRejected(error);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
