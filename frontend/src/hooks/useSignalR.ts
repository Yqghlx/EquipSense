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

      // 设备离线是工业监控基本告警（通信中断=设备/网络/网关故障）。后端 DeviceStatusMonitor 检测到
      // 超时无遥测即标记 Offline，但设备离线不产生遥测→不触发阈值告警，故必须监听此事件刷新
      // 设备列表/Dashboard + 弹通知，否则运维完全不知情（直到手动刷新）。
      conn.on('OnDeviceStatusChanged', (data: { deviceCode: string; deviceName: string; status: string }) => {
        if (data.status === 'Offline') {
          push({
            type: 'alert',
            title: i18n.t('notification.deviceOfflineTitle', { code: data.deviceCode }),
            message: i18n.t('notification.deviceOfflineMessage', { name: data.deviceName, code: data.deviceCode }),
            link: `/devices`,
          });
        }
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['devices'] });
      });

      conn.on('OnTelemetryUpdate', (deviceId: string) => {
        queryClient.invalidateQueries({ queryKey: ['telemetry', deviceId] });
      });
    };

    startConnection().then((conn) => {
      // 仅在首次连接注册处理器。单例 HubConnection + withAutomaticReconnect 重连后 handlers 保留
      //（_methods 存在实例上，reconnect 只重建底层 transport；源码确认 _methods 仅构造函数初始化一次）。
      // 切勿在 onreconnected 重新注册：registerHandlers 每次创建新闭包，@microsoft/signalr 的 .on()
      // 用 indexOf 去重依赖相同函数引用，新闭包引用不同 → 去重失效 → handler 累积，重连 N 次后每个
      // 事件触发 N+1 次（重复弹告警通知、重复 invalidate 触发 N+1 倍请求，工业网络抖动下加剧）。
      registerHandlers(conn);
    }).catch(console.error);

    // 不在组件卸载时断开连接 — SignalR 连接跨路由保持
  }, [isAuthenticated, push, queryClient]);
}
