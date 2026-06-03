import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import {
  useApprovalChains,
  useWorkOrderApprovals,
  usePendingApprovals,
  useCreateApprovalChain,
  useUpdateApprovalChain,
  useDeleteApprovalChain,
  useSubmitWorkOrder,
  useApproveWorkOrder,
  useRejectApproval,
} from '../useApprovals';
import type {
  ApprovalChainTemplate,
  WorkOrderApprovalDto,
  CreateApprovalChainRequest,
} from '../../types';

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

/** 审批链模板模拟数据 */
const mockChain: ApprovalChainTemplate = {
  id: 'chain-001',
  name: '标准审批流程',
  isDefault: true,
  enabled: true,
  steps: [
    { id: 'step-001', stepOrder: 1, role: 'maintenance_lead', isRequired: true },
    { id: 'step-002', stepOrder: 2, role: 'system_admin', isRequired: true },
  ],
  createdAt: '2026-01-01T00:00:00Z',
};

/** 工单审批记录模拟数据 */
const mockApproval: WorkOrderApprovalDto = {
  id: 'approval-001',
  workOrderId: 'wo-001',
  stepOrder: 1,
  expectedRole: 'maintenance_lead',
  approverId: 'user-001',
  action: 'Pending',
  comment: undefined,
  actedAt: undefined,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// useApprovalChains
// ---------------------------------------------------------------------------
describe('useApprovalChains', () => {
  it('应成功获取审批链模板列表', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [mockChain] });

    const { result } = renderHook(() => useApprovalChains(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([mockChain]);
    expect(mockedApi.get).toHaveBeenCalledWith('/approval-chains');
  });

  it('API 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('服务器异常'));

    const { result } = renderHook(() => useApprovalChains(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// useWorkOrderApprovals
// ---------------------------------------------------------------------------
describe('useWorkOrderApprovals', () => {
  it('应成功获取工单审批记录', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [mockApproval] });

    const { result } = renderHook(
      () => useWorkOrderApprovals('wo-001'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([mockApproval]);
    expect(mockedApi.get).toHaveBeenCalledWith(
      '/work-orders/wo-001/approvals',
    );
  });

  it('workOrderId 为空时应禁用查询', () => {
    const { result } = renderHook(
      () => useWorkOrderApprovals(undefined),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// usePendingApprovals
// ---------------------------------------------------------------------------
describe('usePendingApprovals', () => {
  it('应成功获取待我审批列表', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [mockApproval] });

    const { result } = renderHook(() => usePendingApprovals(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([mockApproval]);
    expect(mockedApi.get).toHaveBeenCalledWith('/approval-chains/pending');
  });

  it('API 请求失败时应返回错误状态', async () => {
    mockedApi.get.mockRejectedValueOnce(new Error('网络异常'));

    const { result } = renderHook(() => usePendingApprovals(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// useCreateApprovalChain
// ---------------------------------------------------------------------------
describe('useCreateApprovalChain', () => {
  it('应调用 POST 接口创建审批链模板', async () => {
    const newChainReq: CreateApprovalChainRequest = {
      name: '紧急审批流程',
      isDefault: false,
      steps: [{ stepOrder: 1, role: 'system_admin', isRequired: true }],
    };

    mockedApi.post.mockResolvedValueOnce({ data: { ...mockChain, name: '紧急审批流程' } });

    const { result } = renderHook(() => useCreateApprovalChain(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(newChainReq);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/approval-chains', newChainReq);
  });
});

// ---------------------------------------------------------------------------
// useUpdateApprovalChain
// ---------------------------------------------------------------------------
describe('useUpdateApprovalChain', () => {
  it('应调用 PUT 接口更新审批链模板', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: mockChain });

    const { result } = renderHook(() => useUpdateApprovalChain(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'chain-001',
      name: '修改后的审批流程',
      isDefault: true,
      steps: [{ stepOrder: 1, role: 'maintenance_lead', isRequired: true }],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 源码中 mutationFn 解构了 { id, ...req }，所以发送给 API 的对象不包含 id
    expect(mockedApi.put).toHaveBeenCalledWith(
      '/approval-chains/chain-001',
      expect.objectContaining({ name: '修改后的审批流程' }),
    );
  });
});

// ---------------------------------------------------------------------------
// useDeleteApprovalChain
// ---------------------------------------------------------------------------
describe('useDeleteApprovalChain', () => {
  it('应调用 DELETE 接口删除审批链模板', async () => {
    mockedApi.delete.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useDeleteApprovalChain(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('chain-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.delete).toHaveBeenCalledWith('/approval-chains/chain-001');
  });
});

// ---------------------------------------------------------------------------
// useSubmitWorkOrder
// ---------------------------------------------------------------------------
describe('useSubmitWorkOrder', () => {
  it('应调用 POST 接口提交工单验收', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useSubmitWorkOrder(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('wo-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/work-orders/wo-001/submit');
  });
});

// ---------------------------------------------------------------------------
// useApproveWorkOrder
// ---------------------------------------------------------------------------
describe('useApproveWorkOrder', () => {
  it('应调用 POST 接口审批通过（不带意见）', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useApproveWorkOrder(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'wo-001' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/work-orders/wo-001/approve', {
      comment: undefined,
    });
  });

  it('应调用 POST 接口审批通过（带意见）', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useApproveWorkOrder(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'wo-001', comment: '同意通过' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/work-orders/wo-001/approve', {
      comment: '同意通过',
    });
  });
});

// ---------------------------------------------------------------------------
// useRejectApproval
// ---------------------------------------------------------------------------
describe('useRejectApproval', () => {
  it('应调用 POST 接口驳回审批（带意见）', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useRejectApproval(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'wo-001', comment: '请重新检查设备状态' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/work-orders/wo-001/reject-approval',
      { comment: '请重新检查设备状态' },
    );
  });

  it('应调用 POST 接口驳回审批（不带意见）', async () => {
    mockedApi.post.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useRejectApproval(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'wo-001' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith(
      '/work-orders/wo-001/reject-approval',
      { comment: undefined },
    );
  });
});
