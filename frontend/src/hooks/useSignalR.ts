import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { startConnection, stopConnection } from '../lib/signalr';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import i18n from '../i18n';

/**
 * SignalR 连接 Hook
 * 在用户认证后自动建立连接，监听告警和遥测事件，
 * 并通过 TanStack Query 自动刷新相关数据
 *
 * 连接在认证期间持续保持，仅在登出时断开。
 * 使用 started ref 防止 React StrictMode 双重挂载导致的重复连接。
 */
export function useSignalR() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const push = useNotificationStore((s) => s.push);
  const started = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // 用户登出时断开连接
      if (started.current) {
        started.current = false;
        stopConnection();
      }
      return;
    }

    if (started.current) return;
    started.current = true;

    /** 注册所有 SignalR 事件处理器（初始连接 + 重连后都需要调用） */
    const registerHandlers = (conn: import('@microsoft/signalr').HubConnection) => {
      conn.on('OnAlertTriggered', (data: { alertId: string; alertCode: string; deviceId: string; metric: string; value: number; severity: string }) => {
        push({
          type: 'alert',
          title: i18n.t('notification.alertTitle', { metric: data.metric }),
          message: i18n.t('notification.alertMessage', { metric: data.metric, value: data.value, severity: data.severity }),
          link: `/alerts`,
        });
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      });

      conn.on('OnAlertResolved', () => {
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
      });

      conn.on('OnWorkOrderCreated', () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      });

      conn.on('OnWorkOrderStatusChanged', () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      });

      // SLA 超时升级是工业场景最紧急事件之一（设备停机威胁），须即时通知主管并刷新工单列表/Dashboard。
      // 后端 CheckAndEscalateAsync 只改 Priority 不改 Status、不发 WorkOrderStatusChangedEvent，
      // 故必须显式监听 OnWorkOrderEscalated，否则主管看到的还是旧优先级（直到手动刷新页面）。
      conn.on('OnWorkOrderEscalated', (data: { workOrderCode: string; title: string; newPriority: string }) => {
        push({
          type: 'alert',
          title: i18n.t('notification.workOrderEscalatedTitle', { code: data.workOrderCode }),
          message: i18n.t('notification.workOrderEscalatedMessage', { title: data.title, priority: data.newPriority }),
          link: `/work-orders`,
        });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      });

      conn.on('OnTelemetryUpdate', (deviceId: string) => {
        queryClient.invalidateQueries({ queryKey: ['telemetry', deviceId] });
      });
    };

    startConnection().then((conn) => {
      registerHandlers(conn);
      conn.onreconnected(() => registerHandlers(conn));
    }).catch(console.error);

    // 不在组件卸载时断开连接 — SignalR 连接跨路由保持
  }, [isAuthenticated, push, queryClient]);
}
