import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import { usePlans, useRegister } from '../useRegister';
import type { PlanInfo, RegisterRequest, AuthResponse } from '../../types';

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

/** 模拟套餐列表数据 */
const mockPlans: PlanInfo[] = [
  {
    planId: 'free',
    displayName: '免费版',
    description: '适合个人用户体验',
    maxDevices: 5,
    maxUsers: 3,
    dataRetentionDays: 7,
    monthlyPrice: 0,
    isFree: true,
  },
  {
    planId: 'professional',
    displayName: '专业版',
    description: '适合中小型团队',
    maxDevices: 100,
    maxUsers: 20,
    dataRetentionDays: 90,
    monthlyPrice: 299,
    isFree: false,
  },
];

/** 模拟注册请求参数 */
const mockRegisterRequest: RegisterRequest = {
  tenantName: '青岛西海岸新区测试企业',
  slug: 'qd-test',
  username: 'admin',
  password: 'SecurePass123!',
  displayName: '管理员',
  email: 'admin@example.com',
  plan: 'professional',
};

/** 模拟注册成功响应 */
const mockAuthResponse: AuthResponse = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  refreshToken: 'refresh-token-xxx',
  userInfo: {
    id: 'user-001',
    username: 'admin',
    displayName: '管理员',
    email: 'admin@example.com',
    role: 'system_admin',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('usePlans', () => {
  it('应成功获取套餐列表', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPlans });

    const { result } = renderHook(
      () => usePlans(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPlans);
    expect(mockedApi.get).toHaveBeenCalledWith('/auth/plans');
  });

  it('API 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('服务器异常'));

    const { result } = renderHook(
      () => usePlans(),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

describe('useRegister', () => {
  it('应调用 POST 接口完成注册', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: mockAuthResponse });

    const { result } = renderHook(
      () => useRegister(),
      { wrapper: createWrapper() },
    );

    result.current.mutate(mockRegisterRequest);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', mockRegisterRequest);
    expect(result.current.data).toEqual(mockAuthResponse);
  });

  it('注册失败时应返回错误状态', async () => {
    mockedApi.post.mockRejectedValueOnce(new Error('企业标识已被占用'));

    const { result } = renderHook(
      () => useRegister(),
      { wrapper: createWrapper() },
    );

    result.current.mutate(mockRegisterRequest);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', mockRegisterRequest);
  });

  it('仅传必填字段时应正常注册', async () => {
    // 仅包含必填字段的注册请求（不含 displayName 和 email）
    const minimalRequest: RegisterRequest = {
      tenantName: '测试企业',
      slug: 'test-co',
      username: 'admin',
      password: 'Pass123!',
      plan: 'free',
    };

    mockedApi.post.mockResolvedValueOnce({ data: mockAuthResponse });

    const { result } = renderHook(
      () => useRegister(),
      { wrapper: createWrapper() },
    );

    result.current.mutate(minimalRequest);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/register', minimalRequest);
  });
});
