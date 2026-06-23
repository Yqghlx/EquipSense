import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

/**
 * useTokenRefresh Hook 测试
 *
 * 验证主动刷新调度的集成正确性。核心回归场景：
 *   - 页面刷新（重新挂载 hook）时，若持久化的过期时间戳显示【接近过期】，
 *     应立即发起刷新，而非误判为"刚签发的满额令牌"推迟刷新。
 *   - 旧版用 performance.timeOrigin 近似签发时间，刷新后 always 算出满额剩余，
 *     导致接近过期的令牌不被及时刷新，过期窗口内请求吃 401。
 *
 * 用真实计时器：近过期分支走同步立即刷新（不经 setTimeout），断言 axios.post 被调用即可。
 */

// 认证开关（hoisted，确保 vi.mock 提升时可访问）
const authState = vi.hoisted(() => ({ isAuthenticated: true }));

const mockPost = vi.fn().mockResolvedValue({ data: {} });

vi.mock('axios', () => ({
  default: { post: (...args: unknown[]) => mockPost(...args) },
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector: (s: { isAuthenticated: boolean }) => unknown) =>
    selector({ isAuthenticated: authState.isAuthenticated }),
}));

import useTokenRefresh from '../useTokenRefresh';

beforeEach(() => {
  sessionStorage.clear();
  mockPost.mockClear();
  authState.isAuthenticated = true;
});

afterEach(() => {
  // 还原：避免下一个文件复用模块缓存时 isAuthenticated 残留
  authState.isAuthenticated = true;
});

describe('useTokenRefresh', () => {
  it('近过期（剩余 < 阈值）应立即刷新，不等定时器', () => {
    // 持久化过期时间戳 = 当前 + 60s（< 5min 续期阈值）→ 模拟"刷新页面时令牌快过期"
    sessionStorage.setItem('token_expires_at_ms', String(Date.now() + 60_000));

    const { unmount } = renderHook(() => useTokenRefresh());

    // useEffect 同步运行 scheduleFromStorage → remainingMs(≈60s) ≤ 阈值 → 立即 refreshToken()
    expect(mockPost).toHaveBeenCalledWith(
      '/api/v1/auth/refresh',
      {},
      { withCredentials: true },
    );

    unmount();
  });

  it('【回归】刷新页面时令牌接近过期不应误判为满额而推迟刷新', () => {
    // 关键：存的是【绝对过期时间戳】（快过期），而非旧版的"时长 900s"。
    // 旧版会算出 remaining ≈ 900s（满额）→ 走 setTimeout 推迟，不立即刷新（BUG）。
    // 新版读取真实剩余 ≈ 90s → 立即刷新。
    sessionStorage.setItem('token_expires_at_ms', String(Date.now() + 90_000));

    const { unmount } = renderHook(() => useTokenRefresh());

    expect(mockPost).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('远离过期（剩余 > 阈值）不应立即刷新，而是排定延迟刷新', () => {
    // 过期时间戳 = 当前 + 30min，剩余 ≈ 30min 远大于 5min 阈值
    sessionStorage.setItem('token_expires_at_ms', String(Date.now() + 30 * 60_000));

    const { unmount } = renderHook(() => useTokenRefresh());

    // 不立即刷新（排定在 ~25min 后）
    expect(mockPost).not.toHaveBeenCalled();

    unmount();
  });

  it('未认证时不调度刷新', () => {
    sessionStorage.setItem('token_expires_at_ms', String(Date.now() + 60_000));
    authState.isAuthenticated = false;

    const { unmount } = renderHook(() => useTokenRefresh());

    expect(mockPost).not.toHaveBeenCalled();

    unmount();
  });

  it('无过期记录时用默认有效期兜底，不立即刷新', () => {
    // sessionStorage 无 token_expires_at_ms（旧版残留 / 异常）→ 默认 900s
    const { unmount } = renderHook(() => useTokenRefresh());

    expect(mockPost).not.toHaveBeenCalled();

    unmount();
  });
});
