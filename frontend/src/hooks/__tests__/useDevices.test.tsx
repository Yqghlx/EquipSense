import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import { useDevices, useDevice, useCreateDevice, useUpdateDevice, useDeleteDevice } from '../useDevices';
import type { Device, PagedResult } from '../../types';

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

const mockDevice: Device = {
  id: 'device-001',
  deviceCode: 'PUMP-001',
  name: '一号水泵',
  type: 'pump',
  manufacturer: '西门子',
  model: 'S200',
  status: 'Online',
  criticality: 'Critical',
  healthScore: 92,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-15T12:00:00Z',
};

const mockPagedResult: PagedResult<Device> = {
  items: [mockDevice],
  total: 1,
  page: 1,
  pageSize: 20,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useDevices', () => {
  it('应成功获取设备列表', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => useDevices({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPagedResult);
    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/devices?'),
    );
  });

  it('应正确传递状态和设备类型过滤参数', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => useDevices({ page: 1, pageSize: 20, status: 'Online', deviceType: 'pump' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('status=Online');
    expect(calledUrl).toContain('deviceType=pump');
  });

  it('应正确传递排序参数', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => useDevices({ page: 1, pageSize: 20, sort: 'createdAt', order: 'desc' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('sort=createdAt');
    expect(calledUrl).toContain('order=desc');
  });

  it('API 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('服务器异常'));

    const { result } = renderHook(
      () => useDevices({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useDevice', () => {
  it('应成功获取单个设备详情', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockDevice });

    const { result } = renderHook(
      () => useDevice('device-001'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockDevice);
    expect(mockedApi.get).toHaveBeenCalledWith('/devices/device-001');
  });

  it('id 为空时应禁用查询', () => {
    const { result } = renderHook(
      () => useDevice(''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

describe('useCreateDevice', () => {
  it('应调用 POST 接口创建设备', async () => {
    const newDeviceReq = {
      deviceCode: 'PUMP-002',
      name: '二号水泵',
      type: 'pump',
      manufacturer: 'ABB',
      model: 'X3',
    };

    mockedApi.post.mockResolvedValueOnce({ data: mockDevice });

    const { result } = renderHook(
      () => useCreateDevice(),
      { wrapper: createWrapper() },
    );

    result.current.mutate(newDeviceReq);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/devices', newDeviceReq);
    expect(result.current.data).toEqual(mockDevice);
  });
});

describe('useUpdateDevice', () => {
  it('应调用 PUT 接口更新设备', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: mockDevice });

    const { result } = renderHook(
      () => useUpdateDevice(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      id: 'device-001',
      deviceCode: 'PUMP-001',
      name: '一号水泵（已更新）',
      type: 'pump',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 源码中 mutationFn 解构了 { id, ...req }，所以发送给 API 的对象不包含 id
    expect(mockedApi.put).toHaveBeenCalledWith(
      '/devices/device-001',
      expect.objectContaining({ name: '一号水泵（已更新）', deviceCode: 'PUMP-001' }),
    );
  });
});

describe('useDeleteDevice', () => {
  it('应调用 DELETE 接口删除设备', async () => {
    mockedApi.delete.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(
      () => useDeleteDevice(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('device-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.delete).toHaveBeenCalledWith('/devices/device-001');
  });
});
