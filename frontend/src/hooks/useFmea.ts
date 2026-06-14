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

export interface UpdateFmeaEntryRequest extends CreateFmeaEntryRequest {}

/**
 * 获取 FMEA 条目列表（分页）
 */
export function useFmeaEntries(params: {
  page?: number;
  pageSize?: number;
  deviceType?: string;
  isEnabled?: boolean;
}) {
  return useQuery({
    queryKey: ['fmea', params],
    queryFn: async () => {
      const { data } = await api.get<FmeaListResponse>('/fmea', { params });
      return data;
    },
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
