import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { startConnection, stopConnection } from '../lib/signalr';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';

/**
 * SignalR 连接 Hook
 * 在用户认证后自动建立连接，监听告警和遥测事件，
 * 并通过 TanStack Query 自动刷新相关数据
 */
export function useSignalR() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const push = useNotificationStore((s) => s.push);
  const started = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || started.current) return;
    started.current = true;

    startConnection().then((conn) => {
      // 监听告警触发事件
      conn.on('OnAlertTriggered', (data: { alertId: string; alertCode: string; deviceId: string; metric: string; value: number; severity: string }) => {
        push({
          type: 'alert',
          title: `告警：${data.metric}`,
          message: `${data.metric} = ${data.value}（${data.severity}）`,
          link: `/alerts`,
        });
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      });

      // 监听告警解决事件
      conn.on('OnAlertResolved', () => {
        queryClient.invalidateQueries({ queryKey: ['alerts'] });
      });

      // 监听遥测数据更新事件
      conn.on('OnTelemetryUpdate', (deviceId: string) => {
        queryClient.invalidateQueries({ queryKey: ['telemetry', deviceId] });
      });
    }).catch(console.error);

    return () => {
      started.current = false;
      stopConnection();
    };
  }, [isAuthenticated]);
}
