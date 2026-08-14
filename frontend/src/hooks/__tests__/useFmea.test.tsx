import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import {
  useFmeaKnowledgeRuleOptions,
  useFmeaEntries,
  useCreateFmeaEntry,
  useUpdateFmeaEntry,
  useDeleteFmeaEntry,
  useToggleFmeaEntry,
  type FmeaKnowledgeRuleOption,
} from '../useFmea';

vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

/** 创建不自动重试的查询客户端，避免失败测试产生额外请求。 */
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

/** 创建可观察缓存失效的 mutation 测试容器。 */
const createMutationWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidateQueries };
};

const mockOption: FmeaKnowledgeRuleOption = {
  id: 'rule-1',
  deviceType: '电机',
  name: '电机过载规则',
  enabled: true,
  isSystemPreset: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useFmeaKnowledgeRuleOptions', () => {
  it('应按设备类型和当前规则 ID 查询可选规则', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [mockOption] });

    const { result } = renderHook(
      () => useFmeaKnowledgeRuleOptions({ deviceType: '电机', selectedRuleId: 'rule-1' }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith('/fmea/knowledge-rules', {
      params: { deviceType: '电机', selectedRuleId: 'rule-1' },
    });
    expect(result.current.data).toEqual([mockOption]);
  });

  it('表单关闭时不应发起规则选项请求', () => {
    renderHook(
      () => useFmeaKnowledgeRuleOptions({}, { enabled: false }),
      { wrapper: createWrapper() },
    );

    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

describe('useFmeaEntries', () => {
  it('应按分页和设备类型查询 FMEA 条目', async () => {
    const response = {
      items: [],
      total: 0,
      page: 2,
      pageSize: 10,
    };
    mockedApi.get.mockResolvedValueOnce({ data: response });

    const { result } = renderHook(
      () => useFmeaEntries({ page: 2, pageSize: 10, deviceType: '电机', isEnabled: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith('/fmea', {
      params: { page: 2, pageSize: 10, deviceType: '电机', isEnabled: true },
    });
    expect(result.current.data).toEqual(response);
  });
});

describe('useFmea mutation hooks', () => {
  const request = {
    deviceType: '电机',
    failureMode: '过热',
    cause: '冷却不足',
    effect: '停机',
    detection: '温度趋势',
    recommendedAction: '检查风扇',
    severity: 8,
    occurrence: 4,
    detectability: 3,
  };

  it('创建成功后应刷新 FMEA 列表缓存', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: { id: 'fmea-1' } });
    const { wrapper, invalidateQueries } = createMutationWrapper();
    const { result } = renderHook(() => useCreateFmeaEntry(), { wrapper });

    await result.current.mutateAsync(request);

    expect(mockedApi.post).toHaveBeenCalledWith('/fmea', request);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['fmea'] });
  });

  it('更新成功后应刷新 FMEA 列表缓存', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: { id: 'fmea-1' } });
    const { wrapper, invalidateQueries } = createMutationWrapper();
    const { result } = renderHook(() => useUpdateFmeaEntry(), { wrapper });

    await result.current.mutateAsync({ id: 'fmea-1', request });

    expect(mockedApi.put).toHaveBeenCalledWith('/fmea/fmea-1', request);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['fmea'] });
  });

  it('删除成功后应刷新 FMEA 列表缓存', async () => {
    mockedApi.delete.mockResolvedValueOnce({});
    const { wrapper, invalidateQueries } = createMutationWrapper();
    const { result } = renderHook(() => useDeleteFmeaEntry(), { wrapper });

    await result.current.mutateAsync('fmea-1');

    expect(mockedApi.delete).toHaveBeenCalledWith('/fmea/fmea-1');
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['fmea'] });
  });

  it('切换启用状态成功后应刷新 FMEA 列表缓存', async () => {
    mockedApi.put.mockResolvedValueOnce({});
    const { wrapper, invalidateQueries } = createMutationWrapper();
    const { result } = renderHook(() => useToggleFmeaEntry(), { wrapper });

    await result.current.mutateAsync('fmea-1');

    expect(mockedApi.put).toHaveBeenCalledWith('/fmea/fmea-1/toggle');
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['fmea'] });
  });
});
