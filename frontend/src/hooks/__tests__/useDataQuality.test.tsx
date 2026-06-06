import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import { useDataQuality, useDataQualityOverview } from '../useDataQuality';

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

describe('useDataQuality', () => {
  it('应成功获取设备数据质量评分', async () => {
    const mockReport = {
      deviceId: 'device-001',
      metric: 'temperature',
      score: 85.5,
      dimensions: {
        completeness: 90,
        accuracy: 88,
        timeliness: 82,
        consistency: 85,
        validity: 80,
      },
      sampleCount: 1000,
      calculatedAt: '2026-06-01T00:00:00Z',
    };

    mockedApi.get.mockResolvedValueOnce({ data: mockReport });

    const { result } = renderHook(
      () => useDataQuality('device-001', 'temperature'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockReport);
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/data-quality/device-001?metric=temperature',
    );
  });

  it('deviceId 为空时应禁用查询', () => {
    const { result } = renderHook(
      () => useDataQuality('', 'temperature'),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('API 失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('服务器异常'));

    const { result } = renderHook(
      () => useDataQuality('device-001', 'temperature'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useDataQualityOverview', () => {
  it('应成功获取概览数据', async () => {
    const mockOverview = {
      deviceId: 'device-001',
      overallScore: 88.2,
      metrics: [
        {
          deviceId: 'device-001',
          metric: 'temperature',
          score: 85.5,
          dimensions: {
            completeness: 90,
            accuracy: 88,
            timeliness: 82,
            consistency: 85,
            validity: 80,
          },
          sampleCount: 1000,
          calculatedAt: '2026-06-01T00:00:00Z',
        },
      ],
    };

    mockedApi.get.mockResolvedValueOnce({ data: mockOverview });

    const { result } = renderHook(
      () => useDataQualityOverview('device-001'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockOverview);
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/data-quality/device-001/overview',
    );
  });

  it('deviceId 为空时应禁用查询', () => {
    const { result } = renderHook(
      () => useDataQualityOverview(''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('应传递正确的 deviceId 参数', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(
      () => useDataQualityOverview('device-002'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 验证请求 URL 中包含正确的 deviceId
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/data-quality/device-002/overview',
    );
  });
});
