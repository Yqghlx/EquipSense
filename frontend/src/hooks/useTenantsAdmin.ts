import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { PagedResult } from '../types';

/** 租户列表项（对应后端 TenantDto） */
export interface TenantAdminItem {
  /** 租户唯一标识 */
  id: string;
  /** 租户名称 */
  name: string;
  /** 租户标识（URL Slug） */
  slug: string;
  /** 套餐等级（Trial / Basic / Professional / Enterprise） */
  plan: string;
  /** 最大设备数 */
  maxDevices: number;
  /** 最大用户数 */
  maxUsers: number;
  /** 是否启用 */
  isActive: boolean;
  /** 创建时间（ISO 8601） */
  createdAt: string;
  /** 租户状态（Active / Frozen / Trial） */
  status: string;
  /** 当前设备数 */
  currentDeviceCount: number;
  /** 当前用户数 */
  currentUserCount: number;
  /** 试用期截止时间 */
  trialEndsAt?: string;
  /** 订阅到期时间 */
  subscriptionEndsAt?: string;
  /** 数据保留天数 */
  dataRetentionDays: number;
  /** 租户时区（IANA ID，如 "Asia/Shanghai"，影响 Dashboard 趋势分组） */
  timeZone: string;
}

/** 租户详情（继承列表项，增加统计信息） */
export interface TenantAdminDetail extends TenantAdminItem {
  /** 活跃告警数 */
  activeAlertCount: number;
  /** 待处理工单数 */
  pendingWorkOrderCount: number;
  /** 本月 AI 分析次数 */
  monthlyAnalysisCount: number;
  /** 管理员用户名 */
  adminUsername: string;
  /** 管理员邮箱 */
  adminEmail?: string;
}

/** 全局统计数据 */
export interface GlobalStats {
  /** 总租户数 */
  totalTenants: number;
  /** 活跃租户数 */
  activeTenants: number;
  /** 试用中租户数 */
  trialTenants: number;
  /** 冻结租户数 */
  frozenTenants: number;
  /** 总设备数 */
  totalDevices: number;
  /** 总用户数 */
  totalUsers: number;
}

/** 租户列表查询参数 */
interface TenantsAdminQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
}

/**
 * 查询租户列表（分页 + 搜索）
 *
 * 调用 GET /admin/tenants
 */
export function useTenantsAdmin(query: TenantsAdminQuery = {}) {
  return useQuery({
    queryKey: ['admin', 'tenants', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set('page', String(query.page));
      if (query.pageSize) params.set('pageSize', String(query.pageSize));
      if (query.keyword) params.set('keyword', query.keyword);
      const { data } = await api.get(`/admin/tenants?${params.toString()}`);
      return data as PagedResult<TenantAdminItem>;
    },
  });
}

/**
 * 查询租户详情
 *
 * 调用 GET /admin/tenants/{id}/detail
 */
export function useTenantDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['admin', 'tenants', id, 'detail'],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/admin/tenants/${id}/detail`);
      return data as TenantAdminDetail;
    },
    enabled: !!id,
  });
}

/**
 * 查询全局统计数据
 *
 * 调用 GET /admin/tenants/stats
 */
export function useGlobalStats() {
  return useQuery({
    queryKey: ['admin', 'globalStats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/tenants/stats');
      return data as GlobalStats;
    },
  });
}

/**
 * 冻结租户
 *
 * 调用 PUT /admin/tenants/{id}/freeze
 */
export function useFreezeTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/admin/tenants/${id}/freeze`);
    },
    onSuccess: () => {
      // 刷新租户列表和全局统计
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['admin', 'globalStats'] });
    },
  });
}

/**
 * 解冻租户
 *
 * 调用 PUT /admin/tenants/{id}/unfreeze
 */
export function useUnfreezeTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/admin/tenants/${id}/unfreeze`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['admin', 'globalStats'] });
    },
  });
}

/**
 * 更新租户时区（v1.4）
 *
 * 调用 PUT /admin/tenants/{id}，body 只传 timeZone 字段
 * 影响范围：Dashboard 趋势聚合按本地日期分组
 */
export function useUpdateTimeZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, timeZone }: { id: string; timeZone: string }) => {
      const { data } = await api.put(`/admin/tenants/${id}`, { timeZone });
      return data as TenantAdminItem;
    },
    onSuccess: () => {
      // 刷新租户列表 + Dashboard（趋势会按时区重新聚合）
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
