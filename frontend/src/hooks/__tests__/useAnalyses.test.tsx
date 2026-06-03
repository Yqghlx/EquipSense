import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import { useAnalyses, useAnalysis, useTriggerAnalysis } from '../useAnalyses';
import type { Analysis, PagedResult } from '../../types';

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

/** 模拟分析结果数据 */
const mockAnalysis: Analysis = {
  id: 'analysis-001',
  alertId: 'alert-001',
  deviceId: 'device-001',
  level: 'rule',
  status: 'completed',
  confidence: 0.85,
  dataQualityScore: 90,
  rootCause: '轴承磨损导致振动超标',
  suggestion: '建议更换轴承并进行动平衡校准',
  processingTimeMs: 1200,
  completedAt: '2026-06-03T09:00:00Z',
  createdAt: '2026-06-03T08:59:00Z',
};

/** 模拟分析分页结果 */
const mockPagedResult: PagedResult<Analysis> = {
  items: [mockAnalysis],
  total: 1,
  page: 1,
  pageSize: 20,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// useAnalyses — 分析结果分页列表查询
// ============================================================================
describe('useAnalyses', () => {
  it('应成功获取分析结果列表', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => useAnalyses({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPagedResult);
    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/analyses?'),
    );
  });

  it('应正确传递设备 ID、级别和状态过滤参数', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () =>
        useAnalyses(
          { page: 1, pageSize: 20 },
          { deviceId: 'device-001', level: 'rule', status: 'completed' },
        ),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('deviceId=device-001');
    expect(calledUrl).toContain('level=rule');
    expect(calledUrl).toContain('status=completed');
  });

  it('API 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('服务器异常'));

    const { result } = renderHook(
      () => useAnalyses({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

// ============================================================================
// useAnalysis — 单个分析结果详情查询
// ============================================================================
describe('useAnalysis', () => {
  it('应成功获取单个分析结果详情', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockAnalysis });

    const { result } = renderHook(
      () => useAnalysis('analysis-001'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAnalysis);
    expect(mockedApi.get).toHaveBeenCalledWith('/analyses/analysis-001');
  });

  it('id 为空时应禁用查询', () => {
    const { result } = renderHook(
      () => useAnalysis(''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

// ============================================================================
// useTriggerAnalysis — 触发新的 AI 分析
// ============================================================================
describe('useTriggerAnalysis', () => {
  it('应调用 POST 接口触发分析', async () => {
    const triggerReq = { alertId: 'alert-001' };

    mockedApi.post.mockResolvedValueOnce({ data: mockAnalysis });

    const { result } = renderHook(
      () => useTriggerAnalysis(),
      { wrapper: createWrapper() },
    );

    result.current.mutate(triggerReq);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/analyses', triggerReq);
    expect(result.current.data).toEqual(mockAnalysis);
  });
});
