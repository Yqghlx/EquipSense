import { create } from 'zustand';

/**
 * SignalR 实时连接状态
 *
 * 工业监控场景下，实时连接中断意味着告警推送、遥测更新、工单状态变更全部停止。
 * 如果用户无感知（浏览器仍显示在线），可能错过正在发生的 Critical 告警，
 * 这是真实的安全隐患。此 store 把 SignalR 的连接状态暴露给 UI，供 Header 显示指示器。
 *
 * 注意与 navigator.onLine（浏览器网络层）区分：
 *   - 浏览器在线但 SignalR 断连：服务器重启、代理超时、WiFi 信号弱导致长连接中断
 *   - 此时 OfflineIndicator 不显示，但实时数据已停 → 需要本 store 的指示器补充
 */
export type RealtimeConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface RealtimeState {
  /** 当前连接状态 */
  status: RealtimeConnectionState;
  /** 上次状态变更时间戳（用于指示器 tooltip 显示"断连 X 秒"） */
  changedAt: number;
  /** 设置连接状态（自动更新 changedAt） */
  setStatus: (status: RealtimeConnectionState) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  status: 'disconnected',
  changedAt: Date.now(),
  setStatus: (status) => set({ status, changedAt: Date.now() }),
}));
