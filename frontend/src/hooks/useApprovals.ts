/**
 * 审批管理 TanStack Query Hooks
 *
 * 提供审批链模板的查询和变更、工单审批记录查询、
 * 待审批列表查询以及审批通过/驳回等 React Query 封装。
 * 所有变更操作成功后自动刷新相关查询缓存。
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type {
  ApprovalChainTemplate,
  WorkOrderApprovalDto,
  CreateApprovalChainRequest,
} from '../types';

/**
 * 获取审批链模板列表
 *
 * 返回当前租户下所有审批链模板配置。
 */
export function useApprovalChains() {
  return useQuery({
    queryKey: ['approval-chains'],
    queryFn: async () => {
      const { data } = await api.get<ApprovalChainTemplate[]>('/approval-chains');
      return data;
    },
  });
}

/**
 * 获取工单审批记录
 *
 * 返回指定工单的所有审批步骤及状态。
 * 当 workOrderId 为空时自动禁用查询，避免无效请求。
 */
export function useWorkOrderApprovals(workOrderId: string | undefined) {
  return useQuery({
    queryKey: ['work-orders', workOrderId, 'approvals'],
    queryFn: async () => {
      const { data } = await api.get<WorkOrderApprovalDto[]>(
        `/work-orders/${workOrderId}/approvals`,
      );
      return data;
    },
    enabled: !!workOrderId,
  });
}

/**
 * 获取待我审批列表
 *
 * 返回当前用户待处理的所有审批任务。
 */
export function usePendingApprovals() {
  return useQuery({
    queryKey: ['approval-chains', 'pending'],
    queryFn: async () => {
      const { data } = await api.get<WorkOrderApprovalDto[]>('/approval-chains/pending');
      return data;
    },
  });
}

/**
 * 创建审批链模板
 *
 * 成功后自动刷新审批链列表缓存。
 */
export function useCreateApprovalChain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreateApprovalChainRequest) => {
      const { data } = await api.post<ApprovalChainTemplate>('/approval-chains', req);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approval-chains'] }),
  });
}

/**
 * 更新审批链模板
 *
 * 成功后自动刷新审批链列表缓存。
 */
export function useUpdateApprovalChain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...req }: CreateApprovalChainRequest & { id: string }) => {
      const { data } = await api.put<ApprovalChainTemplate>(`/approval-chains/${id}`, req);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approval-chains'] }),
  });
}

/**
 * 删除审批链模板
 *
 * 成功后自动刷新审批链列表缓存。
 */
export function useDeleteApprovalChain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/approval-chains/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['approval-chains'] }),
  });
}

/**
 * 提交工单验收
 *
 * 将 InProgress 状态的工单提交进入审批流程，
 * 成功后刷新工单详情和列表缓存。
 */
export function useSubmitWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/work-orders/${id}/submit`);
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['work-orders', id] });
      qc.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

/**
 * 审批通过
 *
 * 当前审批步骤通过，成功后刷新审批记录和工单缓存。
 */
export function useApproveWorkOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      await api.post(`/work-orders/${id}/approve`, { comment });
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['work-orders', id, 'approvals'] });
      qc.invalidateQueries({ queryKey: ['work-orders', id] });
      qc.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}

/**
 * 审批驳回
 *
 * 当前审批步骤驳回，可附驳回意见，
 * 成功后刷新审批记录和工单缓存。
 */
export function useRejectApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, comment }: { id: string; comment?: string }) => {
      await api.post(`/work-orders/${id}/reject-approval`, { comment });
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['work-orders', id, 'approvals'] });
      qc.invalidateQueries({ queryKey: ['work-orders', id] });
      qc.invalidateQueries({ queryKey: ['work-orders'] });
    },
  });
}
