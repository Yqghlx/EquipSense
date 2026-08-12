import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubscriptionPanel } from '../SubscriptionPanel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'subscription.title': 'Current subscription',
        'subscription.currentPlan': 'Current plan',
        'subscription.noData': 'No subscription data',
        'subscription.devices': 'Devices',
        'subscription.users': 'Users',
        'subscription.dataRetention': 'Data retention',
        'subscription.days': 'days',
        'subscription.changePlan': 'Change plan',
        'subscription.plans.trial': 'Trial',
        'subscription.plans.basic': 'Basic',
        'subscription.plans.professional': 'Professional',
        'subscription.plans.enterprise': 'Enterprise',
      };
      return translations[key] ?? key;
    },
  }),
}));

vi.mock('../../../stores/authStore', () => ({
  useAuthStore: (selector: (state: { user: { tenantId: string } }) => unknown) =>
    selector({ user: { tenantId: 'tenant-001' } }),
}));

vi.mock('../../../hooks/useSubscription', () => ({
  useSubscription: () => ({
    data: {
      tenantId: 'tenant-001',
      plan: 'Basic',
      planDisplayName: 'Basic',
      maxDevices: 50,
      currentDevices: 4,
      maxUsers: 20,
      currentUsers: 2,
      dataRetentionDays: 90,
      isTrial: false,
      isActive: true,
    },
  }),
  useChangePlan: () => ({ mutate: vi.fn(), isPending: false }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SubscriptionPanel 英文界面', () => {
  it('应使用英文显示所有可选订阅方案', () => {
    render(<SubscriptionPanel />);

    expect(screen.getByText('Current subscription')).toBeInTheDocument();
    expect(screen.getByText('Trial')).toBeInTheDocument();
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
    expect(screen.queryByText(/试用版|基础版|专业版|企业版/)).not.toBeInTheDocument();
  });
});
