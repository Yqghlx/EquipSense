import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { Device, PagedResult, PagedQuery, CreateDeviceRequest } from '../types';

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
