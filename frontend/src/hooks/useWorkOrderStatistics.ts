/**
 * 工单统计 hook
 *
 * 提供 TanStack Query 查询工单报表统计数据。
 */
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

/** 工单统计 DTO（与后端 WorkOrderStatistics 对应） */
export interface WorkOrderStatistics {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  createdTrend: Array<{ date: string; count: number }>;
  completedTrend: Array<{ date: string; count: number }>;
  avgCompletionHoursByPriority: Record<string, number>;
  slaRateByPriority: Record<string, number>;
}

/** 获取工单统计 */
export function useWorkOrderStatistics(period: 7 | 30 | 90 = 30) {
  return useQuery({
    queryKey: ['work-orders', 'statistics', period],
    queryFn: async () => {
      const { data } = await api.get<WorkOrderStatistics>('/work-orders/statistics', {
        params: { period },
      });
      return data;
    },
    staleTime: 60_000, // 统计数据缓存 1 分钟
  });
}
