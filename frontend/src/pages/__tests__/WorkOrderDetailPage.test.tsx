import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  useTranslation: () => ({ t: (key: string) => key }),
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
});
