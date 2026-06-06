import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import {
  useNotifications,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
  useDeleteNotification,
} from '../useNotifications';

vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

const mockNotification = {
  id: 'notif-001',
  type: 'alert',
  title: '告警触发: temperature',
  content: '指标 temperature 达到 95，严重级别: Critical',
  relatedId: 'alert-001',
  link: '/alerts',
  isRead: false,
  createdAt: '2026-06-06T10:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useNotifications', () => {
  it('应成功获取通知列表', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { items: [mockNotification], total: 1, page: 1, pageSize: 20 },
    });

    const { result } = renderHook(() => useNotifications(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toHaveLength(1);
    expect(mockedApi.get).toHaveBeenCalledWith('/notifications?page=1&pageSize=20');
  });

  it('应支持 unreadOnly 参数', async () => {
    mockedApi.get.mockResolvedValueOnce({
      data: { items: [], total: 0, page: 1, pageSize: 20 },
    });

    const { result } = renderHook(() => useNotifications({ unreadOnly: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.get).toHaveBeenCalledWith('/notifications?page=1&pageSize=20&unreadOnly=true');
  });
});

describe('useUnreadCount', () => {
  it('应成功获取未读数量', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: 5 });

    const { result } = renderHook(() => useUnreadCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBe(5);
    expect(mockedApi.get).toHaveBeenCalledWith('/notifications/unread-count');
  });
});

describe('useMarkRead', () => {
  it('应调用 PUT 接口标记已读', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useMarkRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('notif-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith('/notifications/notif-001/read');
  });
});

describe('useMarkAllRead', () => {
  it('应调用 PUT 接口全部标记已读', async () => {
    mockedApi.put.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useMarkAllRead(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.put).toHaveBeenCalledWith('/notifications/read-all');
  });
});

describe('useDeleteNotification', () => {
  it('应调用 DELETE 接口删除通知', async () => {
    mockedApi.delete.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useDeleteNotification(), {
      wrapper: createWrapper(),
    });

    result.current.mutate('notif-001');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApi.delete).toHaveBeenCalledWith('/notifications/notif-001');
  });
});
