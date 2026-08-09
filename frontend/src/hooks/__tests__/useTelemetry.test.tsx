import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import { useRecentTelemetry, useTelemetry } from '../useTelemetry';
import type { TelemetryDataPoint } from '../useTelemetry';

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

/** 模拟遥测数据点，字段严格匹配 TelemetryDataPoint 类型 */
const mockTelemetryData: TelemetryDataPoint[] = [
  { time: '2026-01-01T08:00:00Z', value: 72.5 },
  { time: '2026-01-01T08:01:00Z', value: 73.1 },
  { time: '2026-01-01T08:02:00Z', value: 74.8 },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useTelemetry', () => {
  it('应成功获取遥测数据（带 metric/startTime/endTime 参数）', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockTelemetryData });

    const { result } = renderHook(
      () =>
        useTelemetry(
          'device-001',
          'temperature',
          '2026-01-01T08:00:00Z',
          '2026-01-01T09:00:00Z',
        ),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTelemetryData);

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/telemetry/device-001?');
    expect(calledUrl).toContain('metric=temperature');
    expect(calledUrl).toContain('startTime=2026-01-01T08%3A00%3A00Z');
    expect(calledUrl).toContain('endTime=2026-01-01T09%3A00%3A00Z');
  });

  it('deviceId 为空时应禁用查询', () => {
    const { result } = renderHook(
      () => useTelemetry(''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('API 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('网络异常'));

    const { result } = renderHook(
      () => useTelemetry('device-001', 'temperature'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });

  it('滚动时间窗在重渲染时保持稳定且重新获取时更新边界', async () => {
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValue(new Date('2026-01-01T09:00:00Z').getTime());
    mockedApi.get.mockResolvedValue({ data: mockTelemetryData });

    try {
      const { result, rerender } = renderHook(
        () => useRecentTelemetry('device-001', 'temperature', 60 * 60 * 1000),
        { wrapper: createWrapper() },
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      rerender();

      expect(mockedApi.get).toHaveBeenCalledTimes(1);
      const firstUrl = new URL(String(mockedApi.get.mock.calls[0][0]), 'http://localhost');
      expect(firstUrl.searchParams.get('startTime')).toBe('2026-01-01T08:00:00.000Z');
      expect(firstUrl.searchParams.get('endTime')).toBe('2026-01-01T09:00:00.000Z');

      nowSpy.mockReturnValue(new Date('2026-01-01T10:00:00Z').getTime());
      await result.current.refetch();

      expect(mockedApi.get).toHaveBeenCalledTimes(2);
      const refreshedUrl = new URL(String(mockedApi.get.mock.calls[1][0]), 'http://localhost');
      expect(refreshedUrl.searchParams.get('startTime')).toBe('2026-01-01T09:00:00.000Z');
      expect(refreshedUrl.searchParams.get('endTime')).toBe('2026-01-01T10:00:00.000Z');
    } finally {
      nowSpy.mockRestore();
    }
  });
});
