import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '../api';
import { useAuthStore } from '../../stores/authStore';
import { revokeSessionAndClearLocalState } from '../authSession';

vi.mock('../api', () => ({
  default: {
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

describe('revokeSessionAndClearLocalState', () => {
  const logout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockedAuthStore.getState.mockReturnValue(
      { logout } as unknown as ReturnType<typeof useAuthStore.getState>,
    );
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
