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

/** OEE（设备综合效率）数据 */
export interface OeeData {
  /** 综合 OEE（百分比）= A × P × Q */
  oee: number;
  /** 可用率（百分比） */
  availability: number;
  /** 性能指数（百分比） */
  performance: number;
  /** 质量指数（百分比） */
  quality: number;
  /** 设备总数 */
  totalDevices: number;
  /** 在线设备数 */
  onlineDevices: number;
  /** 评估时间（UTC ISO） */
  evaluatedAt: string;
  /** 是否为近似估算值（本系统用代理指标简化计算，非严格工业 OEE） */
  isApproximate?: boolean;
  /** 是否数据不足（无 air_flow 遥测或无设备时为 true，OEE 各维度降级为 0） */
  hasInsufficientData?: boolean;
  /** 各维度的近似说明，供 tooltip 展示 */
  approximationNotes?: Record<string, string>;
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

/**
 * 获取设备综合效率（OEE）
 *
 * OEE = 可用率 × 性能 × 质量，反映设备整体效率。
 */
export function useOee() {
  return useQuery({
    queryKey: ['dashboard', 'oee'],
    queryFn: async () => {
      const { data } = await api.get<OeeData>('/dashboard/oee');
      return data;
    },
    staleTime: 60_000,
  });
}
