import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeactivateUser,
  useChangeUserRole,
  type UserItem,
} from '../useUsers';

// Mock axios api 模块
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

/** 创建 QueryClient 包装器，用于 hook 测试 */
const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

/** 模拟用户数据 */
const mockUser: UserItem = {
  id: 'user-001',
  username: 'admin',
  displayName: '管理员',
  role: 'SystemAdmin',
  email: 'admin@example.com',
  phone: '13800138000',
  isActive: true,
  createdAt: '2026-01-01T08:00:00Z',
  mustChangePassword: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// useUsers — 用户列表查询
// ---------------------------------------------------------------------------
describe('useUsers', () => {
  it('应获取用户分页列表', async () => {
    const mockPagedResult = {
      items: [mockUser],
      total: 1,
      page: 1,
      pageSize: 20,
    };

    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => useUsers({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPagedResult);
    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/admin/users?'),
    );
  });

  it('应传递分页和搜索参数', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { items: [], total: 0, page: 2, pageSize: 10 },
    });

    const { result } = renderHook(
      () => useUsers({ page: 2, pageSize: 10, keyword: '张三' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('pageSize=10');
    expect(calledUrl).toContain('keyword=');
  });

  it('无参数时应仅含基础查询字符串', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    });

    const { result } = renderHook(
      () => useUsers(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    expect(calledUrl).toBe('/admin/users?');
  });

  it('API 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('服务器异常'));

    const { result } = renderHook(
      () => useUsers({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// useCreateUser — 创建用户
// ---------------------------------------------------------------------------
describe('useCreateUser', () => {
  it('应调用 POST 接口创建用户', async () => {
    const payload = {
      username: 'newuser',
      password: 'password123',
      displayName: '新用户',
      role: 'Viewer',
      email: 'new@example.com',
      phone: '13900139000',
    };

    mockedApi.post.mockResolvedValueOnce({
      data: { ...mockUser, ...payload, id: 'user-002' },
    });

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/admin/users', payload);
  });

  it('成功后应刷新用户列表缓存', async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');

    mockedApi.post.mockResolvedValueOnce({ data: mockUser });

    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      username: 'test',
      password: 'test1234',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['admin', 'users'] }),
    );

    invalidateSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// useUpdateUser — 更新用户
// ---------------------------------------------------------------------------
describe('useUpdateUser', () => {
  it('应调用 PUT 接口更新用户信息', async () => {
    const updatedUser = { ...mockUser, displayName: '新名字' };
    mockedApi.put.mockResolvedValueOnce({ data: updatedUser });

    const { result } = renderHook(() => useUpdateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'user-001',
      displayName: '新名字',
      email: 'new@example.com',
      phone: '13900139000',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/admin/users/user-001',
      expect.objectContaining({ displayName: '新名字' }),
    );
  });

  it('成功后应刷新用户列表缓存', async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');

    mockedApi.put.mockResolvedValueOnce({ data: mockUser });

    const { result } = renderHook(() => useUpdateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'user-001', displayName: '改名' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['admin', 'users'] }),
    );

    invalidateSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// useDeactivateUser — 停用用户
// ---------------------------------------------------------------------------
describe('useDeactivateUser', () => {
  it('应调用 DELETE 接口停用用户', async () => {
    mockedApi.delete.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useDeactivateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('user-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.delete).toHaveBeenCalledWith('/admin/users/user-001');
  });

  it('成功后应刷新用户列表缓存', async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');

    mockedApi.delete.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useDeactivateUser(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('user-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['admin', 'users'] }),
    );

    invalidateSpy.mockRestore();
  });
});

// ---------------------------------------------------------------------------
// useChangeUserRole — 变更角色
// ---------------------------------------------------------------------------
describe('useChangeUserRole', () => {
  it('应调用 PUT 接口变更角色', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useChangeUserRole(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'user-001', role: 'Technician' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/admin/users/user-001/role',
      { role: 'Technician' },
    );
  });

  it('成功后应刷新用户列表缓存', async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');

    mockedApi.put.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useChangeUserRole(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'user-001', role: 'Viewer' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['admin', 'users'] }),
    );

    invalidateSpy.mockRestore();
  });
});
