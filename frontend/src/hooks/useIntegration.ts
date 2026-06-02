import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import type { IntegrationsMap, IntegrationTestResult } from '../types/integration';

/**
 * 获取当前租户的所有集成配置
 * GET /api/v1/settings/integrations
 */
export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data } = await api.get('/settings/integrations');
      // 从 { integrations: { ... } } 结构中提取集成配置
      const integrations = data?.integrations ?? data;
      return integrations as IntegrationsMap;
    },
  });
}

/**
 * 更新指定集成类型的配置
 * PUT /api/v1/settings/integrations/{type}
 */
export function useUpdateIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, enabled, config }: { type: string; enabled: boolean; config: string }) => {
      const { data } = await api.put(`/settings/integrations/${type}`, { enabled, config });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}

/**
 * 测试指定集成类型的连接
 * POST /api/v1/settings/integrations/{type}/test
 */
export function useTestIntegration() {
  return useMutation<IntegrationTestResult, Error, string>({
    mutationFn: async (type: string) => {
      const { data } = await api.post<IntegrationTestResult>(`/settings/integrations/${type}/test`);
      return data;
    },
  });
}
