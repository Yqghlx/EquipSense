import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import WorkOrderListPage from '../WorkOrderListPage';
import { useCreateWorkOrder, useWorkOrders } from '../../hooks/useWorkOrders';
import { useDevices } from '../../hooks/useDevices';
import { usePermission } from '../../hooks/usePermission';
import { toast } from 'sonner';

const mockedToast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: mockedToast,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../hooks/useWorkOrders', () => ({
  useWorkOrders: vi.fn(),
  useCreateWorkOrder: vi.fn(),
  exportWorkOrdersCsv: vi.fn(),
}));

vi.mock('../../hooks/useDevices', () => ({
  useDevices: vi.fn(),
}));

vi.mock('../../hooks/usePermission', () => ({
  usePermission: vi.fn(),
}));

vi.mock('../../components/workorder/WorkOrderForm', () => ({
  WorkOrderForm: ({
    onSubmit,
    onCancel,
    loading,
  }: {
    onSubmit: (data: { title: string; type: string; priority: string; deviceId: string }) => Promise<void> | void;
    onCancel: () => void;
    loading?: boolean;
  }) => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit({
          title: '更换轴承',
          type: 'corrective',
          priority: 'high',
          deviceId: 'device-001',
        });
      }}
    >
      <button type="submit">{loading ? 'common.loading' : 'common.save'}</button>
      <button type="button" onClick={onCancel}>common.cancel</button>
    </form>
  ),
}));

vi.mock('../../components/ui/ExportButton', () => ({
  default: ({ onExport }: { onExport: () => Promise<void> }) => (
    <button type="button" onClick={() => { void onExport(); }}>common.export</button>
  ),
}));

const mockedUseWorkOrders = vi.mocked(useWorkOrders);
const mockedUseCreateWorkOrder = vi.mocked(useCreateWorkOrder);
const mockedUseDevices = vi.mocked(useDevices);
const mockedUsePermission = vi.mocked(usePermission);

beforeEach(() => {
  vi.clearAllMocks();
  mockedUsePermission.mockReturnValue({
    canRead: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canExecute: true,
    canConfigure: false,
    canApprove: false,
    canTriggerAI: false,
    canManage: false,
  });
  mockedUseWorkOrders.mockReturnValue({
    data: { items: [], total: 0, page: 1, pageSize: 20 },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useWorkOrders>);
  mockedUseDevices.mockReturnValue({
    data: { items: [{ id: 'device-001', name: '一号水泵' }], total: 1, page: 1, pageSize: 100 },
  } as unknown as ReturnType<typeof useDevices>);
  mockedUseCreateWorkOrder.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'wo-001' }),
    isPending: false,
  } as unknown as ReturnType<typeof useCreateWorkOrder>);
});

describe('WorkOrderListPage', () => {
  it('创建工单失败时应提示错误并保留弹窗', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockRejectedValue(new Error('validation'));
    mockedUseCreateWorkOrder.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateWorkOrder>);
    render(<WorkOrderListPage />);

    await user.click(screen.getByRole('button', { name: /common.create/ }));
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('workorder.createFailed');
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'common.save' })).toBeInTheDocument();
  });

  it('创建工单成功时应提示成功并关闭弹窗', async () => {
    const user = userEvent.setup();
    render(<WorkOrderListPage />);

    await user.click(screen.getByRole('button', { name: /common.create/ }));
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('workorder.createSuccess');
    });
    expect(screen.queryByRole('button', { name: 'common.save' })).not.toBeInTheDocument();
  });

  it('应支持搜索、状态筛选和分页', async () => {
    const user = userEvent.setup();
    mockedUseWorkOrders.mockReturnValue({
      data: {
        items: [{
          id: 'wo-001',
          workOrderCode: 'WO-001',
          title: '更换轴承',
          status: 'PendingDispatch',
          priority: 'High',
          createdAt: '2026-08-14T08:00:00Z',
          dueDate: '2026-08-15T08:00:00Z',
        }],
        total: 41,
        page: 1,
        pageSize: 20,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useWorkOrders>);
    render(<WorkOrderListPage />);

    await user.type(screen.getByPlaceholderText('common.search...'), 'WO-001');
    expect(screen.getByText('WO-001')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'common.next' }));
    await user.click(screen.getByRole('button', { name: 'common.previous' }));
    expect(screen.getByText('common.totalItems')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'common.export' }));
    await user.click(screen.getByText('WO-001'));
    expect(mockNavigate).toHaveBeenCalledWith('/work-orders/wo-001');
    await user.click(screen.getByRole('button', { name: /common.create/ }));
    await user.click(screen.getByRole('button', { name: 'common.cancel' }));
  });

  it('加载中应显示忙碌状态', () => {
    mockedUseWorkOrders.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useWorkOrders>);
    render(<WorkOrderListPage />);
    expect(screen.getByText('common.loading')).toBeInTheDocument();
  });

  it('列表加载失败时应显示错误态而不是空数据', () => {
    mockedUseWorkOrders.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useWorkOrders>);
    render(<WorkOrderListPage />);

    expect(screen.getByText('common.loadFailed')).toBeInTheDocument();
    expect(screen.queryByText('common.noData')).not.toBeInTheDocument();
  });
});
