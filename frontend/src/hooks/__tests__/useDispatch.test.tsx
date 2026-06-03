import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import {
  useDispatchRecommendations,
  useTechnicians,
  useAssignFromRecommendation,
} from '../useDispatch';
import type { DispatchRecommendation, TechnicianProfile } from '../useDispatch';

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

/** 模拟派工推荐数据，字段严格匹配 DispatchRecommendation 类型 */
const mockRecommendation: DispatchRecommendation = {
  technicianUserId: 'user-tech-001',
  name: '张三',
  skillScore: 0.95,
  loadScore: 0.8,
  totalScore: 0.88,
  activeWorkCount: 2,
  reason: '技能匹配度高且当前负载较轻',
};

/** 模拟技术人员画像数据，字段严格匹配 TechnicianProfile 类型 */
const mockTechnician: TechnicianProfile = {
  id: 'tech-001',
  userId: 'user-tech-001',
  name: '张三',
  skills: ['pump', 'valve', 'motor'],
  activeWorkCount: 2,
  completedCount: 45,
  avgCompletionHours: 4.5,
  isAvailable: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useDispatchRecommendations', () => {
  it('应成功获取派工推荐列表', async () => {
    const mockData = [mockRecommendation];
    mockedApi.get.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(
      () => useDispatchRecommendations('wo-001'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(mockedApi.get).toHaveBeenCalledWith('/dispatch/wo-001/recommendations');
  });

  it('workOrderId 为空时应禁用查询', () => {
    const { result } = renderHook(
      () => useDispatchRecommendations(undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

describe('useTechnicians', () => {
  it('应成功获取技术人员列表（默认仅可用人）', async () => {
    const mockData = [mockTechnician];
    mockedApi.get.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(
      () => useTechnicians(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    // 默认 availableOnly = true
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/dispatch/technicians?availableOnly=true',
    );
  });

  it('应正确传递 availableOnly = false 参数', async () => {
    const mockData = [mockTechnician];
    mockedApi.get.mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(
      () => useTechnicians(false),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith(
      '/dispatch/technicians?availableOnly=false',
    );
  });
});

describe('useAssignFromRecommendation', () => {
  it('应调用 PUT 接口快速派工', async () => {
    const mockResponse = { id: 'wo-001', status: 'Assigned' };
    mockedApi.put.mockResolvedValueOnce({ data: mockResponse });

    const { result } = renderHook(
      () => useAssignFromRecommendation(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({
      workOrderId: 'wo-001',
      technicianUserId: 'user-tech-001',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 源码中 mutationFn 将 technicianUserId 映射为 assignedTo 字段
    expect(mockedApi.put).toHaveBeenCalledWith(
      '/work-orders/wo-001/assign',
      { assignedTo: 'user-tech-001' },
    );
    expect(result.current.data).toEqual(mockResponse);
  });
});
