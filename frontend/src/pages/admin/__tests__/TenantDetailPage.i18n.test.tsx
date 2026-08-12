import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TenantDetailPage from '../TenantDetailPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'tenant-001' }),
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'common.loading': 'Loading...',
        'common.save': 'Save',
        'common.saving': 'Saving...',
        'settings.systemInfo': 'System Information',
        'subscription.days': 'days',
        'subscription.changePlan': 'Change plan',
        'admin.tenants.backToList': 'Back to list',
        'admin.tenants.status.active': 'Active',
        'admin.tenants.detail.basicInfo': 'Basic information',
        'admin.tenants.detail.resourceUsage': 'Resource usage',
        'admin.tenants.detail.actions': 'Actions',
        'admin.tenants.detail.admin': 'Administrator',
        'admin.tenants.detail.dataRetention': 'Data retention',
        'admin.tenants.detail.devices': 'Devices',
        'admin.tenants.detail.users': 'Users',
        'admin.tenants.detail.activeAlerts': 'Active alerts',
        'admin.tenants.detail.pendingWorkOrders': 'Pending work orders',
        'admin.tenants.detail.monthlyAnalysis': 'Monthly AI analyses',
        'admin.tenants.detail.timeZone': 'Time zone',
        'admin.tenants.detail.timeZoneDescription': 'Time zone description',
        'admin.tenants.detail.timeZoneHint': 'Time zone hint',
        'admin.tenants.columns.plan': 'Plan',
        'admin.tenants.columns.createdAt': 'Created at',
        'admin.tenants.freeze': 'Freeze',
        'admin.tenants.detail.billing.title': 'Billing history',
        'admin.tenants.detail.billing.empty': 'No billing records',
        'admin.tenants.detail.billing.columns.plan': 'Plan',
        'admin.tenants.detail.billing.columns.amount': 'Amount',
        'admin.tenants.detail.billing.columns.period': 'Billing period',
        'admin.tenants.detail.billing.columns.status': 'Status',
        'admin.tenants.detail.billing.columns.remark': 'Notes',
        'admin.tenants.detail.billing.columns.createdAt': 'Created at',
        'admin.tenants.detail.billing.free': 'Free',
        'admin.tenants.detail.billing.status.paid': 'Paid',
        'admin.tenants.detail.billing.status.cancelled': 'Cancelled',
        'admin.tenants.detail.billing.status.pending': 'Pending',
        'admin.tenants.timeZones.chinaStandard': 'China Standard Time (Beijing)',
      };

      return (translations[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_, name) => (
        String(options?.[name] ?? `{{${name}}}`)
      ));
    },
  }),
}));

vi.mock('../../../hooks/useTenantsAdmin', () => ({
  useTenantDetail: () => ({
    data: {
      id: 'tenant-001',
      name: 'Acme Manufacturing',
      slug: 'acme',
      plan: 'Free',
      maxDevices: 10,
      maxUsers: 5,
      isActive: true,
      createdAt: '2026-08-01T00:00:00Z',
      status: 'Active',
      currentDeviceCount: 2,
      currentUserCount: 1,
      dataRetentionDays: 30,
      timeZone: 'UTC',
      activeAlertCount: 1,
      pendingWorkOrderCount: 2,
      monthlyAnalysisCount: 3,
      adminUsername: 'admin',
      adminEmail: 'admin@example.com',
    },
    isLoading: false,
  }),
  useFreezeTenant: () => ({ mutate: vi.fn(), isPending: false }),
  useUnfreezeTenant: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateTimeZone: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false }),
}));

vi.mock('../../../hooks/useSubscription', () => ({
  useChangePlan: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('../../../hooks/useBilling', () => ({
  useBillingHistory: () => ({
    data: {
      items: [{
        id: 'bill-001',
        plan: 'Free',
        amount: 0,
        periodStart: '2026-08-01T00:00:00Z',
        periodEnd: '2026-08-31T00:00:00Z',
        status: 'Paid',
        paymentMethod: 'none',
        remark: 'Included plan',
        createdAt: '2026-08-01T00:00:00Z',
      }],
    },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TenantDetailPage 账单历史英文界面', () => {
  it('应使用英文展示账单标题、表头、金额和状态', () => {
    render(<TenantDetailPage />);

    const billingTitle = screen.getByText('Billing history');
    const billingCard = billingTitle.closest('[data-slot="card"]');
    expect(billingCard).not.toBeNull();

    const scope = within(billingCard as HTMLElement);
    expect(scope.getByRole('columnheader', { name: 'Plan' })).toBeInTheDocument();
    expect(scope.getByRole('columnheader', { name: 'Amount' })).toBeInTheDocument();
    expect(scope.getByRole('columnheader', { name: 'Billing period' })).toBeInTheDocument();
    expect(scope.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(scope.getAllByText('Free')).toHaveLength(2);
    expect(scope.getByText('Paid')).toBeInTheDocument();
    expect(scope.queryByText(/账单|套餐|金额|计费周期|状态|备注|创建时间|免费|已支付/)).not.toBeInTheDocument();
  });

  it('打开时区选择器时应显示英文候选名称', async () => {
    const user = userEvent.setup();
    render(<TenantDetailPage />);

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByText('China Standard Time (Beijing)')).toBeInTheDocument();
    expect(screen.queryByText('中国标准时间（北京）')).not.toBeInTheDocument();
  });
});
