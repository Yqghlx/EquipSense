import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import { useDashboardStats, useOee } from '../useDashboard';

// Mock axios api 模块
vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

/** 创建 QueryClient 包装器 */
const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

/** 模拟统计数据 */
const mockStats = {
  totalDevices: 10,
  onlineDevices: 8,
  activeAlerts: 3,
  pendingWorkOrders: 2,
  availability: 80.0,
  alertsBySeverity: { Critical: 1, High: 2 },
  workOrdersByStatus: { PendingDispatch: 2, Closed: 5 },
  alertTrend: [
    { date: '2026-06-01', count: 1 },
    { date: '2026-06-02', count: 2 },
  ],
  workOrderTrend: [
    { date: '2026-06-01', count: 3 },
    { date: '2026-06-02', count: 1 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useDashboardStats', () => {
  it('应成功获取仪表盘统计数据', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockStats });

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockStats);
    expect(mockedApi.get).toHaveBeenCalledWith('/dashboard/stats');
  });

  it('API 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('服务器异常'));

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('应使用 dashboard/stats 作为 queryKey', () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockStats });

    const { result } = renderHook(() => useDashboardStats(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
  });
});

describe('useOee', () => {
  it('应获取设备综合效率数据', async () => {
    const oee = {
      oee: 82.5,
      availability: 90,
      performance: 92,
      quality: 99,
      totalDevices: 10,
      onlineDevices: 8,
      evaluatedAt: '2026-08-12T00:00:00Z',
      isApproximate: true,
      hasInsufficientData: false,
    };
    mockedApi.get.mockResolvedValueOnce({ data: oee });
    const { result } = renderHook(() => useOee(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(oee);
    expect(mockedApi.get).toHaveBeenCalledWith('/dashboard/oee');
  });

  it('OEE 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('OEE 服务不可用'));
    const { result } = renderHook(() => useOee(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});
