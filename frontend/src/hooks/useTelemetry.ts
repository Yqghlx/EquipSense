import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

/** 遥测数据点（时序图表使用） */
export interface TelemetryDataPoint {
  /** 采集时间 */
  time: string;
  /** 指标值 */
  value: number;
}

/**
 * 获取设备遥测数据，统一构造可选的指标和时间范围参数。
 */
async function fetchTelemetry(
  deviceId: string,
  metric?: string,
  startTime?: string,
  endTime?: string,
): Promise<TelemetryDataPoint[] | Record<string, number>> {
  const params = new URLSearchParams();
  if (metric) params.set('metric', metric);
  if (startTime) params.set('startTime', startTime);
  if (endTime) params.set('endTime', endTime);
  const { data } = await api.get<TelemetryDataPoint[] | Record<string, number>>(
    `/telemetry/${deviceId}?${params}`,
  );
  return data;
}

/**
 * 设备遥测数据查询 Hook
 *
 * 支持按指标名称和时间范围过滤。
 * staleTime 设为 10 秒，遥测数据频繁更新时减少不必要的请求。
 */
export function useTelemetry(
  deviceId: string,
  metric?: string,
  startTime?: string,
  endTime?: string,
) {
  return useQuery({
    queryKey: ['telemetry', deviceId, metric, startTime, endTime],
    queryFn: () => fetchTelemetry(deviceId, metric, startTime, endTime),
    enabled: !!deviceId,
    staleTime: 10_000,
  });
}

/**
 * 查询设备最近一段滚动时间窗内的遥测数据。
 *
 * 查询键只包含时间窗长度，不包含每次渲染产生的当前时间。这样组件重渲染不会创建
 * 无限的新查询；SignalR 主动失效或手工刷新时，queryFn 仍会重新计算最新边界。
 */
export function useRecentTelemetry(
  deviceId: string,
  metric: string,
  windowMilliseconds: number,
) {
  const hasValidWindow = Number.isFinite(windowMilliseconds) && windowMilliseconds > 0;

  return useQuery({
    queryKey: ['telemetry', deviceId, metric, 'recent', windowMilliseconds],
    queryFn: () => {
      const endMilliseconds = Date.now();
      const startTime = new Date(endMilliseconds - windowMilliseconds).toISOString();
      const endTime = new Date(endMilliseconds).toISOString();
      return fetchTelemetry(deviceId, metric, startTime, endTime);
    },
    enabled: !!deviceId && hasValidWindow,
    staleTime: 10_000,
  });
}
