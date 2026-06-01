import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { DeviceTypeTemplate, QuickRegisterRequest } from '../types';

/**
 * 设备类型模板列表查询 Hook
 *
 * 支持按行业筛选模板。industry 为空时返回所有模板。
 */
export function useDeviceTemplates(industry?: string) {
  return useQuery({
    queryKey: ['device-templates', industry],
    queryFn: async () => {
      const params = industry ? `?industry=${encodeURIComponent(industry)}` : '';
      const { data } = await api.get<DeviceTypeTemplate[]>(`/device-config/templates${params}`);
      return data;
    },
  });
}

/**
 * 快速注册设备 Mutation Hook
 *
 * 注册成功后自动使设备列表缓存失效，触发重新获取。
 */
export function useQuickRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: QuickRegisterRequest) => {
      const { data } = await api.post('/device-config/quick-register', request);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });
}
