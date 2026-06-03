import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import { useSubscription, useChangePlan } from '../useSubscription';
import type { SubscriptionInfo } from '../useSubscription';

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

/** 模拟租户订阅信息 */
const mockSubscription: SubscriptionInfo = {
  tenantId: 'tenant-001',
  plan: 'professional',
  planDisplayName: '专业版',
  maxDevices: 100,
  currentDevices: 42,
  maxUsers: 20,
  currentUsers: 8,
  dataRetentionDays: 90,
  isTrial: false,
  isActive: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useSubscription', () => {
  it('应成功获取租户订阅信息', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockSubscription });

    const { result } = renderHook(
      () => useSubscription('tenant-001'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockSubscription);
    expect(mockedApi.get).toHaveBeenCalledWith('/admin/tenants/tenant-001/subscription');
  });

  it('tenantId 为空时应禁用查询', () => {
    const { result } = renderHook(
      () => useSubscription(undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('tenantId 为空字符串时应禁用查询', () => {
    const { result } = renderHook(
      () => useSubscription(''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('API 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('租户不存在'));

    const { result } = renderHook(
      () => useSubscription('invalid-tenant'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useChangePlan', () => {
  it('应调用 PUT 接口变更租户计划', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(
      () => useChangePlan(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ tenantId: 'tenant-001', plan: 'enterprise' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/admin/tenants/tenant-001/plan',
      { plan: 'enterprise' },
    );
  });

  it('变更计划 API 失败时应返回错误状态', async () => {
    mockedApi.put.mockRejectedValueOnce(new Error('计划不可用'));

    const { result } = renderHook(
      () => useChangePlan(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ tenantId: 'tenant-001', plan: 'invalid-plan' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
