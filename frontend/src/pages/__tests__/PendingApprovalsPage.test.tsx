import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import PendingApprovalsPage from '../../pages/PendingApprovalsPage';
import * as useApprovals from '../../hooks/useApprovals';
import type { WorkOrderApprovalDto } from '../../types';

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'common.loading': 'Loading...',
        'common.cancel': 'Cancel',
        'common.actions': 'Actions',
        'pendingApprovals.title': 'Pending approvals',
        'pendingApprovals.taskTitle': 'My pending approval tasks',
        'pendingApprovals.count': '{{count}} pending approvals',
        'pendingApprovals.emptyTitle': 'No pending approval tasks',
        'pendingApprovals.emptyDescription': 'All approval tasks have been processed',
        'pendingApprovals.workOrderId': 'Work order ID',
        'pendingApprovals.stepLabel': 'Approval step',
        'pendingApprovals.step': 'Level {{step}}',
        'pendingApprovals.expectedRole': 'Expected role',
        'pendingApprovals.status': 'Status',
        'pendingApprovals.pending': 'Pending approval',
        'pendingApprovals.approve': 'Approve',
        'pendingApprovals.reject': 'Reject',
        'pendingApprovals.viewDetails': 'View work order details',
        'pendingApprovals.rejectTitle': 'Reject approval',
        'pendingApprovals.rejectDescription': 'Reject level {{step}} approval (work order {{id}}...)',
        'pendingApprovals.rejectReason': 'Rejection reason (optional)',
        'pendingApprovals.rejectPlaceholder': 'Enter a rejection reason...',
        'pendingApprovals.confirmReject': 'Confirm rejection',
        'pendingApprovals.roles.maintenance_lead': 'Maintenance lead',
      };
      return (map[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_, name) => String(options?.[name] ?? `{{${name}}}`));
    },
  }),
}));

/** 工单审批记录模拟数据 */
const mockPendingApproval: WorkOrderApprovalDto = {
  id: 'approval-001',
  workOrderId: 'wo-001234567890',
  stepOrder: 1,
  expectedRole: 'maintenance_lead',
  action: 'Pending' as const,
};

/** 创建测试包装器 */
const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PendingApprovalsPage', () => {
  it('加载中应显示加载状态', () => {
    vi.spyOn(useApprovals, 'usePendingApprovals').mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof useApprovals.usePendingApprovals>);

    vi.spyOn(useApprovals, 'useApproveWorkOrder').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useApprovals.useApproveWorkOrder>);

    vi.spyOn(useApprovals, 'useRejectApproval').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useApprovals.useRejectApproval>);

    render(<PendingApprovalsPage />, { wrapper: createWrapper() });
    // CardDescription 和 CardContent 中都有 Loading...，使用 getAllByText
    expect(screen.getAllByText('Loading...').length).toBeGreaterThanOrEqual(1);
  });

  it('无待审批时应显示空状态', () => {
    vi.spyOn(useApprovals, 'usePendingApprovals').mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useApprovals.usePendingApprovals>);

    vi.spyOn(useApprovals, 'useApproveWorkOrder').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useApprovals.useApproveWorkOrder>);

    vi.spyOn(useApprovals, 'useRejectApproval').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useApprovals.useRejectApproval>);

    render(<PendingApprovalsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('No pending approval tasks')).toBeInTheDocument();
  });

  it('有待审批时应显示列表', () => {
    vi.spyOn(useApprovals, 'usePendingApprovals').mockReturnValue({
      data: [mockPendingApproval],
      isLoading: false,
    } as ReturnType<typeof useApprovals.usePendingApprovals>);

    vi.spyOn(useApprovals, 'useApproveWorkOrder').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useApprovals.useApproveWorkOrder>);

    vi.spyOn(useApprovals, 'useRejectApproval').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useApprovals.useRejectApproval>);

    render(<PendingApprovalsPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/wo-00123/)).toBeInTheDocument();
    expect(screen.getByText('Maintenance lead')).toBeInTheDocument();
    expect(screen.getByText('Pending approval')).toBeInTheDocument();
  });

  it('点击工单 ID 应跳转到工单详情页', async () => {
    const user = userEvent.setup();

    vi.spyOn(useApprovals, 'usePendingApprovals').mockReturnValue({
      data: [mockPendingApproval],
      isLoading: false,
    } as ReturnType<typeof useApprovals.usePendingApprovals>);

    vi.spyOn(useApprovals, 'useApproveWorkOrder').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useApprovals.useApproveWorkOrder>);

    vi.spyOn(useApprovals, 'useRejectApproval').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useApprovals.useRejectApproval>);

    render(<PendingApprovalsPage />, { wrapper: createWrapper() });

    await user.click(screen.getByText(/wo-00123/));
    expect(mockNavigate).toHaveBeenCalledWith('/work-orders/wo-001234567890');
  });

  it('点击驳回按钮应打开驳回对话框', async () => {
    const user = userEvent.setup();

    vi.spyOn(useApprovals, 'usePendingApprovals').mockReturnValue({
      data: [mockPendingApproval],
      isLoading: false,
    } as ReturnType<typeof useApprovals.usePendingApprovals>);

    vi.spyOn(useApprovals, 'useApproveWorkOrder').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useApprovals.useApproveWorkOrder>);

    vi.spyOn(useApprovals, 'useRejectApproval').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useApprovals.useRejectApproval>);

    render(<PendingApprovalsPage />, { wrapper: createWrapper() });

    // 有两个 Reject 文本（行内和对话框按钮），取第一个
    const rejectButtons = screen.getAllByText('Reject');
    await user.click(rejectButtons[0]);

    // 驳回对话框应出现
    expect(screen.getByText('Reject approval')).toBeInTheDocument();
    expect(screen.getByText('Confirm rejection')).toBeInTheDocument();
  });
});
