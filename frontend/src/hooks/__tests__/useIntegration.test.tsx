import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import { useIntegrations, useUpdateIntegration, useTestIntegration } from '../useIntegration';
import type { IntegrationsMap, IntegrationTestResult } from '../../types/integration';

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

/** 模拟集成配置数据 */
const mockIntegrationsMap: IntegrationsMap = {
  dingtalk: {
    enabled: true,
    webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=xxx',
    secret: 'test-secret',
    messageType: 'markdown',
  },
  feishu: {
    enabled: false,
    appId: 'cli_xxx',
    appSecret: 'secret_xxx',
  },
  webhook: {
    enabled: true,
    url: 'https://example.com/webhook',
  },
};

/** 模拟集成测试结果 */
const mockTestResult: IntegrationTestResult = {
  type: 'dingtalk',
  success: true,
  message: '连接成功',
  durationMs: 230,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useIntegrations', () => {
  it('应成功获取集成配置列表', async () => {
    // 模拟后端返回 { integrations: { ... } } 结构
    mockedApi.get.mockResolvedValueOnce({ data: { integrations: mockIntegrationsMap } });

    const { result } = renderHook(
      () => useIntegrations(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 源码从 { integrations: { ... } } 中提取出集成配置
    expect(result.current.data).toEqual(mockIntegrationsMap);
    expect(mockedApi.get).toHaveBeenCalledWith('/settings/integrations');
  });

  it('后端直接返回对象时应正确提取数据', async () => {
    // 模拟后端直接返回集成配置（无外层 integrations 包装）
    mockedApi.get.mockResolvedValueOnce({ data: mockIntegrationsMap });

    const { result } = renderHook(
      () => useIntegrations(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockIntegrationsMap);
  });

  it('API 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('服务器异常'));

    const { result } = renderHook(
      () => useIntegrations(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useUpdateIntegration', () => {
  it('应调用 PUT 接口更新集成配置', async () => {
    const updatedIntegration = {
      enabled: true,
      webhookUrl: 'https://oapi.dingtalk.com/robot/send?access_token=updated',
    };
    mockedApi.put.mockResolvedValueOnce({ data: updatedIntegration });

    const { result } = renderHook(
      () => useUpdateIntegration(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      type: 'dingtalk',
      enabled: true,
      config: JSON.stringify(updatedIntegration),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/settings/integrations/dingtalk',
      { enabled: true, config: JSON.stringify(updatedIntegration) },
    );
    expect(result.current.data).toEqual(updatedIntegration);
  });

  it('应禁用指定集成', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(
      () => useUpdateIntegration(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      type: 'feishu',
      enabled: false,
      config: '{}',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/settings/integrations/feishu',
      { enabled: false, config: '{}' },
    );
  });
});

describe('useTestIntegration', () => {
  it('应调用 POST 接口测试集成连接', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: mockTestResult });

    const { result } = renderHook(
      () => useTestIntegration(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('dingtalk');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/settings/integrations/dingtalk/test');
    expect(result.current.data).toEqual(mockTestResult);
  });

  it('集成测试失败时应返回错误状态', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('连接超时'));

    const { result } = renderHook(
      () => useTestIntegration(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('webhook');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
