import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import { useAlertRules, useAlertRule, useCreateAlertRule, useUpdateAlertRule, useDeleteAlertRule } from '../useAlertRules';
import type { AlertRule, PagedResult } from '../../types';

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

const mockAlertRule: AlertRule = {
  id: 'rule-001',
  name: '温度过高告警',
  metric: 'temperature',
  ruleType: 'threshold',
  operator: 'gt',
  threshold: 85,
  severity: 'Critical',
  cooldownSeconds: 300,
  autoCreateWorkorder: true,
  enabled: true,
  createdAt: '2026-01-15T08:00:00Z',
};

const mockPagedResult: PagedResult<AlertRule> = {
  items: [mockAlertRule],
  total: 1,
  page: 1,
  pageSize: 20,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useAlertRules', () => {
  it('应成功获取告警规则列表', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => useAlertRules({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPagedResult);
    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/alert-rules?'),
    );
  });

  it('应正确传递关键字搜索参数', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => useAlertRules({ page: 1, pageSize: 20, keyword: '温度' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('keyword=%E6%B8%A9%E5%BA%A6'),
    );
  });

  it('API 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('网络错误'));

    const { result } = renderHook(
      () => useAlertRules({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useAlertRule', () => {
  it('应成功获取单条告警规则详情', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockAlertRule });

    const { result } = renderHook(
      () => useAlertRule('rule-001'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAlertRule);
    expect(mockedApi.get).toHaveBeenCalledWith('/alert-rules/rule-001');
  });

  it('id 为空时应禁用查询', () => {
    const { result } = renderHook(
      () => useAlertRule(''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

describe('useCreateAlertRule', () => {
  it('应调用 POST 接口创建告警规则', async () => {
    const newRule: Omit<AlertRule, 'id' | 'createdAt'> = {
      name: '振动异常告警',
      metric: 'vibration',
      ruleType: 'threshold',
      operator: 'gt',
      threshold: 10,
      severity: 'High',
      cooldownSeconds: 600,
      autoCreateWorkorder: false,
      enabled: true,
    };

    mockedApi.post.mockResolvedValueOnce({ data: mockAlertRule });

    const { result } = renderHook(
      () => useCreateAlertRule(),
      { wrapper: createWrapper() },
    );

    result.current.mutate(newRule as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/alert-rules', newRule);
    expect(result.current.data).toEqual(mockAlertRule);
  });
});

describe('useUpdateAlertRule', () => {
  it('应调用 PUT 接口更新告警规则', async () => {
    const updatedRule = { ...mockAlertRule };
    mockedApi.put.mockResolvedValueOnce({ data: updatedRule });

    const { result } = renderHook(
      () => useUpdateAlertRule(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      id: 'rule-001',
      name: '更新后的规则',
      metric: 'temperature',
      ruleType: 'threshold',
      severity: 'High',
      cooldownSeconds: 600,
      autoCreateWorkorder: false,
      enabled: true,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 源码中 mutationFn 解构了 { id, ...req }，所以发送给 API 的对象不包含 id
    expect(mockedApi.put).toHaveBeenCalledWith(
      '/alert-rules/rule-001',
      expect.objectContaining({ name: '更新后的规则', metric: 'temperature' }),
    );
  });
});

describe('useDeleteAlertRule', () => {
  it('应调用 DELETE 接口删除告警规则', async () => {
    mockedApi.delete.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(
      () => useDeleteAlertRule(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('rule-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.delete).toHaveBeenCalledWith('/alert-rules/rule-001');
  });
});
