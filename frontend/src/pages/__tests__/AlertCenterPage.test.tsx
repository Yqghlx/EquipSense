import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';
import AlertCenterPage from '../AlertCenterPage';
import { useAcknowledgeAlert, useAlerts, useResolveAlert } from '../../hooks/useAlerts';
import { toast } from 'sonner';
import type { Alert } from '../../types';

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

vi.mock('../../hooks/useAlerts', () => ({
  useAlerts: vi.fn(),
  useAcknowledgeAlert: vi.fn(),
  useResolveAlert: vi.fn(),
}));

vi.mock('../../lib/api', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: new Blob(['csv']) }) },
}));

const mockedUseAlerts = vi.mocked(useAlerts);
const mockedUseAcknowledgeAlert = vi.mocked(useAcknowledgeAlert);
const mockedUseResolveAlert = vi.mocked(useResolveAlert);

const activeAlert = {
  id: 'alert-001',
  alertCode: 'ALM-001',
  deviceId: 'device-001',
  deviceName: '一号水泵',
  severity: 'Critical',
  metric: 'temperature',
  value: 95,
  status: 'Active',
  occurredAt: '2026-08-14T08:00:00Z',
  triggerCount: 1,
  acknowledged: false,
  resolved: false,
  createdAt: '2026-08-14T08:00:00Z',
} as Alert;

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseAlerts.mockReturnValue({
    data: { items: [activeAlert], total: 1, page: 1, pageSize: 20 },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useAlerts>);
  mockedUseAcknowledgeAlert.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  } as unknown as ReturnType<typeof useAcknowledgeAlert>);
  mockedUseResolveAlert.mockReturnValue({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  } as unknown as ReturnType<typeof useResolveAlert>);
});

describe('AlertCenterPage', () => {
  it('后端 PascalCase Active 状态应显示确认/解决按钮', () => {
    render(<AlertCenterPage />);

    expect(screen.getByRole('button', { name: 'alert.acknowledge' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'alert.resolve' })).toBeInTheDocument();
  });

  it('确认失败时应提示错误且不关闭后续操作入口', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockRejectedValue(new Error('forbidden'));
    mockedUseAcknowledgeAlert.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAcknowledgeAlert>);
    render(<AlertCenterPage />);

    await user.click(screen.getByRole('button', { name: 'alert.acknowledge' }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith('alert-001');
      expect(toast.error).toHaveBeenCalledWith('alert.acknowledgeFailed');
    });
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'alert.acknowledge' })).toBeEnabled();
  });

  it('确认成功时应提示成功', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mockedUseAcknowledgeAlert.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useAcknowledgeAlert>);
    render(<AlertCenterPage />);

    await user.click(screen.getByRole('button', { name: 'alert.acknowledge' }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('alert.acknowledgeSuccess');
    });
  });

  it('解决失败时应提示错误', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockRejectedValue(new Error('conflict'));
    mockedUseResolveAlert.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useResolveAlert>);
    render(<AlertCenterPage />);

    await user.click(screen.getByRole('button', { name: 'alert.resolve' }));
    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith('alert-001');
      expect(toast.error).toHaveBeenCalledWith('alert.resolveFailed');
    });
  });

  it('已确认告警只显示解决入口', () => {
    mockedUseAlerts.mockReturnValue({
      data: { items: [{ ...activeAlert, status: 'Acknowledged' }], total: 1, page: 1, pageSize: 20 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAlerts>);
    render(<AlertCenterPage />);

    expect(screen.queryByRole('button', { name: 'alert.acknowledge' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'alert.resolve' })).toBeInTheDocument();
  });

  it('应支持分页浏览告警', async () => {
    const user = userEvent.setup();
    mockedUseAlerts.mockReturnValue({
      data: { items: [activeAlert], total: 41, page: 1, pageSize: 20 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAlerts>);
    render(<AlertCenterPage />);

    await user.click(screen.getByRole('button', { name: 'common.next' }));
    await user.click(screen.getByRole('button', { name: 'common.previous' }));
    expect(screen.getByText('common.totalItems')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /common.export/ }));
    await user.click(screen.getByText('ALM-001'));
    expect(screen.getAllByText('ALM-001').length).toBeGreaterThan(0);
  });

  it('加载中和空列表应分别显示忙碌与空态', () => {
    mockedUseAlerts.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAlerts>);
    const view = render(<AlertCenterPage />);
    expect(screen.getByText('common.loading')).toBeInTheDocument();

    mockedUseAlerts.mockReturnValue({
      data: { items: [], total: 0, page: 1, pageSize: 20 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAlerts>);
    view.rerender(<AlertCenterPage />);
    expect(screen.getByText('common.noData')).toBeInTheDocument();
  });

  it('列表加载失败时应显示错误态而不是空数据', () => {
    mockedUseAlerts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAlerts>);
    render(<AlertCenterPage />);

    expect(screen.getByText('common.loadFailed')).toBeInTheDocument();
    expect(screen.queryByText('common.noData')).not.toBeInTheDocument();
  });
});
