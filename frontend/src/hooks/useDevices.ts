import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type {
  Device, PagedResult, PagedQuery, CreateDeviceRequest,
  DeviceImportPreviewResult, ImportResult,
} from '../types';

/**
 * 设备列表查询 Hook
 *
 * 支持分页、排序以及按状态/设备类型过滤。
 * queryKey 包含完整查询参数，确保参数变化时自动重新请求。
 */
export function useDevices(query: PagedQuery & { status?: string; deviceType?: string }) {
  return useQuery({
    queryKey: ['devices', query],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(query.page),
        pageSize: String(query.pageSize),
      });
      if (query.sort) params.set('sort', query.sort);
      if (query.order) params.set('order', query.order);
      if (query.status) params.set('status', query.status);
      if (query.deviceType) params.set('deviceType', query.deviceType);
      const { data } = await api.get<PagedResult<Device>>('/devices?' + params);
      return data;
    },
  });
}

/**
 * 单个设备详情查询 Hook
 *
 * 当 id 为空时自动禁用查询，避免无效请求。
 */
export function useDevice(id: string) {
  return useQuery({
    queryKey: ['devices', id],
    queryFn: async () => {
      const { data } = await api.get<Device>(`/devices/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

/**
 * 创建设备 Mutation Hook
 *
 * 成功后自动使设备列表缓存失效，触发重新获取。
 */
export function useCreateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreateDeviceRequest) => {
      const { data } = await api.post<Device>('/devices', req);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

/**
 * 更新设备 Mutation Hook
 *
 * 成功后同时使列表缓存和对应设备详情缓存失效。
 */
export function useUpdateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...req }: CreateDeviceRequest & { id: string }) => {
      const { data } = await api.put<Device>(`/devices/${id}`, req);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['devices', variables.id] });
    },
  });
}

/**
 * 删除设备 Mutation Hook
 *
 * 成功后使设备列表缓存失效。
 */
export function useDeleteDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}

/**
 * 设备导入预览 Hook
 *
 * 上传 CSV/JSON 文件进行预览校验，不写入数据库。
 * 错误信息通过 mutation.error 返回，由调用方展示。
 */
export function useDeviceImportPreview() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<DeviceImportPreviewResult>(
        '/devices/import?preview=true',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
  });
}

/**
 * 执行设备批量导入 Hook
 *
 * 上传文件并执行导入，成功后使设备列表缓存失效。
 * 同时清除 dashboard 缓存（设备数量变化影响统计）。
 */
export function useImportDevices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<ImportResult>(
        '/devices/import',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * 下载设备导入 CSV 模板
 */
export async function downloadImportTemplate(): Promise<void> {
  const response = await api.get('/devices/import/template', {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'device_import_template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * 导出设备列表为 CSV
 *
 * 后端最多返回 10000 条，覆盖前端筛选条件（status / type）。
 * 文件名由后端生成（devices_{timestamp}.csv），保持与 API 一致。
 */
export async function exportDevicesCsv(params: { status?: string; type?: string } = {}): Promise<void> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.type) search.set('type', params.type);
  const query = search.toString();
  const response = await api.get(`/devices/export${query ? `?${query}` : ''}`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `devices_${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/** 健康度刷新响应 */
export interface HealthScoreResult {
  deviceId: string;
  healthScore: number;
  level: string;
}

/**
 * 刷新单个设备健康度评分
 *
 * 调用 POST /api/v1/devices/{id}/health-score，后端基于告警历史+状态+遥测质量重算。
 */
export function useRefreshHealthScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deviceId: string) => {
      const { data } = await api.post<HealthScoreResult>(`/devices/${deviceId}/health-score`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['device'] });
    },
  });
}
