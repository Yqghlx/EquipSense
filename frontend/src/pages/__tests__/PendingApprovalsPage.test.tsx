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
    t: (key: string) => {
      const map: Record<string, string> = {
        'common.loading': '加载中...',
        'common.cancel': '取消',
        'common.actions': '操作',
      };
      return map[key] ?? key;
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
    // CardDescription 和 CardContent 中都有"加载中..."，使用 getAllByText
    expect(screen.getAllByText('加载中...').length).toBeGreaterThanOrEqual(1);
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
    expect(screen.getByText('暂无待审批任务')).toBeInTheDocument();
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
    expect(screen.getByText('维修主管')).toBeInTheDocument();
    // "待审批"出现多次（h1 标题 + 表格行 Badge），使用 getAllByText
    expect(screen.getAllByText('待审批').length).toBeGreaterThanOrEqual(2);
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

    // 有两个"驳回"按钮（行内和外部），取第一个
    const rejectButtons = screen.getAllByText('驳回');
    await user.click(rejectButtons[0]);

    // 驳回对话框应出现
    expect(screen.getByText('驳回审批')).toBeInTheDocument();
    expect(screen.getByText('确认驳回')).toBeInTheDocument();
  });
});
