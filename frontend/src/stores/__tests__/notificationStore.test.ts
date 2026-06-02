import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore } from '../notificationStore';

/** 每个测试前重置 store 和 crypto mock */
beforeEach(() => {
  useNotificationStore.setState({ notifications: [] });
});

describe('notificationStore', () => {
  describe('push（推送通知）', () => {
    it('应将新通知添加到列表头部', () => {
      const { push } = useNotificationStore.getState();
      push({ type: 'alert', title: '告警1', message: '温度过高' });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe('告警1');
      expect(notifications[0].message).toBe('温度过高');
    });

    it('新通知应自动标记为未读', () => {
      const { push } = useNotificationStore.getState();
      push({ type: 'system', title: '系统通知', message: '系统维护' });

      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].read).toBe(false);
    });

    it('新通知应自动生成 id 和时间戳', () => {
      const { push } = useNotificationStore.getState();
      push({ type: 'workorder', title: '工单通知', message: '新工单创建' });

      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].id).toBeDefined();
      expect(typeof notifications[0].id).toBe('string');
      expect(notifications[0].timestamp).toBeTypeOf('number');
    });

    it('多次推送应按时间倒序排列（最新在前）', () => {
      const { push } = useNotificationStore.getState();
      push({ type: 'alert', title: '第一条', message: '消息1' });
      push({ type: 'alert', title: '第二条', message: '消息2' });
      push({ type: 'alert', title: '第三条', message: '消息3' });

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(3);
      expect(notifications[0].title).toBe('第三条');
      expect(notifications[2].title).toBe('第一条');
    });

    it('通知数量超过 50 条时应移除最旧的（即末尾的）', () => {
      const { push } = useNotificationStore.getState();

      // 推送 55 条通知
      for (let i = 0; i < 55; i++) {
        push({ type: 'alert', title: `通知${i}`, message: `消息${i}` });
      }

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(50);
      // 最新的通知应在头部（通知54 是最后推入的）
      expect(notifications[0].title).toBe('通知54');
      // 通知0 ~ 通知4 应已被移除，最旧保留的是通知5
      expect(notifications[49].title).toBe('通知5');
    });
  });

  describe('markRead（标记已读）', () => {
    it('应将指定通知标记为已读', () => {
      const { push } = useNotificationStore.getState();
      push({ type: 'alert', title: '告警', message: '温度异常' });

      const { notifications } = useNotificationStore.getState();
      const targetId = notifications[0].id;

      useNotificationStore.getState().markRead(targetId);

      const updated = useNotificationStore.getState().notifications;
      expect(updated[0].read).toBe(true);
    });

    it('不应影响其他通知的已读状态', () => {
      const { push } = useNotificationStore.getState();
      push({ type: 'alert', title: '通知A', message: '消息A' });
      push({ type: 'alert', title: '通知B', message: '消息B' });

      const { notifications } = useNotificationStore.getState();
      const targetId = notifications[1].id; // 标记第二条（通知A）

      useNotificationStore.getState().markRead(targetId);

      const updated = useNotificationStore.getState().notifications;
      // 通知A 被标记已读，通知B 保持未读
      expect(updated.find((n) => n.title === '通知A')?.read).toBe(true);
      expect(updated.find((n) => n.title === '通知B')?.read).toBe(false);
    });

    it('标记不存在的 id 不应报错', () => {
      const { push } = useNotificationStore.getState();
      push({ type: 'alert', title: '通知', message: '消息' });

      expect(() => {
        useNotificationStore.getState().markRead('non-existent-id');
      }).not.toThrow();

      const { notifications } = useNotificationStore.getState();
      expect(notifications[0].read).toBe(false);
    });
  });

  describe('clearAll（清除已读通知）', () => {
    it('应清除已读且超过1小时的通知', () => {
      // 手动构造带时间戳的通知，模拟已读且超过1小时
      const oldReadNotification = {
        id: 'old-1',
        type: 'alert' as const,
        title: '旧的已读通知',
        message: '已超过1小时',
        timestamp: Date.now() - 7200_000, // 2小时前
        read: true,
      };

      const newUnreadNotification = {
        id: 'new-1',
        type: 'alert' as const,
        title: '新通知',
        message: '刚刚推送',
        timestamp: Date.now(),
        read: false,
      };

      useNotificationStore.setState({
        notifications: [oldReadNotification, newUnreadNotification],
      });

      useNotificationStore.getState().clearAll();

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toBe('new-1');
    });

    it('应保留1小时内的已读通知', () => {
      const recentReadNotification = {
        id: 'recent-1',
        type: 'system' as const,
        title: '刚读过的通知',
        message: '不到1小时',
        timestamp: Date.now() - 1800_000, // 30分钟前
        read: true,
      };

      useNotificationStore.setState({
        notifications: [recentReadNotification],
      });

      useNotificationStore.getState().clearAll();

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toBe('recent-1');
    });

    it('应保留所有未读通知', () => {
      const oldUnreadNotification = {
        id: 'old-unread-1',
        type: 'alert' as const,
        title: '旧的未读通知',
        message: '很久以前的未读',
        timestamp: Date.now() - 86400_000, // 1天前
        read: false,
      };

      useNotificationStore.setState({
        notifications: [oldUnreadNotification],
      });

      useNotificationStore.getState().clearAll();

      const { notifications } = useNotificationStore.getState();
      expect(notifications).toHaveLength(1);
      expect(notifications[0].id).toBe('old-unread-1');
    });
  });
});
