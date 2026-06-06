/**
 * 通知管理 TanStack Query Hooks
 *
 * 封装通知 API 调用，提供查询、标记已读、删除等操作。
 * 所有变更操作成功后自动刷新相关缓存。
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

/** 通知项 */
export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string | null;
  relatedId: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

/** 通知列表响应 */
interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
}

/** 通知查询参数 */
interface NotificationParams {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}

/**
 * 查询通知列表
 */
export function useNotifications(params: NotificationParams = {}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(params.page ?? 1));
      searchParams.set('pageSize', String(params.pageSize ?? 20));
      if (params.unreadOnly) searchParams.set('unreadOnly', 'true');
      const { data } = await api.get<NotificationListResponse>(`/notifications?${searchParams}`);
      return data;
    },
  });
}

/**
 * 获取未读通知数量
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get<number>('/notifications/unread-count');
      return data;
    },
    // 每 30 秒刷新一次
    refetchInterval: 30_000,
  });
}

/**
 * 标记单条通知为已读
 */
export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * 标记所有通知为已读
 */
export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/**
 * 删除通知
 */
export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
