import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface FmeaEntry {
  id: string;
  tenantId: string;
  deviceType: string;
  failureMode: string;
  cause: string;
  effect: string;
  detection: string;
  recommendedAction: string;
  severity: number;
  occurrence: number;
  detectability: number;
  rpn: number;
  knowledgeRuleId: string | null;
  createdBy: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FmeaListResponse {
  items: FmeaEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateFmeaEntryRequest {
  deviceType: string;
  failureMode: string;
  cause: string;
  effect: string;
  detection: string;
  recommendedAction: string;
  severity: number;
  occurrence: number;
  detectability: number;
  knowledgeRuleId?: string;
}

/** FMEA 表单可关联的知识规则摘要。 */
export interface FmeaKnowledgeRuleOption {
  /** 知识规则 ID。 */
  id: string;
  /** 规则适用的设备类型。 */
  deviceType: string;
  /** 规则名称。 */
  name: string;
  /** 规则是否启用。 */
  enabled: boolean;
  /** 是否为系统租户提供的行业预置规则。 */
  isSystemPreset: boolean;
}

// UpdateFmeaEntryRequest 与 CreateFmeaEntryRequest 字段完全一致，直接复用类型别名
export type UpdateFmeaEntryRequest = CreateFmeaEntryRequest;

/**
 * 获取 FMEA 表单可关联的知识规则摘要。
 * 规则选项是只读查询，实际关联权限仍由后端 FMEA 服务最终校验。
 */
export function useFmeaKnowledgeRuleOptions(
  params: { deviceType?: string; selectedRuleId?: string },
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ['fmea-knowledge-rule-options', params],
    queryFn: async () => {
      const { data } = await api.get<FmeaKnowledgeRuleOption[]>('/fmea/knowledge-rules', { params });
      return data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
  });
}

/**
 * 获取 FMEA 条目列表（分页）
 */
export function useFmeaEntries(params: {
  page?: number;
  pageSize?: number;
  deviceType?: string;
  isEnabled?: boolean;
}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['fmea', params],
    queryFn: async () => {
      const { data } = await api.get<FmeaListResponse>('/fmea', { params });
      return data;
    },
    enabled: options?.enabled ?? true,
  });
}

/**
 * 创建 FMEA 条目
 */
export function useCreateFmeaEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: CreateFmeaEntryRequest) => {
      const { data } = await api.post<FmeaEntry>('/fmea', request);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fmea'] });
    },
  });
}

/**
 * 更新 FMEA 条目
 */
export function useUpdateFmeaEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, request }: { id: string; request: UpdateFmeaEntryRequest }) => {
      const { data } = await api.put<FmeaEntry>(`/fmea/${id}`, request);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fmea'] });
    },
  });
}

/**
 * 删除 FMEA 条目
 */
export function useDeleteFmeaEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/fmea/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fmea'] });
    },
  });
}

/**
 * 切换 FMEA 条目启用/禁用状态
 */
export function useToggleFmeaEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/fmea/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fmea'] });
    },
  });
}
