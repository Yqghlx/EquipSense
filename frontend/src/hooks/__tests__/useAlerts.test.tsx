import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import { useAlerts, useAlert, useAcknowledgeAlert, useResolveAlert } from '../useAlerts';
import type { Alert, PagedResult } from '../../types';

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

/** 模拟告警数据，字段严格匹配 Alert 类型定义 */
const mockAlert: Alert = {
  id: 'alert-001',
  alertCode: 'ALM-20260101-001',
  ruleId: 'rule-001',
  deviceId: 'device-001',
  deviceName: '一号水泵',
  severity: 'Critical',
  metric: 'temperature',
  value: 95.6,
  threshold: 85,
  message: '一号水泵温度超过阈值',
  status: 'Active',
  occurredAt: '2026-01-01T08:30:00Z',
  triggerCount: 1,
  acknowledged: false,
  resolved: false,
  createdAt: '2026-01-01T08:30:00Z',
};

const mockPagedResult: PagedResult<Alert> = {
  items: [mockAlert],
  total: 1,
  page: 1,
  pageSize: 20,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAlerts', () => {
  it('应成功获取告警列表', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => useAlerts({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPagedResult);
    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/alerts?'),
    );
  });

  it('应正确传递状态、严重级别和设备 ID 过滤参数', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () =>
        useAlerts(
          { page: 1, pageSize: 20 },
          { status: 'Active', severity: 'Critical', deviceId: 'device-001' },
        ),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('status=Active');
    expect(calledUrl).toContain('severity=Critical');
    expect(calledUrl).toContain('deviceId=device-001');
  });

  it('应正确传递排序参数', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () =>
        useAlerts({ page: 1, pageSize: 20, sort: 'occurredAt', order: 'desc' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('sort=occurredAt');
    expect(calledUrl).toContain('order=desc');
  });

  it('API 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('服务器异常'));

    const { result } = renderHook(
      () => useAlerts({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useAlert', () => {
  it('应成功获取单个告警详情', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockAlert });

    const { result } = renderHook(
      () => useAlert('alert-001'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAlert);
    expect(mockedApi.get).toHaveBeenCalledWith('/alerts/alert-001');
  });

  it('id 为空时应禁用查询', () => {
    const { result } = renderHook(
      () => useAlert(''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

describe('useAcknowledgeAlert', () => {
  it('应调用 PUT 接口确认告警', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(
      () => useAcknowledgeAlert(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('alert-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith('/alerts/alert-001/acknowledge');
  });
});

describe('useResolveAlert', () => {
  it('应调用 PUT 接口解决告警', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(
      () => useResolveAlert(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('alert-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith('/alerts/alert-001/resolve');
  });
});
