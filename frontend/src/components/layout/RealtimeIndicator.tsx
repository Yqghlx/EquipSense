import { useTranslation } from 'react-i18next';
import { useRealtimeStore, type RealtimeConnectionState } from '../../stores/realtimeStore';

/**
 * SignalR 实时连接状态指示器
 *
 * 工业监控场景下，实时连接中断意味着告警推送、遥测更新全部停止。如果用户无感知
 * （浏览器仍显示在线），可能错过正在发生的 Critical 告警 —— 这是安全隐患。
 * 本组件在 Header 显示一个彩色圆点，让用户一眼看出实时通道是否健康：
 *   🟢 connected     — 实时连接正常
 *   🟡 reconnecting  — 正在重连（最多等 30 秒），实时数据可能延迟
 *   ⚪ disconnected  — 已断开，实时推送已停止，请检查网络或刷新页面
 *
 * 与 OfflineIndicator（监听 navigator.onLine）互补：
 *   浏览器在线 ≠ SignalR 连接正常（服务器重启、代理超时都会让 WebSocket 断而浏览器在线）。
 */
const STATUS_CONFIG: Record<RealtimeConnectionState, { color: string; pulse: boolean; tooltipKey: string }> = {
  connected: { color: 'bg-green-500', pulse: false, tooltipKey: 'realtime.connected' },
  connecting: { color: 'bg-blue-500', pulse: true, tooltipKey: 'realtime.connecting' },
  reconnecting: { color: 'bg-yellow-500', pulse: true, tooltipKey: 'realtime.reconnecting' },
  disconnected: { color: 'bg-gray-400', pulse: false, tooltipKey: 'realtime.disconnected' },
};

export function RealtimeIndicator() {
  const { t } = useTranslation();
  const status = useRealtimeStore((s) => s.status);
  const cfg = STATUS_CONFIG[status];

  return (
    <div
      className="flex items-center gap-1.5"
      title={t(cfg.tooltipKey)}
      role="status"
      aria-label={t(cfg.tooltipKey)}
    >
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${cfg.color}`}>
        {cfg.pulse && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.color} opacity-75`} />
        )}
      </span>
    </div>
  );
}
