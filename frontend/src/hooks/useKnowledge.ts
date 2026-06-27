import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { downloadBlob } from '../lib/utils';
import type {
  KnowledgeRule,
  PendingRule,
  FaultCase,
  PagedResult,
  PagedQuery,
  UpdateKnowledgeRuleRequest,
  ImportPreviewResult,
  ImportResult,
  KnowledgeRuleVersion,
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
 * 导入行业预置规则 Mutation Hook
 *
 * 导入行业预置的知识规则到当前租户，成功后使规则列表缓存失效。
 */
export function useImportPresetRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ImportResult>('/knowledge/rules/preset-import');
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

// ============================================================================
// 规则编辑 + 启用/禁用
// ============================================================================

/**
 * 更新知识规则 Mutation Hook
 *
 * 支持部分更新（仅发送变更字段），成功后使规则列表缓存失效。
 */
export function useUpdateKnowledgeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...request }: { id: string } & UpdateKnowledgeRuleRequest) => {
      const { data } = await api.put<KnowledgeRule>(`/knowledge/rules/${id}`, request);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-rules'] });
    },
  });
}

/**
 * 切换知识规则启用/禁用状态 Mutation Hook
 *
 * 调用后端 toggle 端点切换规则启用状态，成功后使规则列表缓存失效。
 */
export function useToggleKnowledgeRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch<KnowledgeRule>(`/knowledge/rules/${id}/toggle`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-rules'] });
    },
  });
}

// ============================================================================
// 导入导出
// ============================================================================

/**
 * 导入预览 Mutation Hook
 *
 * 上传文件并获取预览结果（有效数据 + 错误列表），不执行实际导入。
 */
export function useImportPreview() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<ImportPreviewResult>(
        '/knowledge/rules/import?preview=true',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
  });
}

/**
 * 批量导入规则 Mutation Hook
 *
 * 上传文件执行实际导入，成功后使规则列表缓存失效。
 */
export function useImportRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<ImportResult>(
        '/knowledge/rules/import',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-rules'] });
    },
  });
}

/**
 * 导出规则 Mutation Hook
 *
 * 按指定格式（CSV/JSON）导出规则文件，自动触发浏览器下载。
 */
export function useExportRules() {
  return useMutation({
    mutationFn: async ({ format, deviceType }: { format: 'csv' | 'json'; deviceType?: string }) => {
      const params = new URLSearchParams({ format });
      if (deviceType) params.set('deviceType', deviceType);
      const response = await api.get(`/knowledge/rules/export?${params}`, {
        responseType: 'blob',
      });
      downloadBlob(
        response.data,
        `knowledge_rules_${new Date().toISOString().slice(0, 10)}.${format}`,
        format === 'json' ? 'application/json' : 'text/csv;charset=utf-8',
      );
    },
  });
}

// ============================================================================
// 版本管理
// ============================================================================

/**
 * 规则版本历史查询 Hook
 *
 * 查询指定规则的所有历史版本，仅当 ruleId 非空时启用。
 */
export function useRuleVersions(ruleId: string | null) {
  return useQuery({
    queryKey: ['knowledge-rule-versions', ruleId],
    queryFn: async () => {
      const { data } = await api.get<KnowledgeRuleVersion[]>(
        `/knowledge/rules/${ruleId}/versions`,
      );
      return data;
    },
    enabled: !!ruleId,
  });
}

/**
 * 回滚规则版本 Mutation Hook
 *
 * 将规则回滚到指定版本，成功后同时使规则列表和版本历史缓存失效。
 */
export function useRollbackRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ruleId, version }: { ruleId: string; version: number }) => {
      const { data } = await api.post<KnowledgeRule>(
        `/knowledge/rules/${ruleId}/rollback?version=${version}`,
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-rules'] });
      queryClient.invalidateQueries({
        queryKey: ['knowledge-rule-versions', variables.ruleId],
      });
    },
  });
}

// ============================================================================
// 冲突检测
// ============================================================================

/** 冲突检测结果 */
export interface ConflictResult {
  ruleId: string;
  ruleName: string;
  overlappingMetrics: string[];
}

/**
 * 检测知识规则冲突 Mutation Hook
 *
 * 提交设备类型和条件 JSON，返回与已有规则重叠的指标列表。
 */
export function useCheckConflicts() {
  return useMutation({
    mutationFn: async ({
      deviceType,
      conditions,
      excludeRuleId,
    }: {
      deviceType: string;
      conditions: string;
      excludeRuleId?: string;
    }) => {
      const { data } = await api.post<ConflictResult[]>(
        '/knowledge/rules/check-conflicts',
        { deviceType, conditions, excludeRuleId },
      );
      return data;
    },
  });
}

// ============================================================================
// 批量操作
// ============================================================================

/** 批量审核结果 */
export interface BatchReviewResult {
  successCount: number;
  failCount: number;
  errors: Array<{ id: string; reason: string }>;
}

/**
 * 批量批准候选规则 Mutation Hook
 *
 * 批准后同时使候选规则和正式规则列表缓存失效。
 */
export function useBatchApprovePendingRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      comment,
    }: {
      ids: string[];
      comment?: string;
    }) => {
      const { data } = await api.post<BatchReviewResult>(
        '/knowledge/pending-rules/batch-approve',
        { ids, comment },
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
 * 批量驳回候选规则 Mutation Hook
 *
 * 成功后使候选规则列表缓存失效。
 */
export function useBatchRejectPendingRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ids,
      comment,
    }: {
      ids: string[];
      comment?: string;
    }) => {
      const { data } = await api.post<BatchReviewResult>(
        '/knowledge/pending-rules/batch-reject',
        { ids, comment },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-rules'] });
    },
  });
}
