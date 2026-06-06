import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import {
  useGatewayDevices,
  useTestConnection,
  useCreateGatewayDevice,
  useDeleteGatewayDevice,
} from '../useGatewayDevices';

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

describe('useGatewayDevices', () => {
  it('应获取网关设备列表', async () => {
    const mockDevices = [
      {
        id: 'gw-001',
        deviceName: 'OPC UA 设备',
        protocol: 'opcua',
        connectionConfig: '{}',
        dataPoints: '[]',
        pollIntervalMs: 1000,
        status: 'Connected',
        createdAt: '2026-06-01T00:00:00Z',
      },
    ];

    mockedApi.get.mockResolvedValueOnce({ data: mockDevices });

    const { result } = renderHook(
      () => useGatewayDevices(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockDevices);
    expect(mockedApi.get).toHaveBeenCalledWith('/gateway/devices');
  });

  it('API 失败应返回错误', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('网关服务不可用'));

    const { result } = renderHook(
      () => useGatewayDevices(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useTestConnection', () => {
  it('应发送测试连接请求', async () => {
    const mockResult = { success: true, message: '连接成功' };
    const params = {
      protocol: 'opcua',
      connectionConfig: '{"host":"192.168.1.1","port":4840}',
    };

    mockedApi.post.mockResolvedValueOnce({ data: mockResult });

    const { result } = renderHook(
      () => useTestConnection(),
      { wrapper: createWrapper() },
    );

    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/gateway/devices/test-connection',
      params,
    );
    expect(result.current.data).toEqual(mockResult);
  });

  it('失败应返回错误', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('连接超时'));

    const { result } = renderHook(
      () => useTestConnection(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      protocol: 'modbus-tcp',
      connectionConfig: '{}',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useCreateGatewayDevice', () => {
  it('应创建设备', async () => {
    const mockCreated = {
      id: 'gw-002',
      deviceName: 'Modbus 设备',
      protocol: 'modbus-tcp',
      connectionConfig: '{}',
      dataPoints: '[]',
      pollIntervalMs: 2000,
      status: 'Disconnected',
      createdAt: '2026-06-02T00:00:00Z',
    };
    const params = {
      deviceName: 'Modbus 设备',
      protocol: 'modbus-tcp',
      connectionConfig: '{}',
      dataPoints: '[]',
    };

    mockedApi.post.mockResolvedValueOnce({ data: mockCreated });

    const { result } = renderHook(
      () => useCreateGatewayDevice(),
      { wrapper: createWrapper() },
    );

    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/gateway/devices', params);
    expect(result.current.data).toEqual(mockCreated);
  });

  it('成功后应刷新设备列表', async () => {
    const invalidateSpy = vi.spyOn(
      QueryClient.prototype,
      'invalidateQueries',
    );

    mockedApi.post.mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(
      () => useCreateGatewayDevice(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      deviceName: '新设备',
      protocol: 'opcua',
      connectionConfig: '{}',
      dataPoints: '[]',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 创建成功后应使网关设备列表缓存失效
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['gateway-devices'] }),
    );

    invalidateSpy.mockRestore();
  });
});

describe('useDeleteGatewayDevice', () => {
  it('应删除设备', async () => {
    mockedApi.delete.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(
      () => useDeleteGatewayDevice(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('gw-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.delete).toHaveBeenCalledWith('/gateway/devices/gw-001');
  });

  it('成功后应刷新设备列表', async () => {
    const invalidateSpy = vi.spyOn(
      QueryClient.prototype,
      'invalidateQueries',
    );

    mockedApi.delete.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(
      () => useDeleteGatewayDevice(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('gw-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 删除成功后应使网关设备列表缓存失效
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['gateway-devices'] }),
    );

    invalidateSpy.mockRestore();
  });
});
