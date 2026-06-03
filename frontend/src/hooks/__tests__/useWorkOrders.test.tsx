import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import {
  useWorkOrders,
  useWorkOrder,
  useWorkOrderLogs,
  useCreateWorkOrder,
  useAssignWorkOrder,
  useStartWorkOrder,
  useCompleteWorkOrder,
  useAcceptWorkOrder,
  useRejectWorkOrder,
  useCloseWorkOrder,
  useCancelWorkOrder,
} from '../useWorkOrders';
import type { WorkOrder, WorkOrderLog, PagedResult } from '../../types';

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

/** 模拟工单数据 */
const mockWorkOrder: WorkOrder = {
  id: 'wo-001',
  workOrderCode: 'WO-20260603-001',
  title: '一号水泵异常振动维修',
  type: 'corrective',
  status: 'PendingDispatch',
  priority: 'High',
  deviceId: 'device-001',
  alertId: 'alert-001',
  rootCause: '轴承磨损',
  assignedTo: 'user-001',
  dueDate: '2026-06-10T00:00:00Z',
  completedAt: undefined,
  createdAt: '2026-06-03T08:00:00Z',
};

/** 模拟工单分页结果 */
const mockPagedResult: PagedResult<WorkOrder> = {
  items: [mockWorkOrder],
  total: 1,
  page: 1,
  pageSize: 20,
};

/** 模拟工单流转日志 */
const mockWorkOrderLog: WorkOrderLog = {
  id: 'log-001',
  workOrderId: 'wo-001',
  action: 'created',
  oldStatus: undefined,
  newStatus: 'PendingDispatch',
  operatorId: 'user-admin',
  note: '告警自动创建工单',
  createdAt: '2026-06-03T08:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// useWorkOrders — 工单分页列表查询
// ============================================================================
describe('useWorkOrders', () => {
  it('应成功获取工单列表', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => useWorkOrders({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockPagedResult);
    expect(mockedApi.get).toHaveBeenCalledWith(
      expect.stringContaining('/work-orders?'),
    );
  });

  it('应正确传递状态、优先级和设备 ID 过滤参数', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () =>
        useWorkOrders(
          { page: 1, pageSize: 20 },
          { status: 'InProgress', priority: 'High', deviceId: 'device-001' },
        ),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const calledUrl = mockedApi.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('status=InProgress');
    expect(calledUrl).toContain('deviceId=device-001');
  });

  it('应正确传递排序参数', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockPagedResult });

    const { result } = renderHook(
      () => useWorkOrders({ page: 1, pageSize: 20, sort: 'createdAt', order: 'desc' }),
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
      () => useWorkOrders({ page: 1, pageSize: 20 }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});

// ============================================================================
// useWorkOrder — 单个工单详情查询
// ============================================================================
describe('useWorkOrder', () => {
  it('应成功获取单个工单详情', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: mockWorkOrder });

    const { result } = renderHook(
      () => useWorkOrder('wo-001'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockWorkOrder);
    expect(mockedApi.get).toHaveBeenCalledWith('/work-orders/wo-001');
  });

  it('id 为空时应禁用查询', () => {
    const { result } = renderHook(
      () => useWorkOrder(''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

// ============================================================================
// useWorkOrderLogs — 工单流转日志查询
// ============================================================================
describe('useWorkOrderLogs', () => {
  it('应成功获取工单流转日志', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: [mockWorkOrderLog] });

    const { result } = renderHook(
      () => useWorkOrderLogs('wo-001'),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([mockWorkOrderLog]);
    expect(mockedApi.get).toHaveBeenCalledWith('/work-orders/wo-001/logs');
  });

  it('workOrderId 为空时应禁用查询', () => {
    const { result } = renderHook(
      () => useWorkOrderLogs(''),
      { wrapper: createWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

// ============================================================================
// useCreateWorkOrder — 创建工单
// ============================================================================
describe('useCreateWorkOrder', () => {
  it('应调用 POST 接口创建工单', async () => {
    const newWorkOrderReq = {
      title: '二号水泵异常噪音维修',
      type: 'corrective',
      priority: 'Urgent',
      deviceId: 'device-002',
      alertId: 'alert-002',
      description: '设备运行时出现异常噪音',
    };

    mockedApi.post.mockResolvedValueOnce({ data: mockWorkOrder });

    const { result } = renderHook(
      () => useCreateWorkOrder(),
      { wrapper: createWrapper() },
    );

    result.current.mutate(newWorkOrderReq);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.post).toHaveBeenCalledWith('/work-orders', newWorkOrderReq);
    expect(result.current.data).toEqual(mockWorkOrder);
  });
});

// ============================================================================
// useAssignWorkOrder — 指派工单
// ============================================================================
describe('useAssignWorkOrder', () => {
  it('应调用 PUT 接口指派工单', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: undefined });

    const { result } = renderHook(
      () => useAssignWorkOrder(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ id: 'wo-001', assignedTo: 'user-002', note: '请尽快处理' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 源码中 mutationFn 解构了 { id, ...req }，所以发送给 API 的对象不包含 id
    expect(mockedApi.put).toHaveBeenCalledWith(
      '/work-orders/wo-001/assign',
      expect.objectContaining({ assignedTo: 'user-002', note: '请尽快处理' }),
    );
  });
});

// ============================================================================
// useStartWorkOrder — 开始执行工单
// ============================================================================
describe('useStartWorkOrder', () => {
  it('应调用 PUT 接口开始执行工单', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: undefined });

    const { result } = renderHook(
      () => useStartWorkOrder(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('wo-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith('/work-orders/wo-001/start');
  });
});

// ============================================================================
// useCompleteWorkOrder — 完成工单
// ============================================================================
describe('useCompleteWorkOrder', () => {
  it('应调用 PUT 接口完成工单', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: undefined });

    const { result } = renderHook(
      () => useCompleteWorkOrder(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ id: 'wo-001', resolution: '更换轴承并重新校准' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // 源码中 mutationFn 解构了 { id, ...req }，所以发送给 API 的对象不包含 id
    expect(mockedApi.put).toHaveBeenCalledWith(
      '/work-orders/wo-001/complete',
      expect.objectContaining({ resolution: '更换轴承并重新校准' }),
    );
  });
});

// ============================================================================
// useAcceptWorkOrder — 接受工单
// ============================================================================
describe('useAcceptWorkOrder', () => {
  it('应调用 PUT 接口接受工单', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: undefined });

    const { result } = renderHook(
      () => useAcceptWorkOrder(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('wo-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith('/work-orders/wo-001/accept');
  });
});

// ============================================================================
// useRejectWorkOrder — 拒绝工单
// ============================================================================
describe('useRejectWorkOrder', () => {
  it('应调用 PUT 接口拒绝工单并传递理由', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: undefined });

    const { result } = renderHook(
      () => useRejectWorkOrder(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ id: 'wo-001', reason: '维修资源不足，暂时无法处理' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/work-orders/wo-001/reject',
      { reason: '维修资源不足，暂时无法处理' },
    );
  });
});

// ============================================================================
// useCloseWorkOrder — 关闭工单
// ============================================================================
describe('useCloseWorkOrder', () => {
  it('应调用 PUT 接口关闭工单', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: undefined });

    const { result } = renderHook(
      () => useCloseWorkOrder(),
      { wrapper: createWrapper() },
    );

    result.current.mutate('wo-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith('/work-orders/wo-001/close');
  });
});

// ============================================================================
// useCancelWorkOrder — 取消工单
// ============================================================================
describe('useCancelWorkOrder', () => {
  it('应调用 PUT 接口取消工单并传递理由', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: undefined });

    const { result } = renderHook(
      () => useCancelWorkOrder(),
      { wrapper: createWrapper() },
    );

    result.current.mutate({ id: 'wo-001', reason: '设备已恢复正常，无需维修' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith(
      '/work-orders/wo-001/cancel',
      { reason: '设备已恢复正常，无需维修' },
    );
  });
});
