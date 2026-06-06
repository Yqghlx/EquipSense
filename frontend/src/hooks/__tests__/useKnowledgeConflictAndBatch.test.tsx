import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import {
  useCheckConflicts,
  useBatchApprovePendingRules,
  useBatchRejectPendingRules,
  type ConflictResult,
  type BatchReviewResult,
} from '../useKnowledge';

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

// ---------------------------------------------------------------------------
// useCheckConflicts
// ---------------------------------------------------------------------------
describe('useCheckConflicts', () => {
  it('应调用冲突检测 API', async () => {
    const mockConflicts: ConflictResult[] = [
      { ruleId: 'rule-001', ruleName: '温度告警规则', overlappingMetrics: ['temperature'] },
    ];
    mockedApi.post.mockResolvedValueOnce({ data: mockConflicts });

    const { result } = renderHook(() => useCheckConflicts(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      deviceType: 'pump',
      conditions: '[{"metric":"temperature","operator":">","threshold":80}]',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockConflicts);
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/knowledge/rules/check-conflicts',
      {
        deviceType: 'pump',
        conditions: '[{"metric":"temperature","operator":">","threshold":80}]',
        excludeRuleId: undefined,
      },
    );
  });

  it('应传递 excludeRuleId 参数', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useCheckConflicts(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      deviceType: 'motor',
      conditions: '[{"metric":"vibration","operator":">","threshold":5}]',
      excludeRuleId: 'rule-to-exclude',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/knowledge/rules/check-conflicts',
      expect.objectContaining({ excludeRuleId: 'rule-to-exclude' }),
    );
  });

  it('无冲突时应返回空列表', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useCheckConflicts(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      deviceType: 'pump',
      conditions: '[{"metric":"humidity","operator":">","threshold":70}]',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// useBatchApprovePendingRules
// ---------------------------------------------------------------------------
describe('useBatchApprovePendingRules', () => {
  it('应调用批量批准 API', async () => {
    const mockResult: BatchReviewResult = {
      successCount: 3,
      failCount: 0,
      errors: [],
    };
    mockedApi.post.mockResolvedValueOnce({ data: mockResult });

    const { result } = renderHook(() => useBatchApprovePendingRules(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      ids: ['id-1', 'id-2', 'id-3'],
      comment: '批量通过',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResult);
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/knowledge/pending-rules/batch-approve',
      { ids: ['id-1', 'id-2', 'id-3'], comment: '批量通过' },
    );
  });

  it('成功后应刷新候选规则和正式规则缓存', async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');

    mockedApi.post.mockResolvedValueOnce({
      data: { successCount: 2, failCount: 0, errors: [] },
    });

    const { result } = renderHook(() => useBatchApprovePendingRules(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ ids: ['id-1', 'id-2'] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['pending-rules'] }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['knowledge-rules'] }),
    );

    invalidateSpy.mockRestore();
  });

  it('部分失败时应返回混合结果', async () => {
    const mockResult: BatchReviewResult = {
      successCount: 1,
      failCount: 1,
      errors: [{ id: 'id-bad', reason: '候选规则不存在' }],
    };
    mockedApi.post.mockResolvedValueOnce({ data: mockResult });

    const { result } = renderHook(() => useBatchApprovePendingRules(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ ids: ['id-good', 'id-bad'] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.successCount).toBe(1);
    expect(result.current.data?.failCount).toBe(1);
    expect(result.current.data?.errors).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// useBatchRejectPendingRules
// ---------------------------------------------------------------------------
describe('useBatchRejectPendingRules', () => {
  it('应调用批量驳回 API', async () => {
    const mockResult: BatchReviewResult = {
      successCount: 2,
      failCount: 0,
      errors: [],
    };
    mockedApi.post.mockResolvedValueOnce({ data: mockResult });

    const { result } = renderHook(() => useBatchRejectPendingRules(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      ids: ['id-1', 'id-2'],
      comment: '质量不足',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResult);
    expect(mockedApi.post).toHaveBeenCalledWith(
      '/knowledge/pending-rules/batch-reject',
      { ids: ['id-1', 'id-2'], comment: '质量不足' },
    );
  });

  it('成功后应刷新候选规则缓存', async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');

    mockedApi.post.mockResolvedValueOnce({
      data: { successCount: 2, failCount: 0, errors: [] },
    });

    const { result } = renderHook(() => useBatchRejectPendingRules(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ ids: ['id-1', 'id-2'] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ['pending-rules'] }),
    );

    invalidateSpy.mockRestore();
  });

  it('不带 comment 应正常工作', async () => {
    mockedApi.post.mockResolvedValueOnce({
      data: { successCount: 1, failCount: 0, errors: [] },
    });

    const { result } = renderHook(() => useBatchRejectPendingRules(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ ids: ['id-1'] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/knowledge/pending-rules/batch-reject',
      { ids: ['id-1'], comment: undefined },
    );
  });
});
