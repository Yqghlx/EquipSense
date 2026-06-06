/**
 * 租户账单 hook
 *
 * 提供获取租户账单历史的 TanStack Query 操作。
 */
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

/** 账单记录 */
export interface BillingRecord {
  /** 账单 ID */
  id: string;
  /** 套餐等级 */
  plan: string;
  /** 金额（元） */
  amount: number;
  /** 计费起始时间 */
  periodStart: string;
  /** 计费结束时间 */
  periodEnd: string;
  /** 账单状态：Pending / Paid / Cancelled */
  status: string;
  /** 支付方式 */
  paymentMethod: string;
  /** 备注 */
  remark?: string;
  /** 创建时间 */
  createdAt: string;
}

/** 账单历史响应 */
export interface BillingHistoryResponse {
  items: BillingRecord[];
  total: number;
  page: number;
  pageSize: number;
}

/** 查询租户账单历史 */
export function useBillingHistory(tenantId: string | undefined, page = 1) {
  return useQuery({
    queryKey: ['billing', tenantId, page],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data } = await api.get<BillingHistoryResponse>(
        `/admin/tenants/${tenantId}/billing?page=${page}&pageSize=10`,
      );
      return data;
    },
    enabled: !!tenantId,
  });
}
