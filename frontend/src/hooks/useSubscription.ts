import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

/** 租户订阅信息 */
export interface SubscriptionInfo {
  tenantId: string;
  plan: string;
  planDisplayName: string;
  maxDevices: number;
  currentDevices: number;
  maxUsers: number;
  currentUsers: number;
  dataRetentionDays: number;
  isTrial: boolean;
  isActive: boolean;
}

/** 获取当前租户订阅信息 */
export function useSubscription(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['subscription', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data } = await api.get(`/admin/tenants/${tenantId}/subscription`);
      return data as SubscriptionInfo;
    },
    enabled: !!tenantId,
  });
}

/** 变更租户计划 */
export function useChangePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tenantId, plan }: { tenantId: string; plan: string }) => {
      await api.put(`/admin/tenants/${tenantId}/plan`, { plan });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription'] });
    },
  });
}
