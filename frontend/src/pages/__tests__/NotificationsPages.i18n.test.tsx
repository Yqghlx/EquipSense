import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import NotificationsPage from '../../pages/NotificationsPage';
import * as useNotifications from '../../hooks/useNotifications';

const mockNavigate = vi.fn();
const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();
const mockDeleteNotification = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const translations: Record<string, string> = {
        'common.loading': 'Loading...',
        'common.time': 'Time',
        'common.actions': 'Actions',
        'common.delete': 'Delete',
        'common.totalItems': '{{count}} items',
        'common.previous': 'Previous',
        'common.next': 'Next',
        'notifications.title': 'Notifications',
        'notifications.markAllRead': 'Mark all as read',
        'notifications.filterAll': 'All',
        'notifications.filterUnread': 'Unread',
        'notifications.filterAlert': 'Alerts',
        'notifications.filterWorkorder': 'Work orders',
        'notifications.filterSystem': 'System',
        'notifications.emptyTitle': 'No notifications',
        'notifications.emptyUnread': 'All notifications are read',
        'notifications.emptyAll': 'No notifications yet',
        'notifications.type': 'Type',
        'notifications.subject': 'Title',
        'notifications.content': 'Content',
        'notifications.markRead': 'Mark as read',
        'notifications.viewDetails': 'View details',
      };
      return (translations[key] ?? key).replace(/\{\{(\w+)\}\}/g, (_, name) => String(options?.[name] ?? `{{${name}}}`));
    },
  }),
}));

const notification = {
  id: 'notification-001',
  type: 'alert',
  title: 'High temperature alert',
  content: 'Compressor temperature exceeded the threshold',
  relatedId: 'alert-001',
  link: '/alerts/alert-001',
  isRead: false,
  createdAt: '2026-08-12T09:00:00Z',
};

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockMarkRead.mockReset();
  mockMarkAllRead.mockReset();
  mockDeleteNotification.mockReset();
  vi.spyOn(useNotifications, 'useMarkRead').mockReturnValue({
    mutate: mockMarkRead,
    isPending: false,
  } as unknown as ReturnType<typeof useNotifications.useMarkRead>);
  vi.spyOn(useNotifications, 'useMarkAllRead').mockReturnValue({
    mutate: mockMarkAllRead,
    isPending: false,
  } as unknown as ReturnType<typeof useNotifications.useMarkAllRead>);
  vi.spyOn(useNotifications, 'useDeleteNotification').mockReturnValue({
    mutate: mockDeleteNotification,
    isPending: false,
  } as unknown as ReturnType<typeof useNotifications.useDeleteNotification>);
});

describe('NotificationsPage 英文界面', () => {
  it('应显示英文标题、筛选项、表头和操作提示', () => {
    vi.spyOn(useNotifications, 'useNotifications').mockReturnValue({
      data: { items: [notification], total: 1, page: 1, pageSize: 20 },
      isLoading: false,
    } as unknown as ReturnType<typeof useNotifications.useNotifications>);

    render(<NotificationsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alerts' })).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByTitle('Mark as read')).toBeInTheDocument();
    expect(screen.getByTitle('View details')).toBeInTheDocument();
  });

  it('英文空状态应根据筛选条件显示对应提示', () => {
    vi.spyOn(useNotifications, 'useNotifications').mockReturnValue({
      data: { items: [], total: 0, page: 1, pageSize: 20 },
      isLoading: false,
    } as unknown as ReturnType<typeof useNotifications.useNotifications>);

    render(<NotificationsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('No notifications')).toBeInTheDocument();
    expect(screen.getByText('No notifications yet')).toBeInTheDocument();
  });

  it('通知行和操作按钮应分别处理已读、跳转与删除', async () => {
    const user = userEvent.setup();
    vi.spyOn(useNotifications, 'useNotifications').mockReturnValue({
      data: {
        items: [
          notification,
          {
            ...notification,
            id: 'notification-002',
            type: 'workorder',
            title: 'Work order assigned',
            isRead: true,
            link: '',
          },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useNotifications.useNotifications>);

    render(<NotificationsPage />, { wrapper: createWrapper() });

    await user.click(screen.getByText('High temperature alert'));
    expect(mockMarkRead).toHaveBeenCalledWith('notification-001');
    expect(mockNavigate).toHaveBeenCalledWith('/alerts/alert-001');

    await user.click(screen.getByTitle('Mark as read'));
    expect(mockMarkRead).toHaveBeenCalledWith('notification-001');
    await user.click(screen.getByTitle('View details'));
    expect(mockNavigate).toHaveBeenCalledWith('/alerts/alert-001');
    await user.click(screen.getAllByTitle('Delete')[0]);
    expect(mockDeleteNotification).toHaveBeenCalledWith('notification-001');
    await user.click(screen.getByRole('button', { name: 'Mark all as read' }));
    expect(mockMarkAllRead).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Work orders' }));
    expect(screen.getByText('Work order assigned')).toBeInTheDocument();
    expect(screen.queryByText('High temperature alert')).not.toBeInTheDocument();
  });

  it('通知列表加载中和分页状态应正确显示并更新查询参数', async () => {
    const user = userEvent.setup();
    const query = vi.spyOn(useNotifications, 'useNotifications').mockReturnValue({
      data: { items: [], total: 41, page: 1, pageSize: 20 },
      isLoading: false,
    } as unknown as ReturnType<typeof useNotifications.useNotifications>);

    const view = render(<NotificationsPage />, { wrapper: createWrapper() });
    expect(screen.getByText('41 items')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(query.mock.lastCall?.[0]).toMatchObject({ page: 2, pageSize: 20 });

    query.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useNotifications.useNotifications>);
    view.rerender(<NotificationsPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
