import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import DashboardPage from '../DashboardPage';
import { useDashboardStats, useOee } from '../../hooks/useDashboard';
import { useAlerts } from '../../hooks/useAlerts';
import { useGlobalStats } from '../../hooks/useTenantsAdmin';
import { useTrendWarnings } from '../../hooks/useTrendAnalysis';
import type { DashboardStats } from '../../hooks/useDashboard';

const translations: Record<string, string> = {
  'nav.dashboard': 'Dashboard',
  'device.online': 'Online',
  'device.offline': 'Offline',
  'alert.active': 'Active Alerts',
  'dashboard.pendingWorkOrders': 'Pending Work Orders',
  'dashboard.deviceAvailability': 'Device Availability',
  'dashboard.deviceStatusDistribution': 'Device Status Distribution',
  'dashboard.alertSeverityDistribution': 'Alert Severity Distribution',
  'dashboard.alertTrends': 'Alert Trends',
  'dashboard.workOrderTrend': 'Work Order Trend',
  'dashboard.workOrderStatusDistribution': 'Work Order Status Distribution',
  'dashboard.recentAlerts': 'Recent Alerts',
  'dashboard.trendWarnings.title': 'Trend warnings',
  'dashboard.trendWarnings.description': 'Metrics that may exceed a threshold within 7 days',
  'dashboard.trendWarnings.count': '{{count}} warnings',
  'dashboard.trendWarnings.empty': 'No metrics are expected to exceed a threshold soon',
  'dashboard.trendWarnings.loadFailed': 'Trend warnings failed to load',
  'dashboard.trendWarnings.retry': 'Retry trend warnings',
  'dashboard.trendWarnings.more': '{{count}} more warnings',
  'dashboard.trendWarnings.currentValue': 'Current',
  'dashboard.trendWarnings.threshold': 'Threshold',
  'dashboard.trendWarnings.oneDay': '1 day',
  'dashboard.trendWarnings.days': '{{count}} days',
  'dashboard.trendWarnings.noEstimate': 'No estimate',
  'dashboard.trendWarnings.direction.up': 'Rising',
  'dashboard.trendWarnings.direction.down': 'Falling',
  'dashboard.trendWarnings.direction.stable': 'Stable',
  'dashboard.trendWarnings.direction.unknown': 'Unknown direction',
  'dashboard.trendWarnings.risk.critical': 'Within 1 day',
  'dashboard.trendWarnings.risk.warning': 'Within 3 days',
  'dashboard.trendWarnings.risk.info': 'Within 7 days',
  'dashboard.trendWarnings.risk.noEstimate': 'No time estimate',
  'common.noData': 'No data',
  'common.loading': 'Loading...',
  'common.loadFailed': 'Failed to load data',
  'common.retry': 'Retry',
  'workorder.status.pendingDispatch': 'Pending Dispatch',
  'workorder.status.assigned': 'Assigned',
  'workorder.status.inProgress': 'In Progress',
  'workorder.status.submittedForApproval': 'Pending Approval',
  'workorder.status.completed': 'Completed',
  'workorder.status.accepted': 'Accepted',
  'workorder.status.rejected': 'Rejected',
  'workorder.status.closed': 'Closed',
  'workorder.status.cancelled': 'Cancelled',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('../../hooks/useDashboard', () => ({
  useDashboardStats: vi.fn(),
  useOee: vi.fn(),
}));

vi.mock('../../hooks/useAlerts', () => ({
  useAlerts: vi.fn(),
}));

vi.mock('../../hooks/useTenantsAdmin', () => ({
  useGlobalStats: vi.fn(),
}));

vi.mock('../../hooks/useTrendAnalysis', () => ({
  useTrendWarnings: vi.fn(),
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector: (state: { user: null }) => unknown) => selector({ user: null }),
}));

vi.mock('../../components/charts/TrendChart', () => ({
  TrendChart: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('../../components/charts/PieChart', () => ({
  PieChart: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('../../components/alert/SeverityBadge', () => ({
  SeverityBadge: () => <span>Severity</span>,
}));

const mockedUseDashboardStats = vi.mocked(useDashboardStats);
const mockedUseOee = vi.mocked(useOee);
const mockedUseAlerts = vi.mocked(useAlerts);
const mockedUseGlobalStats = vi.mocked(useGlobalStats);
const mockedUseTrendWarnings = vi.mocked(useTrendWarnings);

beforeEach(() => {
  vi.clearAllMocks();
  const stats: DashboardStats = {
    totalDevices: 2,
    onlineDevices: 1,
    activeAlerts: 0,
    pendingWorkOrders: 1,
    availability: 50,
    alertsBySeverity: {},
    workOrdersByStatus: { PendingDispatch: 1 },
    alertTrend: [],
    workOrderTrend: [],
  };
  mockedUseDashboardStats.mockReturnValue({
    data: stats,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useDashboardStats>);
  mockedUseOee.mockReturnValue({
    data: undefined,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useOee>);
  mockedUseAlerts.mockReturnValue({
    data: { items: [] },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as ReturnType<typeof useAlerts>);
  mockedUseGlobalStats.mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useGlobalStats>);
  mockedUseTrendWarnings.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as never);
});

describe('仪表盘工单状态英文界面', () => {
  it('工单状态分布应使用共享翻译资源而不是中文常量', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Pending Dispatch')).toBeInTheDocument();
    expect(screen.queryByText('待派工')).not.toBeInTheDocument();
  });

  it('Dashboard 应显示趋势预警卡片并复用英文翻译资源', () => {
    render(<DashboardPage />);

    expect(screen.getByRole('heading', { level: 2, name: 'Trend warnings' })).toBeInTheDocument();
    expect(screen.getByText('No metrics are expected to exceed a threshold soon')).toBeInTheDocument();
    expect(screen.queryByText('趋势预警')).not.toBeInTheDocument();
  });

  it('统计加载失败时应显示可重试错误而不是暂无数据', async () => {
    const refetch = vi.fn();
    mockedUseDashboardStats.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useDashboardStats>);
    render(<DashboardPage />);

    expect(screen.getAllByText('Failed to load data').length).toBeGreaterThan(0);
    expect(screen.getByText('Work Order Status Distribution').closest('div')).toHaveTextContent('Failed to load data');
    await userEvent.setup().click(screen.getAllByRole('button', { name: /Retry/ })[0]);
    expect(refetch).toHaveBeenCalled();
  });

  it('最近告警加载失败时应显示可重试错误而不是暂无数据', async () => {
    const refetch = vi.fn();
    mockedUseAlerts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useAlerts>);
    render(<DashboardPage />);

    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.queryByText('No data')).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: /Retry/ }));
    expect(refetch).toHaveBeenCalled();
  });

  it('最近告警成功且为空时应显示空态', () => {
    mockedUseAlerts.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useAlerts>);
    render(<DashboardPage />);

    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.queryByText('Failed to load data')).not.toBeInTheDocument();
  });
});
