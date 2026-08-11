import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import api from '../api';
import { useAuthStore } from '../../stores/authStore';
import { restoreSessionFromCookie, revokeSessionAndClearLocalState } from '../authSession';

vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);
const mockedAuthStore = vi.mocked(useAuthStore);
const mockedAxios = vi.mocked(axios);

const mockUser = {
  id: 'user-001',
  tenantId: 'tenant-001',
  username: 'admin',
  displayName: '系统管理员',
  role: 'SystemAdmin',
  email: 'admin@example.com',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  mustChangePassword: false,
  mfaEnabled: true,
};

describe('revokeSessionAndClearLocalState', () => {
  const logout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
    mockedAuthStore.getState.mockReturnValue(
      { logout } as unknown as ReturnType<typeof useAuthStore.getState>,
    );
  });

  describe('restoreSessionFromCookie', () => {
    it('应使用 HttpOnly Cookie 从 /auth/me 恢复完整用户上下文', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: mockUser } as never);

      await expect(restoreSessionFromCookie()).resolves.toEqual({ user: mockUser });
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/v1/auth/me', {
        withCredentials: true,
        timeout: 5000,
      });
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('access token 过期但 refresh token 有效时应刷新并恢复会话', async () => {
      mockedAxios.get
        .mockRejectedValueOnce({ response: { status: 401 } })
        .mockResolvedValueOnce({ data: mockUser } as never);
      mockedAxios.post.mockResolvedValueOnce({
        data: { expiresIn: 900, userInfo: mockUser },
      } as never);

      await expect(restoreSessionFromCookie()).resolves.toEqual({
        user: mockUser,
        expiresIn: 900,
      });
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/v1/auth/refresh', {}, {
        withCredentials: true,
        timeout: 5000,
      });
    });

    it('没有有效 Cookie 或网络不可用时应安全返回空会话且不触发登录页跳转', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('network unavailable'));

      await expect(restoreSessionFromCookie()).resolves.toBeNull();
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  it('应先撤销服务端会话，再清理本地认证状态', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: null });

    await revokeSessionAndClearLocalState();

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout');
    expect(logout).toHaveBeenCalledOnce();
  });

  it('服务端登出失败时仍必须清理本地认证状态', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('network unavailable'));

    await revokeSessionAndClearLocalState();

    expect(logout).toHaveBeenCalledOnce();
  });
});
