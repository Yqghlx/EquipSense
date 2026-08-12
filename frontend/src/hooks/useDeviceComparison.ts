import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export interface DeviceMetricSummary {
  deviceId: string;
  deviceCode: string;
  deviceName: string;
  averageValue: number;
  minValue: number;
  maxValue: number;
  latestValue: number;
  dataPointCount: number;
  zScore: number;
  isOutlier: boolean;
}

export interface DeviceComparisonResult {
  deviceType: string;
  metric: string;
  hours: number;
  groupMean: number;
  groupStdDev: number;
  devices: DeviceMetricSummary[];
  message: string | null;
}

export interface DeviceComparisonQuery {
  deviceType?: string;
  metric?: string;
  hours?: number;
  deviceIds?: string[];
}

/**
 * 设备对比查询 Hook
 *
 * - 显式选择设备时：仅允许 2–5 个去重后的设备 ID，未满足条件时禁用请求。
 * - 兼容旧调用：未传 deviceIds 时，保留“同类型全部设备”的历史行为。
 * - 查询键和 URL 中的 deviceIds 均做去重排序，避免相同集合因顺序不同产生重复缓存。
 */
export function useDeviceComparison(params: DeviceComparisonQuery) {
  const normalizedDeviceIds = params.deviceIds
    ? [...new Set(params.deviceIds)].sort()
    : undefined;
  const hasBaseQuery = Boolean(params.deviceType && params.metric && params.hours);
  const hasExplicitDeviceSelection = params.deviceIds !== undefined;
  const hasValidExplicitDeviceSelection = normalizedDeviceIds !== undefined
    && normalizedDeviceIds.length >= 2
    && normalizedDeviceIds.length <= 5;

  return useQuery({
    queryKey: ['device-comparison', {
      deviceType: params.deviceType,
      metric: params.metric,
      hours: params.hours,
      deviceIds: normalizedDeviceIds,
    }],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params.deviceType) search.set('deviceType', params.deviceType);
      if (params.metric) search.set('metric', params.metric);
      if (params.hours) search.set('hours', String(params.hours));
      normalizedDeviceIds?.forEach((deviceId) => search.append('deviceIds', deviceId));
      const { data } = await api.get<DeviceComparisonResult>(`/device-comparison?${search}`);
      return data;
    },
    enabled: hasBaseQuery && (!hasExplicitDeviceSelection || hasValidExplicitDeviceSelection),
  });
}
