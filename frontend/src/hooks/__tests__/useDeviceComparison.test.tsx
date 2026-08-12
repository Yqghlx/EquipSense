import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import { useDeviceComparison } from '../useDeviceComparison';

vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

interface DeviceComparisonQueryContract {
  deviceType?: string;
  metric?: string;
  hours?: number;
  deviceIds?: string[];
}

const useDeviceComparisonContract = useDeviceComparison as unknown as (
  params: DeviceComparisonQueryContract,
) => ReturnType<typeof useDeviceComparison>;

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

const mockResult = {
  deviceType: 'pump',
  metric: 'temperature',
  hours: 24,
  groupMean: 53.2,
  groupStdDev: 1.3,
  devices: [
    {
      deviceId: '11111111-1111-1111-1111-111111111111',
      deviceCode: 'P-001',
      deviceName: '一号泵',
      averageValue: 52.1,
      minValue: 50.5,
      maxValue: 54.4,
      latestValue: 53.8,
      dataPointCount: 18,
      zScore: -0.2,
      isOutlier: false,
    },
    {
      deviceId: '22222222-2222-2222-2222-222222222222',
      deviceCode: 'P-002',
      deviceName: '二号泵',
      averageValue: 54.3,
      minValue: 53.1,
      maxValue: 56.8,
      latestValue: 55.9,
      dataPointCount: 18,
      zScore: 0.9,
      isOutlier: false,
    },
  ],
  message: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useDeviceComparison', () => {
  it('应对 deviceIds 去重排序并以重复 query 参数写入 URL', async () => {
    mockedApi.get.mockResolvedValue({ data: mockResult });

    renderHook(
      () => useDeviceComparisonContract({
        deviceType: 'pump',
        metric: 'temperature',
        hours: 24,
        deviceIds: [
          '33333333-3333-3333-3333-333333333333',
          '11111111-1111-1111-1111-111111111111',
          '22222222-2222-2222-2222-222222222222',
          '11111111-1111-1111-1111-111111111111',
        ],
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    const search = new URLSearchParams(calledUrl.split('?')[1] ?? '');

    expect(search.get('deviceType')).toBe('pump');
    expect(search.get('metric')).toBe('temperature');
    expect(search.get('hours')).toBe('24');
    expect(search.getAll('deviceIds')).toEqual([
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
    ]);
  });

  it.each([
    ['[A,A,B]', [
      '11111111-1111-1111-1111-111111111111',
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
    ], [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
    ]],
    ['[A,B,C,D,E,E]', [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
      '55555555-5555-5555-5555-555555555555',
      '55555555-5555-5555-5555-555555555555',
    ], [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
      '55555555-5555-5555-5555-555555555555',
    ]],
  ])('去重后有 %s 个合法设备时应请求排序后的唯一 ID', async (_, deviceIds, normalizedDeviceIds) => {
    mockedApi.get.mockResolvedValueOnce({ data: mockResult });

    renderHook(
      () => useDeviceComparisonContract({
        deviceType: 'pump',
        metric: 'temperature',
        hours: 24,
        deviceIds,
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    const search = new URLSearchParams(calledUrl.split('?')[1] ?? '');
    expect(search.getAll('deviceIds')).toEqual(normalizedDeviceIds);
  });

  it('相同 deviceIds 集合仅因选择顺序变化时不应重复请求', async () => {
    mockedApi.get.mockResolvedValue({ data: mockResult });

    const { rerender } = renderHook(
      ({ params }) => useDeviceComparisonContract(params),
      {
        initialProps: {
          params: {
            deviceType: 'pump',
            metric: 'temperature',
            hours: 24,
            deviceIds: [
              '22222222-2222-2222-2222-222222222222',
              '11111111-1111-1111-1111-111111111111',
            ],
          } satisfies DeviceComparisonQueryContract,
        },
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));

    rerender({
      params: {
        deviceType: 'pump',
        metric: 'temperature',
        hours: 24,
        deviceIds: [
          '11111111-1111-1111-1111-111111111111',
          '22222222-2222-2222-2222-222222222222',
          '11111111-1111-1111-1111-111111111111',
        ],
      } satisfies DeviceComparisonQueryContract,
    });

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));
  });

  it.each([
    ['缺少设备类型', { metric: 'temperature', hours: 24, deviceIds: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'] }],
    ['缺少指标', { deviceType: 'pump', hours: 24, deviceIds: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'] }],
    ['缺少时间窗口', { deviceType: 'pump', metric: 'temperature', deviceIds: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'] }],
    ['未选择设备', { deviceType: 'pump', metric: 'temperature', hours: 24 }],
    ['只选择 1 台设备', { deviceType: 'pump', metric: 'temperature', hours: 24, deviceIds: ['11111111-1111-1111-1111-111111111111'] }],
  ])('条件不完整时应禁用查询：%s', (_, params) => {
    const { result } = renderHook(
      () => useDeviceComparisonContract(params),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it.each([
    ['空数组', []],
    ['去重后 1 个唯一 ID', ['11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111']],
    ['去重后 6 个唯一 ID（原始数组含重复）', [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
      '55555555-5555-5555-5555-555555555555',
      '66666666-6666-6666-6666-666666666666',
      '66666666-6666-6666-6666-666666666666',
    ]],
  ])('去重后唯一设备数为 %s 时应保持 idle 且不调用 API', (_, deviceIds) => {
    const { result } = renderHook(
      () => useDeviceComparisonContract({
        deviceType: 'pump',
        metric: 'temperature',
        hours: 24,
        deviceIds,
      }),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it.each([
    ['2 台设备', ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222']],
    ['5 台设备', [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
      '55555555-5555-5555-5555-555555555555',
    ]],
  ])('设备数合法时应发起查询：%s', async (_, deviceIds) => {
    mockedApi.get.mockResolvedValueOnce({ data: mockResult });

    renderHook(
      () => useDeviceComparisonContract({
        deviceType: 'pump',
        metric: 'temperature',
        hours: 24,
        deviceIds,
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledTimes(1));
  });
});
