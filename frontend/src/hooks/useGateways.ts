import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

/** 网关信息 */
export interface Gateway {
  id: string;
  gatewayId: string;
  tenantId: string;
  name: string;
  description?: string;
  host: string;
  healthPort: number;
  status: 'online' | 'offline' | 'disabled';
  lastHeartbeatAt?: string;
  uptimeSeconds?: number;
  version?: string;
  enabled: boolean;
  createdAt: string;
  deviceCount: number;
}

/**
 * 查询当前租户的网关列表
 */
export function useGateways() {
  return useQuery({
    queryKey: ['gateways'],
    queryFn: async () => {
      const { data } = await api.get<Gateway[]>('/gateways');
      return data;
    },
    refetchInterval: 15000,
  });
}
