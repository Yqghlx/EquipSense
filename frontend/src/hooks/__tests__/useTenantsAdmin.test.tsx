import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import {
  useTenantsAdmin,
  useTenantDetail,
  useGlobalStats,
  useFreezeTenant,
  useUnfreezeTenant,
  useUpdateTimeZone,
} from '../useTenantsAdmin';

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useTenantsAdmin', () => {
  it('应获取租户分页列表', async () => {
    const mockPagedResult = {
      items: [
        {
          id: 'tenant-001',
          name: '测试租户',
          slug: 'test-tenant',
          plan: 'Basic',
          maxDevices: 100,
          maxUsers: 50,
          isActive: true,
          createdAt: '2026-01-01T00:00:00Z',
          status: 'Active',
          currentDeviceCount: 10,
          currentUserCount: 5,
          dataRetentionDays: 90,
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    };

    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => useTenantsAdmin({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPagedResult);
    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/admin/tenants?'),
    );
  });

  it('应传递分页和搜索参数', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { items: [], total: 0, page: 2, pageSize: 10 } });

    const { result } = renderHook(
      () => useTenantsAdmin({ page: 2, pageSize: 10, keyword: '测试' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('page=2');
    expect(calledUrl).toContain('pageSize=10');
    expect(calledUrl).toContain('keyword=%E6%B5%8B%E8%AF%95');
  });

  it('keyword 为空不应传参', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { items: [], total: 0, page: 1, pageSize: 20 } });

    const { result } = renderHook(
      () => useTenantsAdmin({ page: 1, pageSize: 20, keyword: '' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    // 空字符串属于 falsy，不应拼接 keyword 参数
    expect(calledUrl).not.toContain('keyword=');
  });
});

describe('useTenantDetail', () => {
  it('应获取租户详情', async () => {
    const mockDetail = {
      id: 'tenant-001',
      name: '测试租户',
      slug: 'test-tenant',
      plan: 'Basic',
      maxDevices: 100,
      maxUsers: 50,
      isActive: true,
      createdAt: '2026-01-01T00:00:00Z',
      status: 'Active',
      currentDeviceCount: 10,
      currentUserCount: 5,
      dataRetentionDays: 90,
      activeAlertCount: 3,
      pendingWorkOrderCount: 2,
      monthlyAnalysisCount: 150,
      adminUsername: 'admin',
      adminEmail: 'admin@test.com',
    };

    mockedApi.get.mockResolvedValueOnce({ data: mockDetail });

    const { result } = renderHook(
      () => useTenantDetail('tenant-001'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockDetail);
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/tenants/tenant-001/detail');
  });

  it('id 为空应禁用查询', () => {
    const { result } = renderHook(
      () => useTenantDetail(undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

describe('useGlobalStats', () => {
  it('非系统管理员应禁用全局统计查询', () => {
    const { result } = renderHook(
      () => useGlobalStats({ enabled: false }),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('应获取全局统计', async () => {
    const mockStats = {
      totalTenants: 50,
      activeTenants: 40,
      trialTenants: 5,
      frozenTenants: 5,
      totalDevices: 1200,
      totalUsers: 300,
    };

    mockedApi.get.mockResolvedValueOnce({ data: mockStats });

    const { result } = renderHook(
      () => useGlobalStats(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockStats);
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/tenants/stats');
  });
});

describe('useFreezeTenant', () => {
  it('应调用 PUT freeze 接口', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(
      () => useFreezeTenant(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('tenant-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith('/admin/tenants/tenant-001/freeze');
  });

  it('成功后应刷新列表', async () => {
    const invalidateSpy = vi.spyOn(
      QueryClient.prototype,
      'invalidateQueries',
    );

    mockedApi.put.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(
      () => useFreezeTenant(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('tenant-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 冻结成功后应刷新租户列表和全局统计
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['admin', 'tenants'] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['admin', 'globalStats'] }),
    );

    invalidateSpy.mockRestore();
  });
});

describe('useUnfreezeTenant', () => {
  it('应调用 PUT unfreeze 接口', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(
      () => useUnfreezeTenant(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('tenant-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith('/admin/tenants/tenant-001/unfreeze');
  });

  it('成功后应刷新列表', async () => {
    const invalidateSpy = vi.spyOn(
      QueryClient.prototype,
      'invalidateQueries',
    );

    mockedApi.put.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(
      () => useUnfreezeTenant(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('tenant-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 解冻成功后应刷新租户列表和全局统计
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['admin', 'tenants'] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['admin', 'globalStats'] }),
    );

    invalidateSpy.mockRestore();
  });
});

describe('useUpdateTimeZone', () => {
  it('应调用 PUT /admin/tenants/{id} 并 body 只含 timeZone', async () => {
    mockedApi.put.mockResolvedValueOnce({
      data: { id: 'tenant-001', timeZone: 'Asia/Shanghai' },
    });

    const { result } = renderHook(
      () => useUpdateTimeZone(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ id: 'tenant-001', timeZone: 'Asia/Shanghai' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/admin/tenants/tenant-001',
      { timeZone: 'Asia/Shanghai' },
    );
  });

  it('成功后应刷新租户列表和 Dashboard 缓存', async () => {
    const invalidateSpy = vi.spyOn(
      QueryClient.prototype,
      'invalidateQueries',
    );

    mockedApi.put.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(
      () => useUpdateTimeZone(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ id: 'tenant-001', timeZone: 'UTC' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 时区变更后 Dashboard 趋势聚合会按新时区重新计算，必须失效 dashboard 缓存
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['admin', 'tenants'] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['dashboard'] }),
    );

    invalidateSpy.mockRestore();
  });
});
