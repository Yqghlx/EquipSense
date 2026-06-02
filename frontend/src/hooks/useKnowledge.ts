import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type {
  KnowledgeRule,
  PendingRule,
  FaultCase,
  PagedResult,
  PagedQuery,
} from '../types';

// ============================================================================
// 知识规则（正式规则）
// ============================================================================

/**
 * 知识规则列表查询 Hook
 *
 * 支持分页和设备类型过滤。
 */
export function useKnowledgeRules(
  query: PagedQuery & { deviceType?: string },
) {
  return useQuery({
    queryKey: ['knowledge-rules', query],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (query.deviceType) params.set('deviceType', query.deviceType);
      const { data } = await api.get<PagedResult<KnowledgeRule>>(
        '/knowledge/rules?' + params,
      );
      return data;
    },
  });
}

/**
 * 创建知识规则 Mutation Hook
 *
 * 成功后使规则列表缓存失效。
 */
export function useCreateKnowledgeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      req: Omit<KnowledgeRule, 'id' | 'tenantId' | 'successCount' | 'createdAt'>,
    ) => {
      const { data } = await api.post<KnowledgeRule>('/knowledge/rules', req);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-rules'] });
    },
  });
}

// ============================================================================
// 候选规则（待审核）
// ============================================================================

/**
 * 候选规则列表查询 Hook
 *
 * 支持按审核状态过滤。
 */
export function usePendingRules(
  query: PagedQuery & { reviewStatus?: string },
) {
  return useQuery({
    queryKey: ['pending-rules', query],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (query.reviewStatus) params.set('reviewStatus', query.reviewStatus);
      const { data } = await api.get<PagedResult<PendingRule>>(
        '/knowledge/pending-rules?' + params,
      );
      return data;
    },
  });
}

/**
 * 批准候选规则 Mutation Hook
 *
 * 批准后同时使候选规则和正式规则列表缓存失效。
 */
export function useApprovePendingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      comment,
    }: {
      id: string;
      comment?: string;
    }) => {
      const { data } = await api.put<PendingRule>(
        `/knowledge/pending-rules/${id}/approve`,
        { comment },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-rules'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-rules'] });
    },
  });
}

/**
 * 驳回候选规则 Mutation Hook
 *
 * 成功后使候选规则列表缓存失效。
 */
export function useRejectPendingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      comment,
    }: {
      id: string;
      comment?: string;
    }) => {
      const { data } = await api.put<PendingRule>(
        `/knowledge/pending-rules/${id}/reject`,
        { comment },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-rules'] });
    },
  });
}

// ============================================================================
// 故障案例
// ============================================================================

/**
 * 故障案例列表查询 Hook
 *
 * 支持分页查询和设备类型过滤。
 */
export function useFaultCases(
  query: PagedQuery & { deviceType?: string },
) {
  return useQuery({
    queryKey: ['fault-cases', query],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (query.deviceType) params.set('deviceType', query.deviceType);
      const { data } = await api.get<PagedResult<FaultCase>>(
        '/knowledge/cases?' + params,
      );
      return data;
    },
  });
}

// ============================================================================
// 行业预置数据导入
// ============================================================================

/**
 * 导入行业预置数据 Mutation Hook
 *
 * 导入行业预置的知识规则到当前租户，成功后使规则列表缓存失效。
 */
export function useImportPresetData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/knowledge/import', {
        source: 'industry-preset',
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-rules'] });
    },
  });
}

/**
 * 编辑后批准请求参数
 */
export interface ApproveWithEditParams {
  /** 调整后的触发条件 */
  adjustedConditions?: string;
  /** 调整后的结论描述 */
  adjustedConclusion?: string;
  /** 调整后的规则名称 */
  adjustedName?: string;
  /** 审核意见 */
  comment?: string;
}

/**
 * 编辑后批准候选规则 Mutation Hook
 *
 * 允许审核人在批准前对规则内容进行微调，成功后同时使候选规则和正式规则列表缓存失效。
 */
export function useApproveWithEdit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...params }: { id: string } & ApproveWithEditParams) => {
      const { data } = await api.put(`/knowledge/pending-rules/${id}/approve-with-edit`, params);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pending-rules'] });
      qc.invalidateQueries({ queryKey: ['knowledge-rules'] });
    },
  });
}
