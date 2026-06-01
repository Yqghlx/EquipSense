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
    queryFn: async () => {
      const params = new URLSearchParams();
      if (metric) params.set('metric', metric);
      if (startTime) params.set('startTime', startTime);
      if (endTime) params.set('endTime', endTime);
      const { data } = await api.get<TelemetryDataPoint[] | Record<string, number>>(
        `/telemetry/${deviceId}?${params}`,
      );
      return data;
    },
    enabled: !!deviceId,
    staleTime: 10_000,
  });
}
