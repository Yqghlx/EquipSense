import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import SettingsPage from '../SettingsPage';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const translations: Record<string, string> = {
  'settings.title': 'Settings',
  'settings.users': 'User Management',
  'settings.roles': 'Roles & Permissions',
  'settings.llm': 'LLM Configuration',
  'settings.system': 'System Parameters',
  'settings.integration': 'External Integrations',
  'settings.subscription': 'Subscription',
  'settings.approvalChains': 'Approval chains',
  'settings.notifications': 'Notification preferences',
  'settings.securityMfa': 'Security & MFA',
  'settings.rbacMatrix': 'RBAC Permission Matrix (Read Only)',
  'settings.permissionRole': 'Permission / Role',
  'settings.module.deviceManagement': 'Device Management',
  'settings.module.alertManagement': 'Alert Management',
  'settings.module.workOrderManagement': 'Work Order Management',
  'settings.module.knowledgeBase': 'Knowledge Base',
  'settings.module.reports': 'Reports',
  'settings.module.aiAnalysis': 'AI Analysis',
  'settings.role.systemAdmin': 'System Admin',
  'settings.role.maintenanceLead': 'Maintenance Lead',
  'settings.role.technician': 'Technician',
  'settings.role.operator': 'Operator',
  'settings.role.viewer': 'Viewer',
  'settings.permission.crud': 'CRUD',
  'settings.permission.rw': 'RW',
  'settings.permission.read': 'Read',
  'settings.permission.none': 'None',
  'settings.permission.rwConfigure': 'RW + Configure',
  'settings.permission.rwDispatchAccept': 'RW + Dispatch/Accept',
  'settings.permission.rwVerify': 'RW + Verify',
  'settings.permission.readAcknowledge': 'Read + Acknowledge',
  'settings.permission.readExecute': 'Read + Execute',
  'settings.permission.readQuery': 'Read + Query',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => translations[key] ?? key,
  }),
}));

vi.mock('../../hooks/usePushNotifications', () => ({
  usePushNotifications: vi.fn(),
}));

vi.mock('../../components/settings/MfaSettingsPanel', () => ({ default: () => null }));
vi.mock('../../components/settings/SubscriptionPanel', () => ({ SubscriptionPanel: () => null }));
vi.mock('../../components/settings/ApprovalChainSettings', () => ({ ApprovalChainSettings: () => null }));
vi.mock('../../components/settings/SystemInfoCard', () => ({ SystemInfoCard: () => null }));
vi.mock('../../components/settings/UserManagementPanel', () => ({ UserManagementPanel: () => null }));
vi.mock('../../components/settings/IntegrationSettings', () => ({ IntegrationSettings: () => null }));
vi.mock('../../components/settings/NotificationPreferenceCard', () => ({ NotificationPreferenceCard: () => null }));

const mockedUsePushNotifications = vi.mocked(usePushNotifications);

beforeEach(() => {
  vi.clearAllMocks();
  mockedUsePushNotifications.mockReturnValue({
    isSupported: true,
    isSubscribed: false,
    permission: 'default',
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  } as unknown as ReturnType<typeof usePushNotifications>);
});

describe('设置中心英文界面', () => {
  it('权限矩阵和设置 Tab 不应显示中文硬编码', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    expect(screen.getByRole('tab', { name: 'Approval chains' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Notification preferences' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Security & MFA' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Roles & Permissions' }));

    expect(screen.getByText('RW + Configure')).toBeInTheDocument();
    expect(screen.getByText('RW + Dispatch/Accept')).toBeInTheDocument();
    expect(screen.getAllByText('Read + Acknowledge')).toHaveLength(2);
    expect(screen.queryByText('RW+配置')).not.toBeInTheDocument();
    expect(screen.queryByText('RW+派工验收')).not.toBeInTheDocument();
    expect(screen.queryByText('R+确认')).not.toBeInTheDocument();
  });
});
