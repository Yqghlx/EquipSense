/**
 * 仪表盘统计 TanStack Query Hooks
 *
 * 封装仪表盘统计 API 调用，提供自动缓存和刷新机制。
 */
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

/** 趋势数据点 */
export interface TrendPoint {
  /** 日期（yyyy-MM-dd） */
  date: string;
  /** 数量 */
  count: number;
}

/** 仪表盘统计数据 */
export interface DashboardStats {
  /** 设备总数 */
  totalDevices: number;
  /** 在线设备数 */
  onlineDevices: number;
  /** 活跃告警数 */
  activeAlerts: number;
  /** 待派工工单数 */
  pendingWorkOrders: number;
  /** 设备可用率（百分比） */
  availability: number;
  /** 告警级别分布（级别名 → 数量） */
  alertsBySeverity: Record<string, number>;
  /** 工单状态分布（状态名 → 数量） */
  workOrdersByStatus: Record<string, number>;
  /** 告警趋势（最近 7 天） */
  alertTrend: TrendPoint[];
  /** 工单趋势（最近 7 天） */
  workOrderTrend: TrendPoint[];
}

/**
 * 获取仪表盘统计数据
 *
 * 60 秒缓存策略，避免频繁请求后端。
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>('/dashboard/stats');
      return data;
    },
    staleTime: 60_000,
  });
}
