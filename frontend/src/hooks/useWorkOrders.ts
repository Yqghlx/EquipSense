/**
 * 工单管理 TanStack Query Hooks
 *
 * 提供工单的查询（分页列表、详情、流转日志）和变更（创建、指派、开始、
 * 完成、接受、拒绝、关闭、取消）等 React Query 封装。
 * 所有变更操作成功后自动刷新相关查询缓存。
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { downloadBlob } from '../lib/utils';
import type {
  WorkOrder,
  WorkOrderLog,
  PagedResult,
  PagedQuery,
  CreateWorkOrderRequest,
  AssignWorkOrderRequest,
  CompleteWorkOrderRequest,
} from '../types';

/** 工单列表过滤条件 */
interface WorkOrderFilters {
  /** 按状态过滤 */
  status?: string;
  /** 按优先级过滤 */
  priority?: string;
  /** 按设备 ID 过滤 */
  deviceId?: string;
}

/**
 * 获取工单分页列表
 *
 * 支持分页、排序及按状态/优先级/设备过滤。
 */
export function useWorkOrders(query: PagedQuery, filters?: WorkOrderFilters) {
  return useQuery({
    queryKey: ['work-orders', query, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (query.sort) params.set('sort', query.sort);
      if (query.order) params.set('order', query.order);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.deviceId) params.set('deviceId', filters.deviceId);
      const { data } = await api.get<PagedResult<WorkOrder>>('/work-orders?' + params);
      return data;
    },
    // 60s staleTime：工单状态变化需及时反映。正常时由 SignalR 实时 invalidate；
    // 此 staleTime 作为 SignalR 断连期间的兜底（比全局 5 分钟更短）。
    staleTime: 60_000,
  });
}

/**
 * 获取单个工单详情
 *
 * 当 id 为空时自动禁用查询，避免无效请求。
 */
export function useWorkOrder(id: string) {
  return useQuery({
    queryKey: ['work-orders', id],
    queryFn: async () => {
      const { data } = await api.get<WorkOrder>(`/work-orders/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * 获取工单流转日志
 *
 * 返回指定工单的所有状态变更记录，当 workOrderId 为空时自动禁用。
 */
export function useWorkOrderLogs(workOrderId: string) {
  return useQuery({
    queryKey: ['work-orders', workOrderId, 'logs'],
    queryFn: async () => {
      const { data } = await api.get<WorkOrderLog[]>(`/work-orders/${workOrderId}/logs`);
      return data;
    },
    enabled: !!workOrderId,
  });
}

/** 创建工单，成功后刷新工单列表缓存 */
export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreateWorkOrderRequest) => {
      const { data } = await api.post<WorkOrder>('/work-orders', req);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

/** 指派工单，成功后刷新列表和详情缓存 */
export function useAssignWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...req }: AssignWorkOrderRequest & { id: string }) => {
      await api.put(`/work-orders/${id}/assign`, req);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id] });
    },
  });
}

/** 开始执行工单，成功后刷新列表和详情缓存 */
export function useStartWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/work-orders/${id}/start`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', id] });
    },
  });
}

/** 完成工单，成功后刷新列表和详情缓存 */
export function useCompleteWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...req }: CompleteWorkOrderRequest & { id: string }) => {
      await api.put(`/work-orders/${id}/complete`, req);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id] });
    },
  });
}

/** 接受工单，成功后刷新列表和详情缓存 */
export function useAcceptWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/work-orders/${id}/accept`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', id] });
    },
  });
}

/** 拒绝工单，需提供拒绝理由，成功后刷新列表和详情缓存 */
export function useRejectWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.put(`/work-orders/${id}/reject`, { reason });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id] });
    },
  });
}

/** 关闭工单，成功后刷新列表和详情缓存 */
export function useCloseWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/work-orders/${id}/close`);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', id] });
    },
  });
}

/** 取消工单，需提供取消理由，成功后刷新列表和详情缓存 */
export function useCancelWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await api.put(`/work-orders/${id}/cancel`, { reason });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.id] });
    },
  });
}


/**
 * 导出工单列表为 CSV
 *
 * 后端最多返回 10000 条，覆盖前端筛选条件（status / priority / deviceId）。
 * 用于月度运维报表、SLA 合规审计。
 */
export async function exportWorkOrdersCsv(params: {
  status?: string;
  priority?: string;
  deviceId?: string;
} = {}): Promise<void> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.priority) search.set('priority', params.priority);
  if (params.deviceId) search.set('deviceId', params.deviceId);
  const query = search.toString();
  const response = await api.get(`/work-orders/export${query ? `?${query}` : ''}`, {
    responseType: 'blob',
  });
  downloadBlob(response.data, `work_orders_${Date.now()}.csv`);
}
