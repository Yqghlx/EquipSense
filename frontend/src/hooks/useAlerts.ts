import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Alert, PagedResult, PagedQuery } from '../types';

/** 告警过滤条件 */
interface AlertFilters {
  /** 告警状态（triggered / acknowledged / resolved / suppressed） */
  status?: string;
  /** 严重级别（critical / warning / info） */
  severity?: string;
  /** 关联设备 ID */
  deviceId?: string;
}

/**
 * 告警列表查询 Hook
 *
 * 支持分页、排序以及按状态/严重级别/设备 ID 过滤。
 */
export function useAlerts(query: PagedQuery, filters?: AlertFilters) {
  return useQuery({
    queryKey: ['alerts', query, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (query.sort) params.set('sort', query.sort);
      if (query.order) params.set('order', query.order);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.severity) params.set('severity', filters.severity);
      if (filters?.deviceId) params.set('deviceId', filters.deviceId);
      const { data } = await api.get<PagedResult<Alert>>('/alerts?' + params);
      return data;
    },
  });
}

/**
 * 单个告警详情查询 Hook
 *
 * 当 id 为空时自动禁用查询。
 */
export function useAlert(id: string) {
  return useQuery({
    queryKey: ['alerts', id],
    queryFn: async () => {
      const { data } = await api.get<Alert>(`/alerts/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * 确认告警 Mutation Hook
 *
 * 成功后同时使告警列表和仪表板缓存失效。
 */
export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/alerts/${id}/acknowledge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * 解决告警 Mutation Hook
 *
 * 成功后同时使告警列表和仪表板缓存失效。
 */
export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/alerts/${id}/resolve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
