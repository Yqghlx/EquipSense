import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { AlertRule, PagedResult, PagedQuery, CreateAlertRuleRequest } from '../types';

/**
 * 告警规则列表查询 Hook
 *
 * 支持分页和关键字搜索。
 */
export function useAlertRules(query: PagedQuery & { keyword?: string }) {
  return useQuery({
    queryKey: ['alert-rules', query],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (query.keyword) params.set('keyword', query.keyword);
      const { data } = await api.get<PagedResult<AlertRule>>('/alert-rules?' + params);
      return data;
    },
  });
}

/**
 * 单条告警规则详情查询 Hook
 *
 * 当 id 为空时自动禁用查询。
 */
export function useAlertRule(id: string) {
  return useQuery({
    queryKey: ['alert-rules', id],
    queryFn: async () => {
      const { data } = await api.get<AlertRule>(`/alert-rules/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * 创建告警规则 Mutation Hook
 *
 * 成功后使规则列表缓存失效。
 */
export function useCreateAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreateAlertRuleRequest) => {
      const { data } = await api.post<AlertRule>('/alert-rules', req);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });
}

/**
 * 更新告警规则 Mutation Hook
 *
 * 成功后同时使规则列表和对应规则详情缓存失效。
 */
export function useUpdateAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...req }: CreateAlertRuleRequest & { id: string }) => {
      const { data } = await api.put<AlertRule>(`/alert-rules/${id}`, req);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      queryClient.invalidateQueries({ queryKey: ['alert-rules', variables.id] });
    },
  });
}

/**
 * 删除告警规则 Mutation Hook
 *
 * 成功后使规则列表缓存失效。
 */
export function useDeleteAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/alert-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });
}

/**
 * 启用/停用告警规则
 *
 * 调用 PUT /api/v1/alert-rules/{id}/toggle
 * 运维场景：临时停用规则避免误报，改完再启用，无需删除重建。
 */
export function useToggleAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/alert-rules/${id}/toggle`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
    },
  });
}
