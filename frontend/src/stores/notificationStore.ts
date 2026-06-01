import { create } from 'zustand';
import type { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  /** 推送新通知（自动生成 id、时间戳、标记未读） */
  push: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  /** 标记指定通知为已读 */
  markRead: (id: string) => void;
  /** 清除已读通知（保留 1 小时内的已读通知） */
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  push: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false,
    };
    set((state) => ({
      // 最多保留 50 条通知，防止内存泄漏
      notifications: [newNotification, ...state.notifications].slice(0, 50),
    }));
  },

  markRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    }));
  },

  clearAll: () => {
    const now = Date.now();
    set((state) => ({
      // 只清除已读且超过 1 小时的通知
      notifications: state.notifications.filter(
        (n) => !n.read || now - n.timestamp < 3600_000,
      ),
    }));
  },
}));
