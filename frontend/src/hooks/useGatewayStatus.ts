/**
 * 网关状态 hook
 *
 * 提供获取网关实时运行状态的 TanStack Query 操作。
 */
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

/** 网关采集指标 */
export interface GatewayMetrics {
  /** 采集总次数 */
  collections: number;
  /** 采集错误次数 */
  errors: number;
  /** 上传成功次数 */
  uploads: number;
  /** 上传失败次数 */
  uploadFailures: number;
  /** 断网重传次数 */
  replays: number;
  /** 缓冲队列深度 */
  bufferQueueDepth: number;
}

/** 网关运行状态 */
export interface GatewayStatus {
  /** 运行状态：healthy / unreachable / offline */
  status: string;
  /** 网关标识 */
  gatewayId?: string;
  /** 租户 ID */
  tenantId?: string;
  /** 后端 API 地址 */
  backendUrl?: string;
  /** MQTT Broker 地址 */
  mqttBroker?: string;
  /** OPC UA 安全模式 */
  securityMode?: string;
  /** 运行时长字符串 */
  uptime?: string;
  /** 运行秒数 */
  uptimeSeconds?: number;
  /** 启动时间 */
  startedAt?: string;
  /** 采集指标 */
  metrics?: GatewayMetrics;
  /** 状态消息 */
  message?: string;
}

/** 查询网关实时运行状态 */
export function useGatewayStatus() {
  return useQuery({
    queryKey: ['gateway-status'],
    queryFn: async () => {
      const { data } = await api.get<GatewayStatus>('/gateway/status');
      return data;
    },
    refetchInterval: 15000, // 每 15 秒刷新
  });
}
