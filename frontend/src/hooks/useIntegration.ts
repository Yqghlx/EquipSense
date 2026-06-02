import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

/** 集成配置项 */
export interface IntegrationConfig {
  type: string;
  enabled: boolean;
  config: string;
}

/** 获取集成配置列表 */
export function useIntegrations() {
  return useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const { data } = await api.get('/integrations');
      return data as Record<string, IntegrationConfig>;
    },
  });
}

/** 更新集成配置 */
export function useUpdateIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ type, enabled, config }: { type: string; enabled: boolean; config: string }) => {
      const { data } = await api.put(`/integrations/${type}`, { enabled, config });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}
