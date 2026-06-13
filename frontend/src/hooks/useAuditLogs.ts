/**
 * 审计日志 TanStack Query Hooks
 *
 * 封装审计日志 API 调用，提供分页查询和 CSV 导出能力。
 * 审计日志记录系统中所有敏感操作（设备/工单/告警/用户的增删改），用于合规追溯。
 */
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

/** 审计日志项 */
export interface AuditLogItem {
  id: string;
  tenantId: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  description: string;
  ipAddress: string | null;
  requestPath: string | null;
  httpMethod: string | null;
  createdAt: string;
}

/** 审计日志列表响应 */
interface AuditLogListResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

/** 审计日志查询参数 */
export interface AuditLogParams {
  page?: number;
  pageSize?: number;
  action?: string;
  resourceType?: string;
}

/**
 * 分页查询审计日志
 */
export function useAuditLogs(params: AuditLogParams = {}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(params.page ?? 1));
      searchParams.set('pageSize', String(params.pageSize ?? 20));
      if (params.action) searchParams.set('action', params.action);
      if (params.resourceType) searchParams.set('resourceType', params.resourceType);
      const { data } = await api.get<AuditLogListResponse>(`/audit-logs?${searchParams.toString()}`);
      return data;
    },
    staleTime: 30_000,
  });
}

/**
 * 导出审计日志为 CSV（触发浏览器下载）
 */
export async function exportAuditLogsCsv(params: { action?: string; resourceType?: string } = {}) {
  const searchParams = new URLSearchParams();
  if (params.action) searchParams.set('action', params.action);
  if (params.resourceType) searchParams.set('resourceType', params.resourceType);
  const query = searchParams.toString();
  const response = await api.get(`/audit-logs/export${query ? `?${query}` : ''}`, {
    responseType: 'blob',
  });
  triggerDownload(response.data as Blob, `audit_logs_${Date.now()}.csv`);
}

/** 触发浏览器下载 Blob 文件 */
function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
