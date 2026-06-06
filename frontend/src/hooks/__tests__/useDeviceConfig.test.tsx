import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import { useDeviceTemplates, useQuickRegister } from '../useDeviceConfig';

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

describe('useDeviceTemplates', () => {
  it('应获取模板列表', async () => {
    const mockTemplates = [
      {
        id: 'tpl-001',
        name: '水泵模板',
        industry: 'water',
        metrics: ['temperature', 'pressure'],
      },
    ];

    mockedApi.get.mockResolvedValueOnce({ data: mockTemplates });

    const { result } = renderHook(
      () => useDeviceTemplates(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockTemplates);
    // industry 为空时不应拼接查询参数
    expect(mockedApi.get).toHaveBeenCalledWith('/device-types');
  });

  it('industry 为空时应禁用 industry 相关查询参数', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(
      () => useDeviceTemplates(''),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 空字符串属于 falsy，不应拼接到 URL
    expect(mockedApi.get).toHaveBeenCalledWith('/device-types');
  });

  it('应传递 industry 参数', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(
      () => useDeviceTemplates('manufacturing'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // industry 有值时应作为查询参数传递
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/device-types?industry=manufacturing',
    );
  });
});

describe('useQuickRegister', () => {
  it('应调用 POST 接口注册设备', async () => {
    const mockResponse = { id: 'device-new', deviceCode: 'PUMP-NEW' };
    const registerRequest = {
      tenantId: 'tenant-001',
      deviceCode: 'PUMP-NEW',
      name: '新水泵',
      deviceType: 'pump',
    };

    mockedApi.post.mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(
      () => useQuickRegister(),
      { wrapper: createWrapper() },
    );

    result.current.mutate(registerRequest);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/device-config/quick-register',
      registerRequest,
    );
    expect(result.current.data).toEqual(mockResponse);
  });

  it('成功后应刷新相关查询缓存', async () => {
    // 捕获 QueryClient.invalidateQueries 调用
    const invalidateSpy = vi.spyOn(
      QueryClient.prototype,
      'invalidateQueries',
    );

    mockedApi.post.mockResolvedValueOnce({ data: { id: 'device-new' } });

    const { result } = renderHook(
      () => useQuickRegister(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ tenantId: 'tenant-001', deviceCode: 'DEV-NEW', name: '新设备' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 成功后应使设备列表缓存失效
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['devices'] }),
    );

    invalidateSpy.mockRestore();
  });
});
