/**
 * 智能派工 TanStack Query Hooks
 *
 * 提供派工推荐查询、技术人员列表查询和快速派工变更操作。
 * 派工成功后自动刷新工单列表和推荐缓存。
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

/** 派工推荐结果 */
export interface DispatchRecommendation {
  /** 技术人员用户 ID */
  technicianUserId: string;
  /** 技术人员姓名 */
  name: string;
  /** 技能匹配评分（0-1） */
  skillScore: number;
  /** 负载评分（0-1，越高表示越空闲） */
  loadScore: number;
  /** 综合评分（0-1） */
  totalScore: number;
  /** 当前进行中的工单数量 */
  activeWorkCount: number;
  /** 推荐理由 */
  reason: string;
}

/** 技术人员画像 */
export interface TechnicianProfile {
  /** 技术人员唯一标识（UUID） */
  id: string;
  /** 关联用户 ID */
  userId: string;
  /** 姓名 */
  name: string;
  /** 技能标签列表 */
  skills: string[];
  /** 当前进行中工单数 */
  activeWorkCount: number;
  /** 已完成工单总数 */
  completedCount: number;
  /** 平均完成工单耗时（小时） */
  avgCompletionHours?: number;
  /** 当前是否可接单 */
  isAvailable: boolean;
}

/**
 * 获取工单的派工推荐列表
 *
 * 根据技能匹配度和当前负载综合排序，推荐最适合的技术人员。
 * 当 workOrderId 为空时自动禁用查询，避免无效请求。
 */
export function useDispatchRecommendations(workOrderId: string | undefined) {
  return useQuery({
    queryKey: ['dispatch-recommendations', workOrderId],
    queryFn: async () => {
      if (!workOrderId) return [];
      const { data } = await api.get(`/dispatch/${workOrderId}/recommendations`);
      return data as DispatchRecommendation[];
    },
    enabled: !!workOrderId,
  });
}

/**
 * 获取技术人员列表
 *
 * 支持按可用状态过滤，默认仅返回当前可接单的技术人员。
 */
export function useTechnicians(availableOnly = true) {
  return useQuery({
    queryKey: ['technicians', availableOnly],
    queryFn: async () => {
      const { data } = await api.get(`/dispatch/technicians?availableOnly=${availableOnly}`);
      return data as TechnicianProfile[];
    },
  });
}

/**
 * 快速派工变更
 *
 * 基于推荐结果一键指派工单给技术人员。
 * 成功后自动刷新工单列表和派工推荐缓存。
 */
export function useAssignFromRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ workOrderId, technicianUserId }: { workOrderId: string; technicianUserId: string }) => {
      const { data } = await api.put(`/work-orders/${workOrderId}/assign`, {
        assignedTo: technicianUserId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['dispatch-recommendations'] });
    },
  });
}
