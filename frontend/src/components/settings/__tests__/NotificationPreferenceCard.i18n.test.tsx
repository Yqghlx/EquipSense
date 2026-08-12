import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationPreferenceCard } from '../NotificationPreferenceCard';
import * as notificationPreferences from '../../../hooks/useNotificationPreferences';
import type { NotificationPreferences } from '../../../hooks/useNotificationPreferences';

/** 通知偏好设置测试使用的英文翻译。 */
const translations: Record<string, string> = {
  'notifications.preferences.title': 'Notification preferences',
  'notifications.preferences.description': 'Customize how you receive each notification type',
  'notifications.preferences.loading': 'Loading...',
  'notifications.preferences.table.type': 'Notification type',
  'notifications.preferences.table.all': 'All',
  'notifications.preferences.types.alert': 'Alert notifications',
  'notifications.preferences.types.alertDescription': 'When an equipment alert is triggered or changes state',
  'notifications.preferences.types.workorder': 'Work order notifications',
  'notifications.preferences.types.workorderDescription': 'When work orders are created, assigned, or updated',
  'notifications.preferences.types.system': 'System notifications',
  'notifications.preferences.types.systemDescription': 'System configuration changes and subscription reminders',
  'notifications.preferences.channels.signalr': 'Realtime push',
  'notifications.preferences.channels.signalrDescription': 'Show notifications instantly in the page',
  'notifications.preferences.channels.push': 'Browser push',
  'notifications.preferences.channels.pushDescription': 'Push notifications when the browser is closed',
  'notifications.preferences.channels.email': 'Email notifications',
  'notifications.preferences.channels.emailDescription': 'Send to the registered email (SMTP required)',
  'notifications.preferences.push.unsupported': 'This browser does not support push notifications. The browser push channel is unavailable.',
  'notifications.preferences.push.title': 'Browser push subscription',
  'notifications.preferences.push.subscribed': 'Subscribed; browser push notifications are ready',
  'notifications.preferences.push.notSubscribed': 'Not subscribed; enable this to receive browser push notifications',
  'notifications.preferences.push.permissionDenied': 'Notification permission was denied. Enable it manually in your browser settings.',
  'notifications.preferences.toggleChannel': 'Toggle {{type}} via {{channel}}',
  'notifications.preferences.toggleAll': 'Toggle all {{type}} channels',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const value = translations[key] ?? key;
      return value.replace(/\{\{(\w+)\}\}/g, (_, name) => String(options?.[name] ?? `{{${name}}}`));
    },
  }),
}));

vi.mock('../../../hooks/useNotificationPreferences', () => ({
  useNotificationPreferences: vi.fn(),
  useUpdateNotificationPreferences: vi.fn(),
}));

const mockPreferences: NotificationPreferences = {
  alert: { signalr: true, push: true, email: true },
  workorder: { signalr: true, push: true, email: true },
  system: { signalr: true, push: true, email: true },
};

const mockUpdate = vi.fn();

/** 配置通知偏好 hooks 的默认测试返回值。 */
const mockHooks = (prefs: NotificationPreferences | undefined = mockPreferences, isLoading = false) => {
  vi.mocked(notificationPreferences.useNotificationPreferences).mockReturnValue({
    data: prefs,
    isLoading,
  } as ReturnType<typeof notificationPreferences.useNotificationPreferences>);
  vi.mocked(notificationPreferences.useUpdateNotificationPreferences).mockReturnValue({
    mutate: mockUpdate,
    isPending: false,
  } as unknown as ReturnType<typeof notificationPreferences.useUpdateNotificationPreferences>);
};

const renderCard = (options?: {
  pushSupported?: boolean;
  isSubscribed?: boolean;
  permission?: NotificationPermission;
}) => render(
  <NotificationPreferenceCard
    pushSupported={options?.pushSupported ?? true}
    isSubscribed={options?.isSubscribed ?? false}
    permission={options?.permission ?? 'default'}
    onSubscribe={vi.fn(async () => undefined)}
    onUnsubscribe={vi.fn(async () => undefined)}
  />,
);

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks();
});

describe('通知偏好设置英文界面', () => {
  it('应将偏好矩阵和浏览器订阅状态显示为英文', () => {
    renderCard();

    expect(screen.getByText('Notification preferences')).toBeInTheDocument();
    expect(screen.getByText('Customize how you receive each notification type')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Notification type' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Realtime push' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Browser push' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Email notifications' })).toBeInTheDocument();
    expect(screen.getByText('Alert notifications')).toBeInTheDocument();
    expect(screen.getByText('Work order notifications')).toBeInTheDocument();
    expect(screen.getByText('System notifications')).toBeInTheDocument();
    expect(screen.getByText('Browser push subscription')).toBeInTheDocument();
    expect(screen.getByText('Not subscribed; enable this to receive browser push notifications')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Toggle Alert notifications via Realtime push' })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/[\u3400-\u9fff]/);
  });

  it('点击渠道开关应保留现有更新行为并提供英文无障碍名称', async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(screen.getByRole('switch', { name: 'Toggle Alert notifications via Realtime push' }));

    expect(mockUpdate).toHaveBeenCalledWith({
      alert: { signalr: false, push: true, email: true },
      workorder: mockPreferences.workorder,
      system: mockPreferences.system,
    });
  });

  it('应分别提示浏览器不支持和权限被拒绝的状态', () => {
    const { unmount } = renderCard({ pushSupported: false });
    expect(screen.getByText('This browser does not support push notifications. The browser push channel is unavailable.'))
      .toBeInTheDocument();
    unmount();

    renderCard({ permission: 'denied' });
    expect(screen.getByText('Notification permission was denied. Enable it manually in your browser settings.'))
      .toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Browser push subscription' }))
      .toHaveAttribute('aria-disabled', 'true');
  });

  it('加载中应显示英文加载状态', () => {
    mockHooks(undefined, true);

    renderCard();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
