/**
 * AI 分析 TanStack Query Hooks
 *
 * 提供分析结果的查询（分页列表、详情）和触发分析的 React Query 封装。
 * 触发分析成功后自动刷新分析列表缓存。
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Analysis, PagedResult, PagedQuery, CreateAnalysisRequest } from '../types';

/** 分析列表过滤条件 */
interface AnalysisFilters {
  /** 按设备 ID 过滤 */
  deviceId?: string;
  /** 按分析级别过滤（prediction / statistics / rule / llm） */
  level?: string;
  /** 按状态过滤（pending / completed / failed） */
  status?: string;
}

/**
 * 获取分析结果分页列表
 *
 * 支持分页、排序及按设备/级别/状态过滤。
 */
export function useAnalyses(query: PagedQuery, filters?: AnalysisFilters) {
  return useQuery({
    queryKey: ['analyses', query, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (filters?.deviceId) params.set('deviceId', filters.deviceId);
      if (filters?.level) params.set('level', filters.level);
      if (filters?.status) params.set('status', filters.status);
      const { data } = await api.get<PagedResult<Analysis>>('/analyses?' + params);
      return data;
    },
  });
}

/**
 * 获取单个分析结果详情
 *
 * 当 id 为空时自动禁用查询，避免无效请求。
 */
export function useAnalysis(id: string) {
  return useQuery({
    queryKey: ['analyses', id],
    queryFn: async () => {
      const { data } = await api.get<Analysis>(`/analyses/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/** 触发新的 AI 分析，成功后刷新分析列表缓存 */
export function useTriggerAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreateAnalysisRequest) => {
      const { data } = await api.post<Analysis>('/analyses', req);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    },
  });
}
