import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import WorkOrderDetailPage from '../WorkOrderDetailPage';
import * as workOrderHooks from '../../hooks/useWorkOrders';
import * as approvalHooks from '../../hooks/useApprovals';
import * as dispatchHooks from '../../hooks/useDispatch';
import * as offlineQueueHooks from '../../hooks/useOfflineQueue';
import type { WorkOrder, WorkOrderLog } from '../../types';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'wo-001' }),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'workorder.offlineSave': 'Save to offline queue',
      'workorder.approvalProgressTitle': 'Approval progress',
    }[key] ?? key),
  }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock('../../components/workorder/StatusTimeline', () => ({
  StatusTimeline: ({ logs }: { logs: WorkOrderLog[] }) => (
    <div data-testid="status-timeline">{logs.length}</div>
  ),
}));

vi.mock('../../components/workorder/AttachmentUpload', () => ({
  default: () => <div data-testid="attachment-upload" />,
}));

vi.mock('../../components/workorder/OfflineSyncPanel', () => ({
  OfflineSyncPanel: () => <div data-testid="offline-sync" />,
}));

vi.mock('../../components/workorder/OfflineStatusBadge', () => ({
  OfflineStatusBadge: () => <div data-testid="offline-status" />,
}));

vi.mock('../../components/workorder/ApprovalProgressPanel', () => ({
  ApprovalProgressPanel: () => <div data-testid="approval-progress" />,
}));

vi.mock('../../components/workorder/PriorityBadge', () => ({
  PriorityBadge: () => <div data-testid="priority-badge" />,
}));

vi.mock('../../components/workorder/SlaCountdown', () => ({
  SlaCountdown: () => <div data-testid="sla-countdown" />,
}));

/** 构造无需关注返回值的 mutation Hook 结果。 */
function mutationResult() {
  return { mutate: vi.fn(), isPending: false };
}

/** 工单详情模拟数据，包含后端提供的可读派工人名称。 */
const mockWorkOrder = {
  id: 'wo-001',
  workOrderCode: 'WO-20260809-0001',
  title: '更换轴承',
  type: 'Corrective',
  status: 'Completed',
  priority: 'High',
  deviceId: 'device-001',
  assignedTo: 'user-001',
  assignedToName: '张工',
  resolution: '已更换轴承',
  createdAt: '2026-08-09T08:00:00Z',
} as WorkOrder & { assignedToName: string };

/** 工单流转日志模拟数据。 */
const mockLog: WorkOrderLog = {
  id: 'log-001',
  workOrderId: 'wo-001',
  action: 'Created',
  newStatus: 'PendingDispatch',
  createdAt: '2026-08-09T08:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();

  vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
    data: mockWorkOrder,
    isLoading: false,
  } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
  vi.spyOn(workOrderHooks, 'useWorkOrderLogs').mockReturnValue({
    data: [mockLog],
    isLoading: false,
  } as unknown as ReturnType<typeof workOrderHooks.useWorkOrderLogs>);
  vi.spyOn(workOrderHooks, 'useStartWorkOrder').mockReturnValue(
    mutationResult() as unknown as ReturnType<typeof workOrderHooks.useStartWorkOrder>,
  );
  vi.spyOn(workOrderHooks, 'useCompleteWorkOrder').mockReturnValue(
    mutationResult() as unknown as ReturnType<typeof workOrderHooks.useCompleteWorkOrder>,
  );
  vi.spyOn(workOrderHooks, 'useAcceptWorkOrder').mockReturnValue(
    mutationResult() as unknown as ReturnType<typeof workOrderHooks.useAcceptWorkOrder>,
  );
  vi.spyOn(workOrderHooks, 'useRejectWorkOrder').mockReturnValue(
    mutationResult() as unknown as ReturnType<typeof workOrderHooks.useRejectWorkOrder>,
  );
  vi.spyOn(workOrderHooks, 'useCloseWorkOrder').mockReturnValue(
    mutationResult() as unknown as ReturnType<typeof workOrderHooks.useCloseWorkOrder>,
  );
  vi.spyOn(workOrderHooks, 'useCancelWorkOrder').mockReturnValue(
    mutationResult() as unknown as ReturnType<typeof workOrderHooks.useCancelWorkOrder>,
  );
  vi.spyOn(approvalHooks, 'useWorkOrderApprovals').mockReturnValue({
    data: [],
  } as unknown as ReturnType<typeof approvalHooks.useWorkOrderApprovals>);
  vi.spyOn(approvalHooks, 'useSubmitWorkOrder').mockReturnValue(
    mutationResult() as unknown as ReturnType<typeof approvalHooks.useSubmitWorkOrder>,
  );
  vi.spyOn(dispatchHooks, 'useTechnicians').mockReturnValue({
    data: [],
  } as unknown as ReturnType<typeof dispatchHooks.useTechnicians>);
  vi.spyOn(dispatchHooks, 'useAssignFromRecommendation').mockReturnValue(
    mutationResult() as unknown as ReturnType<typeof dispatchHooks.useAssignFromRecommendation>,
  );
  vi.spyOn(offlineQueueHooks, 'useOfflineQueue').mockReturnValue({
    enqueue: vi.fn(),
  } as unknown as ReturnType<typeof offlineQueueHooks.useOfflineQueue>);
});

afterEach(() => {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
});

describe('WorkOrderDetailPage', () => {
  it('应展示可读派工人名称和真实流转时间线', () => {
    render(<WorkOrderDetailPage />);

    expect(workOrderHooks.useWorkOrderLogs).toHaveBeenCalledWith('wo-001');
    expect(screen.getByText('张工')).toBeInTheDocument();
    expect(screen.queryByText('user-001')).not.toBeInTheDocument();
    expect(screen.getByTestId('status-timeline')).toHaveTextContent('1');
  });

  it('历史工单关联用户缺失时不应暴露内部 UUID', () => {
    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: { ...mockWorkOrder, assignedToName: undefined },
      isLoading: false,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);

    render(<WorkOrderDetailPage />);

    expect(screen.getByText('workorder.unknownAssignee')).toBeInTheDocument();
    expect(screen.queryByText('user-001')).not.toBeInTheDocument();
  });

  it('英文工单详情应将离线保存和审批进度标题交给翻译资源', () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: { ...mockWorkOrder, status: 'InProgress', resolution: undefined },
      isLoading: false,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
    const { rerender } = render(<WorkOrderDetailPage />);

    expect(screen.getByRole('button', { name: 'Save to offline queue' })).toBeInTheDocument();

    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: { ...mockWorkOrder, status: 'SubmittedForApproval' },
      isLoading: false,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
    vi.spyOn(approvalHooks, 'useWorkOrderApprovals').mockReturnValue({
      data: [{ id: 'approval-001' }],
    } as unknown as ReturnType<typeof approvalHooks.useWorkOrderApprovals>);
    rerender(<WorkOrderDetailPage />);

    expect(screen.getByText('Approval progress')).toBeInTheDocument();
  });

  it('加载中和无数据时应展示对应空态，返回按钮应回到工单列表', async () => {
    const user = userEvent.setup();
    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
    const view = render(<WorkOrderDetailPage />);
    expect(screen.getByText('common.loading')).toBeInTheDocument();

    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: undefined,
      isLoading: false,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
    view.rerender(<WorkOrderDetailPage />);
    expect(screen.getByText('common.noData')).toBeInTheDocument();

    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: mockWorkOrder,
      isLoading: false,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
    view.rerender(<WorkOrderDetailPage />);
    await user.click(screen.getAllByRole('button')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/work-orders');
  });

  it('应按状态执行开始、提交、验收和关闭操作', async () => {
    const user = userEvent.setup();
    const startMutate = vi.fn();
    const submitMutate = vi.fn();
    const acceptMutate = vi.fn();
    const closeMutate = vi.fn();
    vi.spyOn(workOrderHooks, 'useStartWorkOrder').mockReturnValue({ mutate: startMutate, isPending: false } as unknown as ReturnType<typeof workOrderHooks.useStartWorkOrder>);
    vi.spyOn(approvalHooks, 'useSubmitWorkOrder').mockReturnValue({ mutate: submitMutate, isPending: false } as unknown as ReturnType<typeof approvalHooks.useSubmitWorkOrder>);
    vi.spyOn(workOrderHooks, 'useAcceptWorkOrder').mockReturnValue({ mutate: acceptMutate, isPending: false } as unknown as ReturnType<typeof workOrderHooks.useAcceptWorkOrder>);
    vi.spyOn(workOrderHooks, 'useCloseWorkOrder').mockReturnValue({ mutate: closeMutate, isPending: false } as unknown as ReturnType<typeof workOrderHooks.useCloseWorkOrder>);
    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: { ...mockWorkOrder, status: 'Assigned' },
      isLoading: false,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
    const view = render(<WorkOrderDetailPage />);

    await user.click(screen.getByRole('button', { name: 'workorder.startExecution' }));
    expect(startMutate).toHaveBeenCalledWith('wo-001');

    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: { ...mockWorkOrder, status: 'InProgress', resolution: undefined },
      isLoading: false,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
    view.rerender(<WorkOrderDetailPage />);
    await user.click(screen.getByRole('button', { name: 'workorder.submitForApproval' }));
    expect(submitMutate).toHaveBeenCalledWith({
      id: 'wo-001',
      resolution: '',
      executionReport: '',
      requiredParts: '',
    });

    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: { ...mockWorkOrder, status: 'Completed' },
      isLoading: false,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
    view.rerender(<WorkOrderDetailPage />);
    await user.click(screen.getByRole('button', { name: 'workorder.accept' }));
    expect(acceptMutate).toHaveBeenCalledWith('wo-001');

    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: { ...mockWorkOrder, status: 'Accepted' },
      isLoading: false,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
    view.rerender(<WorkOrderDetailPage />);
    await user.click(screen.getByRole('button', { name: 'workorder.close' }));
    expect(closeMutate).toHaveBeenCalledWith('wo-001');
  });

  it('验收不通过应提交原因，非终态工单应支持取消', async () => {
    const user = userEvent.setup();
    const rejectMutate = vi.fn();
    const cancelMutate = vi.fn();
    vi.spyOn(workOrderHooks, 'useRejectWorkOrder').mockReturnValue({ mutate: rejectMutate, isPending: false } as unknown as ReturnType<typeof workOrderHooks.useRejectWorkOrder>);
    vi.spyOn(workOrderHooks, 'useCancelWorkOrder').mockReturnValue({ mutate: cancelMutate, isPending: false } as unknown as ReturnType<typeof workOrderHooks.useCancelWorkOrder>);
    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: { ...mockWorkOrder, status: 'Completed' },
      isLoading: false,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
    const view = render(<WorkOrderDetailPage />);

    await user.click(screen.getByRole('button', { name: 'workorder.reject' }));
    const rejectInput = screen.getByPlaceholderText('workorder.rejectReasonPlaceholder');
    await user.type(rejectInput, '需要补充维修记录');
    await user.click(screen.getByRole('button', { name: 'common.submit' }));
    expect(rejectMutate).toHaveBeenCalledWith({ id: 'wo-001', reason: '需要补充维修记录' });

    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: { ...mockWorkOrder, status: 'Rejected' },
      isLoading: false,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
    view.rerender(<WorkOrderDetailPage />);
    await user.click(screen.getByRole('button', { name: 'workorder.cancel' }));
    const cancelInput = screen.getByPlaceholderText('workorder.enterCancelReason');
    await user.type(cancelInput, '重复工单');
    await user.click(screen.getByRole('button', { name: 'workorder.confirmCancel' }));
    expect(cancelMutate).toHaveBeenCalledWith({ id: 'wo-001', reason: '重复工单' });
  });

  it('执行中工单在线完成时应携带维修报告和零件，离线时应写入队列', async () => {
    const user = userEvent.setup();
    const completeMutate = vi.fn();
    const enqueue = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(workOrderHooks, 'useCompleteWorkOrder').mockReturnValue({ mutate: completeMutate, isPending: false } as unknown as ReturnType<typeof workOrderHooks.useCompleteWorkOrder>);
    vi.spyOn(offlineQueueHooks, 'useOfflineQueue').mockReturnValue({ enqueue } as unknown as ReturnType<typeof offlineQueueHooks.useOfflineQueue>);
    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: { ...mockWorkOrder, status: 'InProgress', resolution: undefined },
      isLoading: false,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
    const view = render(<WorkOrderDetailPage />);

    const fields = screen.getAllByRole('textbox');
    await user.type(fields[0], '完成轴承更换');
    await user.type(fields[1], '更换轴承并校准');
    await user.type(fields[2], '轴承 x2');
    await user.click(screen.getByRole('button', { name: 'workorder.complete' }));
    expect(completeMutate).toHaveBeenCalledWith({
      id: 'wo-001',
      resolution: '完成轴承更换',
      executionReport: '更换轴承并校准',
      requiredParts: '轴承 x2',
    });

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
    view.rerender(<WorkOrderDetailPage />);
    await user.click(screen.getByRole('button', { name: 'Save to offline queue' }));
    expect(enqueue).toHaveBeenCalledWith(
      'work-order-complete',
      '/api/v1/work-orders/wo-001/complete',
      'PUT',
      expect.objectContaining({ resolution: '完成轴承更换', executionReport: '更换轴承并校准', requiredParts: '轴承 x2' }),
    );
  });

  it('派工应支持选择技术员和无技术员空态，取消工单应提交理由', async () => {
    const user = userEvent.setup();
    const assignMutate = vi.fn((_payload: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.());
    const cancelMutate = vi.fn();
    vi.spyOn(dispatchHooks, 'useAssignFromRecommendation').mockReturnValue({ mutate: assignMutate, isPending: false } as unknown as ReturnType<typeof dispatchHooks.useAssignFromRecommendation>);
    vi.spyOn(workOrderHooks, 'useCancelWorkOrder').mockReturnValue({ mutate: cancelMutate, isPending: false } as unknown as ReturnType<typeof workOrderHooks.useCancelWorkOrder>);
    vi.spyOn(dispatchHooks, 'useTechnicians').mockReturnValue({
      data: [{ userId: 'tech-001', name: '李工', activeWorkCount: 2, skills: ['电气'] }],
    } as unknown as ReturnType<typeof dispatchHooks.useTechnicians>);
    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: { ...mockWorkOrder, status: 'PendingDispatch' },
      isLoading: false,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
    const view = render(<WorkOrderDetailPage />);

    await user.click(screen.getByRole('button', { name: 'workorder.dispatch' }));
    await user.click(screen.getByRole('button', { name: /李工/ }));
    await user.click(screen.getByRole('button', { name: 'workorder.confirmDispatch' }));
    expect(assignMutate).toHaveBeenCalledWith(
      { workOrderId: 'wo-001', technicianUserId: 'tech-001' },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );

    vi.spyOn(dispatchHooks, 'useTechnicians').mockReturnValue({ data: [] } as unknown as ReturnType<typeof dispatchHooks.useTechnicians>);
    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: { ...mockWorkOrder, status: 'PendingDispatch' },
      isLoading: false,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
    view.rerender(<WorkOrderDetailPage />);
    await user.click(screen.getByRole('button', { name: 'workorder.dispatch' }));
    expect(screen.getByText('workorder.noTechnicians')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'common.cancel' }));

    vi.spyOn(workOrderHooks, 'useWorkOrder').mockReturnValue({
      data: { ...mockWorkOrder, status: 'Rejected' },
      isLoading: false,
    } as unknown as ReturnType<typeof workOrderHooks.useWorkOrder>);
    view.rerender(<WorkOrderDetailPage />);
    await user.click(screen.getByRole('button', { name: 'workorder.cancel' }));
    const cancelInput = screen.getByPlaceholderText('workorder.enterCancelReason');
    await user.type(cancelInput, '设备已报废');
    await user.click(screen.getByRole('button', { name: 'workorder.confirmCancel' }));
    expect(cancelMutate).toHaveBeenCalledWith({ id: 'wo-001', reason: '设备已报废' });
  });
});
