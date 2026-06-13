import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

/** 连接测试请求参数 */
export interface TestConnectionParams {
  /** 协议类型（opcua / modbus-tcp / modbus-rtu） */
  protocol: string;
  /** 连接配置 JSON 字符串 */
  connectionConfig: string;
}

/** 连接测试结果 */
export interface TestConnectionResult {
  /** 是否连接成功 */
  success: boolean;
  /** 结果描述信息 */
  message: string;
}

/** 创建网关设备请求参数 */
export interface CreateGatewayDeviceParams {
  /** 设备名称 */
  deviceName: string;
  /** 协议类型 */
  protocol: string;
  /** 连接配置 JSON 字符串 */
  connectionConfig: string;
  /** 数据点配置 JSON 字符串 */
  dataPoints: string;
  /** 采集间隔（毫秒），默认 1000 */
  pollIntervalMs?: number;
  /** 关联已有设备 ID（可选） */
  deviceId?: string;
  /** 指定网关标识（可选，不填使用默认网关） */
  gatewayId?: string;
}

/** 网关设备信息 */
export interface GatewayDevice {
  /** 设备唯一标识 */
  id: string;
  /** 网关标识 */
  gatewayId: string;
  /** 关联设备 ID */
  deviceId?: string;
  /** 设备名称 */
  deviceName: string;
  /** 协议类型 */
  protocol: string;
  /** 连接配置 */
  connectionConfig: string;
  /** 数据点配置 */
  dataPoints: string;
  /** 采集间隔（毫秒） */
  pollIntervalMs: number;
  /** 是否启用 */
  enabled: boolean;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 查询网关设备列表
 *
 * 从边缘网关配置 API 获取所有已配置的设备列表。
 */
export function useGatewayDevices() {
  return useQuery({
    queryKey: ['gateway-devices'],
    queryFn: async () => {
      const { data } = await api.get<GatewayDevice[]>('/gateway/devices');
      return data;
    },
  });
}

/**
 * 测试网关设备连接
 *
 * 向边缘网关发送连接测试请求，验证协议和配置是否正确。
 */
export function useTestConnection() {
  return useMutation({
    mutationFn: async (params: TestConnectionParams) => {
      const { data } = await api.post<TestConnectionResult>(
        '/gateway/devices/test-connection',
        params,
      );
      return data;
    },
  });
}

/**
 * 创建网关设备
 *
 * 成功后自动使网关设备列表缓存失效。
 */
export function useCreateGatewayDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: CreateGatewayDeviceParams) => {
      const { data } = await api.post<GatewayDevice>('/gateway/devices', params);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gateway-devices'] });
    },
  });
}

/**
 * 删除网关设备
 *
 * 成功后自动使网关设备列表缓存失效。
 */
export function useDeleteGatewayDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/gateway/devices/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gateway-devices'] });
    },
  });
}

/** 更新网关设备请求参数 */
export interface UpdateGatewayDeviceParams {
  /** 设备名称 */
  deviceName?: string;
  /** 连接配置 JSON 字符串 */
  connectionConfig?: string;
  /** 数据点配置 JSON 字符串 */
  dataPoints?: string;
  /** 采集间隔（毫秒） */
  pollIntervalMs?: number;
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 更新网关设备配置
 *
 * 成功后自动使网关设备列表缓存失效。
 */
export function useUpdateGatewayDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...params }: UpdateGatewayDeviceParams & { id: string }) => {
      const { data } = await api.put<GatewayDevice>(`/gateway/devices/${id}`, params);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gateway-devices'] });
    },
  });
}
